import type { BrowserWindow } from 'electron'
import type { ClkState, PlayState } from '../../shared/types'
import { IPC } from '../../shared/ipc'

export class Clk {
  state: PlayState = 'stop'
  tMs = 0
  fps = 24
  durMs = 120_000
  private timer: NodeJS.Timeout | null = null
  private t0 = 0
  private baseMs = 0
  private wins: Set<BrowserWindow> = new Set()

  reg(win: BrowserWindow) {
    this.wins.add(win)
    win.on('closed', () => this.wins.delete(win))
  }

  snap(): ClkState {
    return { state: this.state, tMs: this.tMs, fps: this.fps, durMs: this.durMs }
  }

  setDur(ms: number) {
    const prev = this.durMs
    this.durMs = Math.max(1000, ms)
    if (this.tMs > this.durMs) this.seek(this.durMs)
    else if (prev !== this.durMs) this.push()
  }

  play() {
    if (this.state === 'play') return
    this.state = 'play'
    this.baseMs = this.tMs
    this.t0 = performance.now()
    this.arm()
    this.push()
  }

  pause() {
    if (this.state !== 'play') return
    this.sync()
    this.state = 'pause'
    this.disarm()
    this.push()
  }

  stop() {
    this.state = 'stop'
    this.tMs = 0
    this.disarm()
    this.push()
  }

  seek(ms: number) {
    this.tMs = Math.max(0, Math.min(this.durMs, ms))
    if (this.state === 'play') {
      this.baseMs = this.tMs
      this.t0 = performance.now()
    }
    this.push()
  }

  private sync() {
    if (this.state !== 'play') return
    this.tMs = Math.min(this.durMs, this.baseMs + (performance.now() - this.t0))
  }

  private arm() {
    this.disarm()
    this.timer = setInterval(() => this.tick(), 25)
  }

  private disarm() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  private tick() {
    this.sync()
    if (this.tMs >= this.durMs) {
      this.state = 'stop'
      this.tMs = this.durMs
      this.disarm()
    }
    this.push()
  }

  private push() {
    const snap = this.snap()
    for (const w of this.wins) {
      if (!w.isDestroyed()) w.webContents.send(IPC.CLK_TICK, snap)
    }
  }
}
