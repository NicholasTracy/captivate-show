import type { OutStatus } from '../../shared/types'
import type { DmxConn } from '../../shared/conn'
import type { OutCfg } from '../../shared/outCfg'
import { artNetActive, migrateOutCfg, patchOutCfg, sacnActive, wledActive } from '../../shared/outCfg'
import { saveOutCfg } from './cap/outStore'
import { ArtOut } from './cap/artNet'
import { SacnOut } from './cap/sacn'
import { UsbOut, pollDmxConn } from './cap/usbDmx'

/** DMX frame store + multi-protocol output bridge */
export class DmxOut {
  cfg: OutCfg = migrateOutCfg({})
  private frames = new Map<number, Uint8Array>()
  private art: ArtOut
  private sacn: SacnOut
  private usb: UsbOut
  private dmxConn: DmxConn = { available: [], connected: [], connectable: [] }

  constructor() {
    const src = () => this.frames
    this.art = new ArtOut(() => this.cfg, src)
    this.sacn = new SacnOut(() => this.cfg, src)
    this.usb = new UsbOut(() => this.cfg, src)
  }

  loadCfg(cfg: OutCfg) {
    this.cfg = migrateOutCfg(cfg)
  }

  getStatus(): OutStatus {
    return {
      dmx: this.cfg.dmxOn.length > 0 && this.usb.isLive(),
      artnet: artNetActive(this.cfg) && this.art.isLive(),
      sacn: sacnActive(this.cfg) && this.sacn.isLive(),
      wled: wledActive(this.cfg),
      strm: false,
    }
  }

  setCfg(patch: Partial<OutCfg>) {
    this.cfg = patchOutCfg(this.cfg, patch)
    saveOutCfg(this.cfg)
  }

  getCfg() {
    return { ...this.cfg }
  }

  async pollConn() {
    const polled = await pollDmxConn(this.cfg)
    const live = this.usb.getConn()
    this.dmxConn = {
      available: polled.available,
      connectable: this.cfg.dmxOn,
      connected: live.connected,
    }
    return this.getConn()
  }

  getConn() {
    return {
      available: [...this.dmxConn.available],
      connectable: [...this.dmxConn.connectable],
      connected: [...this.dmxConn.connected],
    }
  }

  /** Merge channel vals into universe buffer */
  send(uni: number, vals: Record<number, number>) {
    let buf = this.frames.get(uni)
    if (!buf) {
      buf = new Uint8Array(512)
      this.frames.set(uni, buf)
    }
    for (const [ch, val] of Object.entries(vals)) {
      const i = +ch - 1
      if (i >= 0 && i < 512) buf[i] = Math.max(0, Math.min(255, val))
    }
  }

  blackout() {
    for (const buf of this.frames.values()) buf.fill(0)
  }

  usbErr() {
    return this.usb.getErr()
  }

  destroy() {
    this.art.destroy()
    this.sacn.destroy()
    this.usb.destroy()
  }
}
