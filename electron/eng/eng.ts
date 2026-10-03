import type { BrowserWindow } from 'electron'
import type { ShowFile, OutStatus } from '../../shared/types'
import { mkShow, normShow } from '../../shared/types'
import { fitTimelineDur } from '../../shared/seqUtil'
import { IPC } from '../../shared/ipc'
import { Clk } from './clk'
import { DmxOut } from './dmx'
import { evalSeq, medAt } from './seq'
import { Strm } from './strm'

/** Top-level engine - clock, seq eval, dmx, media */
export class Eng {
  clk = new Clk()
  dmx = new DmxOut()
  strm = new Strm()
  show: ShowFile = mkShow()
  private tickTimer: NodeJS.Timeout | null = null
  private outTimer: NodeJS.Timeout | null = null
  private wins: Set<BrowserWindow> = new Set()
  private lastOut: OutStatus | null = null

  init() {
    this.clk.setDur(this.show.meta.durMs)
    this.armEval()
    this.armOutPush()
  }

  reg(win: BrowserWindow) {
    this.clk.reg(win)
    this.wins.add(win)
    win.on('closed', () => this.wins.delete(win))
  }

  setShow(show: ShowFile) {
    this.show = fitTimelineDur(
      normShow({
        ...show,
        fixLib: show.fixLib ?? [],
        patch: show.patch ?? [],
        stage: show.stage ?? { wFt: 40, hFt: 30 },
      })
    )
    this.clk.fps = this.show.meta.fps
    this.clk.setDur(this.show.meta.durMs)
  }

  activeSeq() {
    return this.show.seqs.find((s) => s.id === this.show.activeSeqId) ?? this.show.seqs[0]
  }

  private armEval() {
    if (this.tickTimer) return
    this.tickTimer = setInterval(() => this.evalTick(), 25)
  }

  private armOutPush() {
    if (this.outTimer) return
    this.outTimer = setInterval(() => this.pushOut(), 500)
  }

  pushOut() {
    const out = { ...this.dmx.getStatus(), strm: this.strm.cfg.on }
    const same = this.lastOut && JSON.stringify(out) === JSON.stringify(this.lastOut)
    if (same) return
    this.lastOut = out
    for (const w of this.wins) {
      if (!w.isDestroyed()) w.webContents.send(IPC.OUT_STATUS_PUSH, out)
    }
  }

  private evalTick() {
    const seq = this.activeSeq()
    if (!seq) return
    const t = this.clk.tMs
    const frames = evalSeq(seq, t, this.show.patch ?? [])
    for (const [uni, vals] of frames) this.dmx.send(uni, vals)

    const vidClips = medAt(seq, t, 'video')
    if (vidClips.length && this.strm.cfg.on) {
      const asset = this.show.media.find((m) => m.id === vidClips[0].assetId)
      if (asset) this.strm.tick(asset.path, t - vidClips[0].startMs + vidClips[0].inMs)
    }
  }

  onStop() {
    this.strm.stop()
    this.dmx.blackout()
    this.pushOut()
  }

  shutdown() {
    this.dmx.destroy()
  }
}

export const eng = new Eng()
