import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { v4 as uid } from 'uuid'
import { IPC } from '../shared/ipc'
import { eng } from './eng/eng'
import { probe, mkWave, importMediaFiles } from './eng/med'
import { loadOutCfg, loadStrmCfg, loadMedOutCfg, saveMedOutCfg, readDefaultFixLib, saveDefaultFixLib } from './eng/cap/outStore'
import { listPorts } from './eng/cap/usbDmx'
import { discoverWled } from './eng/cap/wledDisc'
import { probeWled } from './eng/cap/wledProbe'
import { mergeFixTypes, parseFixtureLibrary, serializeFixtureLibrary } from '../shared/fixLib'
import type { TaskProgress } from '../shared/taskProg'
import type { ShowFile, StrmCfg } from '../shared/types'
import type { OutCfg } from '../shared/outCfg'
import type { MedOutCfg } from '../shared/medOut'
import { patchMedOutCfg } from '../shared/medOut'

function siblingCfx(showPath: string) {
  return showPath.replace(/\.(cshow|json|cap|captivate)$/i, '.cfx')
}

function mergeSiblingFixLib(showPath: string) {
  const cfx = siblingCfx(showPath)
  if (!fs.existsSync(cfx)) return
  try {
    const lib = parseFixtureLibrary(fs.readFileSync(cfx, 'utf8'))
    eng.show.fixLib = mergeFixTypes(eng.show.fixLib, lib)
  } catch (e) {
    console.warn('sibling cfx load failed', e)
  }
}

const wins = new Map<string, BrowserWindow>()

function winUrl(role: string, outId?: string) {
  const base = process.env.VITE_DEV_SERVER_URL ?? `file://${path.join(__dirname, '../dist/index.html')}`
  const params = new URLSearchParams({ win: role })
  if (outId) params.set('outId', outId)
  return `${base}?${params.toString()}`
}

function outWinKey(outId: string) {
  return `out:${outId}`
}

function placeOnDisplay(w: BrowserWindow, displayId?: number) {
  const d =
    displayId != null
      ? screen.getAllDisplays().find((x) => x.id === displayId)
      : screen.getPrimaryDisplay()
  if (!d) return false
  w.setBounds(d.bounds)
  w.setFullScreen(true)
  return true
}

function mkWin(role: string, opts: Electron.BrowserWindowConstructorOptions = {}, outId?: string) {
  const w = new BrowserWindow({
    width: role === 'proj' ? 1400 : 900,
    height: role === 'proj' ? 900 : 600,
    backgroundColor: '#121212',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    ...opts,
  })
  const key = outId ? outWinKey(outId) : role
  wins.set(key, w)
  eng.reg(w)
  w.on('closed', () => wins.delete(key))
  void w.loadURL(winUrl(role, outId))
  return w
}

function mkOutWin(outId: string, displayId?: number) {
  const key = outWinKey(outId)
  let w = wins.get(key)
  if (!w || w.isDestroyed()) {
    w = mkWin(
      'out',
      {
        title: `Video Output · ${outId}`,
        backgroundColor: '#000000',
        autoHideMenuBar: true,
        fullscreenable: true,
      },
      outId
    )
  }
  placeOnDisplay(w, displayId)
  w.show()
  w.focus()
  return w
}

function pushShow() {
  for (const w of wins.values()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.SHOW_PUSH, eng.show)
  }
}

function pushDmx() {
  for (const w of wins.values()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.OUT_DMX_PUSH, eng.dmx.getConn())
  }
}

function pushProgress(sender: Electron.WebContents, p: TaskProgress) {
  if (!sender.isDestroyed()) sender.send(IPC.TASK_PROGRESS, p)
}

function wireIpc() {
  ipcMain.handle(IPC.CLK_GET, () => eng.clk.snap())
  ipcMain.handle(IPC.CLK_PLAY, () => eng.clk.play())
  ipcMain.handle(IPC.CLK_PAUSE, () => eng.clk.pause())
  ipcMain.handle(IPC.CLK_STOP, () => {
    eng.onStop()
    eng.clk.stop()
  })
  ipcMain.handle(IPC.CLK_SEEK, (_e, ms: number) => eng.clk.seek(ms))

  ipcMain.handle(IPC.SHOW_GET, () => eng.show)
  ipcMain.handle(IPC.SHOW_SET, (_e, show: ShowFile) => {
    eng.setShow(show)
    pushShow()
    return eng.show
  })
  ipcMain.handle(IPC.SHOW_SAVE, async (event) => {
    const send = (p: TaskProgress) => pushProgress(event.sender, p)
    const r = await dialog.showSaveDialog({ filters: [{ name: 'Show', extensions: ['cshow'] }] })
    if (r.canceled || !r.filePath) return null
    send({ label: 'Writing show file…', progress: 30 })
    fs.writeFileSync(r.filePath, JSON.stringify(eng.show, null, 2))
    send({ label: 'Writing fixture library…', progress: 75 })
    fs.writeFileSync(siblingCfx(r.filePath), serializeFixtureLibrary(eng.show.fixLib))
    send({ label: 'Save complete', progress: 100 })
    return r.filePath
  })
  ipcMain.handle(IPC.SHOW_OPEN, async (event) => {
    const send = (p: TaskProgress) => pushProgress(event.sender, p)
    const r = await dialog.showOpenDialog({ filters: [{ name: 'Show', extensions: ['cshow', 'json'] }] })
    if (r.canceled || !r.filePaths[0]) return null
    send({ label: 'Reading project…', progress: 25 })
    const raw = fs.readFileSync(r.filePaths[0], 'utf8')
    send({ label: 'Parsing project…', progress: 55 })
    const show = JSON.parse(raw) as ShowFile
    eng.setShow(show)
    send({ label: 'Loading fixtures…', progress: 80 })
    mergeSiblingFixLib(r.filePaths[0])
    pushShow()
    send({ label: 'Open complete', progress: 100 })
    return eng.show
  })

  ipcMain.handle(IPC.MED_IMPORT, async (event) => {
    const send = (p: TaskProgress) => pushProgress(event.sender, p)
    const r = await dialog.showOpenDialog({
      filters: [{ name: 'Media', extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v'] }],
      properties: ['openFile', 'multiSelections'],
    })
    if (r.canceled) return { added: 0, errors: [] as string[] }
    send({ label: 'Importing media…', progress: -1 })
    const cacheDir = path.join(app.getPath('userData'), 'wave-cache')
    const { added, errors } = await importMediaFiles(r.filePaths, cacheDir, send)
    eng.show.media.push(...added)
    pushShow()
    send({ label: 'Import complete', progress: 100 })
    return { added: added.length, errors }
  })
  ipcMain.handle(IPC.MED_IMPORT_PATHS, async (event, files: string[]) => {
    if (!Array.isArray(files) || !files.length) return { added: 0, errors: [] as string[] }
    const send = (p: TaskProgress) => pushProgress(event.sender, p)
    send({ label: 'Importing media…', progress: -1 })
    const cacheDir = path.join(app.getPath('userData'), 'wave-cache')
    const { added, errors } = await importMediaFiles(files, cacheDir, send)
    eng.show.media.push(...added)
    pushShow()
    send({ label: 'Import complete', progress: 100 })
    return { added: added.length, errors }
  })

  ipcMain.handle(IPC.OUT_STATUS, () => eng.dmx.getStatus())
  ipcMain.handle(IPC.OUT_CFG_GET, () => eng.dmx.getCfg())
  ipcMain.handle(IPC.OUT_CFG_SET, (_e, cfg: Partial<OutCfg>) => {
    eng.dmx.setCfg(cfg)
    eng.pushOut()
    return eng.dmx.getCfg()
  })
  ipcMain.handle(IPC.OUT_PORTS, () => listPorts())
  ipcMain.handle(IPC.OUT_USB_ERR, () => eng.dmx.usbErr())
  ipcMain.handle(IPC.OUT_DMX_GET, () => eng.dmx.getConn())

  ipcMain.handle(IPC.WLED_DISCOVER, (_e, timeoutMs?: number) => discoverWled(timeoutMs))
  ipcMain.handle(IPC.WLED_PROBE, (_e, host: string) => probeWled(host))

  ipcMain.handle(IPC.FIX_IMPORT, async () => {
    const r = await dialog.showOpenDialog({
      filters: [{ name: 'Fixture library', extensions: ['json', 'cfx', 'captivate-fixtures'] }],
      properties: ['openFile'],
    })
    if (r.canceled || !r.filePaths[0]) return eng.show.fixLib
    const incoming = parseFixtureLibrary(fs.readFileSync(r.filePaths[0], 'utf8'))
    eng.show.fixLib = mergeFixTypes(eng.show.fixLib, incoming)
    saveDefaultFixLib(serializeFixtureLibrary(eng.show.fixLib))
    pushShow()
    return eng.show.fixLib
  })
  ipcMain.handle(IPC.FIX_LIB_LOAD, async () => {
    const r = await dialog.showOpenDialog({
      filters: [{ name: 'Fixture library', extensions: ['json', 'cfx', 'captivate-fixtures'] }],
      properties: ['openFile'],
    })
    if (r.canceled || !r.filePaths[0]) return eng.show.fixLib
    eng.show.fixLib = parseFixtureLibrary(fs.readFileSync(r.filePaths[0], 'utf8'))
    saveDefaultFixLib(serializeFixtureLibrary(eng.show.fixLib))
    pushShow()
    return eng.show.fixLib
  })
  ipcMain.handle(IPC.FIX_LIB_SYNC, () => {
    saveDefaultFixLib(serializeFixtureLibrary(eng.show.fixLib))
  })
  ipcMain.handle(IPC.FIX_LIB_SAVE, async () => {
    const r = await dialog.showSaveDialog({
      filters: [{ name: 'Fixture library', extensions: ['cfx', 'json'] }],
      defaultPath: 'fixtures.cfx',
    })
    if (r.canceled || !r.filePath) return null
    fs.writeFileSync(r.filePath, serializeFixtureLibrary(eng.show.fixLib))
    saveDefaultFixLib(serializeFixtureLibrary(eng.show.fixLib))
    return r.filePath
  })
  ipcMain.handle(IPC.FIX_BG_PICK, async () => {
    const r = await dialog.showOpenDialog({
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      properties: ['openFile'],
    })
    if (r.canceled || !r.filePaths[0]) return null
    eng.show.stage = { ...eng.show.stage, bgPath: r.filePaths[0] }
    pushShow()
    return r.filePaths[0]
  })
  ipcMain.handle(IPC.STRM_GET, () => eng.strm.get())
  ipcMain.handle(IPC.STRM_SET, (_e, cfg: Partial<StrmCfg>) => {
    eng.strm.set(cfg)
    eng.pushOut()
    return eng.strm.get()
  })

  ipcMain.handle(IPC.MED_OUT_GET, () => loadMedOutCfg())
  ipcMain.handle(IPC.MED_OUT_SET, (_e, patch: Partial<MedOutCfg>) => {
    const next = patchMedOutCfg(loadMedOutCfg(), patch)
    saveMedOutCfg(next)
    return next
  })

  ipcMain.handle(IPC.DISP_LIST, () =>
    screen.getAllDisplays().map((d, i) => ({
      id: d.id,
      label: `Display ${i + 1} (${d.size.width}x${d.size.height})`,
      primary: d.id === screen.getPrimaryDisplay().id,
    }))
  )

  ipcMain.handle(IPC.WIN_PREV, () => {
    if (!wins.has('prev')) mkWin('prev', { width: 640, height: 360, title: 'Preview' })
    else wins.get('prev')!.focus()
  })
  ipcMain.handle(IPC.WIN_OUT, () => {
    mkOutWin('vid-out-1')
    return true
  })
  ipcMain.handle(IPC.WIN_OUT_OPEN, (_e, outId: string, displayId?: number) => {
    if (!outId) return false
    mkOutWin(outId, displayId)
    return true
  })
  ipcMain.handle(IPC.WIN_FIX, () => {
    if (!wins.has('fix')) mkWin('fix', { title: 'Fixtures' })
    else wins.get('fix')!.focus()
  })
  ipcMain.handle(IPC.WIN_SCH, () => {
    if (!wins.has('sch')) mkWin('sch', { title: 'Scheduler' })
    else wins.get('sch')!.focus()
  })
  ipcMain.handle(IPC.DISP_SET, (_e, dispId: number, outId?: string) => {
    const w = outId ? wins.get(outWinKey(outId)) : wins.get(outWinKey('vid-out-1'))
    if (!w || w.isDestroyed()) return false
    return placeOnDisplay(w, dispId)
  })
}

app.whenReady().then(async () => {
  eng.dmx.loadCfg(loadOutCfg())
  eng.strm.set(loadStrmCfg(eng.strm.get()))
  const savedLib = readDefaultFixLib()
  if (savedLib) {
    try {
      eng.show.fixLib = mergeFixTypes(eng.show.fixLib, parseFixtureLibrary(savedLib))
    } catch { /* ok */ }
  }
  eng.init()
  wireIpc()
  mkWin('proj', { title: 'Captivate Show' })
  setInterval(async () => {
    await eng.dmx.pollConn()
    pushDmx()
  }, 1000)
})

app.on('window-all-closed', () => {
  eng.onStop()
  eng.shutdown()
  if (process.platform !== 'darwin') app.quit()
})
