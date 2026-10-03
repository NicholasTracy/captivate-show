import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc'
import type { DmxConn } from '../shared/conn'
import type { FixtureType } from '../shared/fixType'
import type { OutCfg } from '../shared/outCfg'
import type { TaskProgress } from '../shared/taskProg'
import type { WledCaps, WledDiscovered } from '../shared/wled'
import type { ClkState, OutStatus, ShowFile, StrmCfg } from '../shared/types'
import type { MedOutCfg } from '../shared/medOut'

export type Api = {
  clk: {
    get: () => Promise<ClkState>
    play: () => Promise<void>
    pause: () => Promise<void>
    stop: () => Promise<void>
    seek: (ms: number) => Promise<void>
    onTick: (cb: (s: ClkState) => void) => () => void
  }
  show: {
    get: () => Promise<ShowFile>
    set: (s: ShowFile) => Promise<ShowFile>
    save: () => Promise<string | null>
    open: () => Promise<ShowFile | null>
    onPush: (cb: (s: ShowFile) => void) => () => void
  }
  med: {
    import: () => Promise<{ added: number; errors: string[] }>
    importPaths: (paths: string[]) => Promise<{ added: number; errors: string[] }>
  }
  fix: {
    importLib: () => Promise<FixtureType[]>
    loadLib: () => Promise<FixtureType[]>
    saveLib: () => Promise<string | null>
    syncLib: () => Promise<void>
    pickBg: () => Promise<string | null>
  }
  out: {
    status: () => Promise<OutStatus>
    onStatus: (cb: (s: OutStatus) => void) => () => void
    ports: () => Promise<{ path: string; label: string }[]>
    usbErr: () => Promise<string>
    dmx: {
      get: () => Promise<DmxConn>
      onPush: (cb: (d: DmxConn) => void) => () => void
    }
    cfg: { get: () => Promise<OutCfg>; set: (c: Partial<OutCfg>) => Promise<OutCfg> }
  }
  strm: { get: () => Promise<StrmCfg>; set: (c: Partial<StrmCfg>) => Promise<StrmCfg> }
  wled: { discover: (timeoutMs?: number) => Promise<WledDiscovered[]>; probe: (host: string) => Promise<WledCaps> }
  win: { prev: () => Promise<void>; out: () => Promise<boolean>; outOpen: (outId: string, displayId?: number) => Promise<boolean>; fix: () => Promise<void>; sch: () => Promise<void> }
  disp: { list: () => Promise<{ id: number; label: string; primary: boolean }[]>; set: (id: number, outId?: string) => Promise<boolean> }
  medOut: { get: () => Promise<MedOutCfg>; set: (c: Partial<MedOutCfg>) => Promise<MedOutCfg> }
  task: { onProgress: (cb: (p: TaskProgress) => void) => () => void }
  role: () => string
}

const api: Api = {
  clk: {
    get: () => ipcRenderer.invoke(IPC.CLK_GET),
    play: () => ipcRenderer.invoke(IPC.CLK_PLAY),
    pause: () => ipcRenderer.invoke(IPC.CLK_PAUSE),
    stop: () => ipcRenderer.invoke(IPC.CLK_STOP),
    seek: (ms) => ipcRenderer.invoke(IPC.CLK_SEEK, ms),
    onTick: (cb) => {
      const fn = (_: unknown, s: ClkState) => cb(s)
      ipcRenderer.on(IPC.CLK_TICK, fn)
      return () => ipcRenderer.removeListener(IPC.CLK_TICK, fn)
    },
  },
  show: {
    get: () => ipcRenderer.invoke(IPC.SHOW_GET),
    set: (s) => ipcRenderer.invoke(IPC.SHOW_SET, s),
    save: () => ipcRenderer.invoke(IPC.SHOW_SAVE),
    open: () => ipcRenderer.invoke(IPC.SHOW_OPEN),
    onPush: (cb) => {
      const fn = (_: unknown, s: ShowFile) => cb(s)
      ipcRenderer.on(IPC.SHOW_PUSH, fn)
      return () => ipcRenderer.removeListener(IPC.SHOW_PUSH, fn)
    },
  },
  med: {
    import: () => ipcRenderer.invoke(IPC.MED_IMPORT),
    importPaths: (paths) => ipcRenderer.invoke(IPC.MED_IMPORT_PATHS, paths),
  },
  fix: {
    importLib: () => ipcRenderer.invoke(IPC.FIX_IMPORT),
    loadLib: () => ipcRenderer.invoke(IPC.FIX_LIB_LOAD),
    saveLib: () => ipcRenderer.invoke(IPC.FIX_LIB_SAVE),
    syncLib: () => ipcRenderer.invoke(IPC.FIX_LIB_SYNC),
    pickBg: () => ipcRenderer.invoke(IPC.FIX_BG_PICK),
  },
  out: {
    status: () => ipcRenderer.invoke(IPC.OUT_STATUS),
    onStatus: (cb) => {
      const fn = (_: unknown, s: OutStatus) => cb(s)
      ipcRenderer.on(IPC.OUT_STATUS_PUSH, fn)
      return () => ipcRenderer.removeListener(IPC.OUT_STATUS_PUSH, fn)
    },
    ports: () => ipcRenderer.invoke(IPC.OUT_PORTS),
    usbErr: () => ipcRenderer.invoke(IPC.OUT_USB_ERR),
    dmx: {
      get: () => ipcRenderer.invoke(IPC.OUT_DMX_GET),
      onPush: (cb) => {
        const fn = (_: unknown, d: DmxConn) => cb(d)
        ipcRenderer.on(IPC.OUT_DMX_PUSH, fn)
        return () => ipcRenderer.removeListener(IPC.OUT_DMX_PUSH, fn)
      },
    },
    cfg: {
      get: () => ipcRenderer.invoke(IPC.OUT_CFG_GET),
      set: (c) => ipcRenderer.invoke(IPC.OUT_CFG_SET, c),
    },
  },
  strm: {
    get: () => ipcRenderer.invoke(IPC.STRM_GET),
    set: (c) => ipcRenderer.invoke(IPC.STRM_SET, c),
  },
  wled: {
    discover: (timeoutMs) => ipcRenderer.invoke(IPC.WLED_DISCOVER, timeoutMs),
    probe: (host) => ipcRenderer.invoke(IPC.WLED_PROBE, host),
  },
  win: {
    prev: () => ipcRenderer.invoke(IPC.WIN_PREV),
    out: () => ipcRenderer.invoke(IPC.WIN_OUT),
    outOpen: (outId, displayId) => ipcRenderer.invoke(IPC.WIN_OUT_OPEN, outId, displayId),
    fix: () => ipcRenderer.invoke(IPC.WIN_FIX),
    sch: () => ipcRenderer.invoke(IPC.WIN_SCH),
  },
  disp: {
    list: () => ipcRenderer.invoke(IPC.DISP_LIST),
    set: (id, outId) => ipcRenderer.invoke(IPC.DISP_SET, id, outId),
  },
  medOut: {
    get: () => ipcRenderer.invoke(IPC.MED_OUT_GET),
    set: (c) => ipcRenderer.invoke(IPC.MED_OUT_SET, c),
  },
  task: {
    onProgress: (cb) => {
      const fn = (_: unknown, p: TaskProgress) => cb(p)
      ipcRenderer.on(IPC.TASK_PROGRESS, fn)
      return () => ipcRenderer.removeListener(IPC.TASK_PROGRESS, fn)
    },
  },
  role: () => new URLSearchParams(window.location.search).get('win') ?? 'proj',
}

contextBridge.exposeInMainWorld('api', api)
