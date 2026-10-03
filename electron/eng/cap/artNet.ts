import dgram from 'node:dgram'
import type { OutCfg } from '../../../shared/outCfg'
import { ART_MS, ART_PORT, mkPkt, wrPkt } from './artBuf'
import { toIpBuf } from './ipUtil'

type FrameSrc = () => Map<number, Uint8Array>

/** Art-Net sender - per-universe IP routes like Captivate */
export class ArtOut {
  private sock = dgram.createSocket('udp4')
  private seq = 1
  private pkts = new Map<number, Buffer>()
  private timer: NodeJS.Timeout
  private live = false

  constructor(private cfg: () => OutCfg, private frames: FrameSrc) {
    this.timer = setInterval(() => this.tick(), ART_MS)
  }

  private tick() {
    const c = this.cfg()
    let sent = false

    for (let uni = 1; uni <= c.universeCount; uni++) {
      const ip = (c.artUniRoute[uni] ?? '').trim()
      if (!ip || !toIpBuf(ip)) continue
      const buf = this.frames().get(uni)
      if (!buf) continue
      const idx = uni - 1
      let pkt = this.pkts.get(idx)
      if (!pkt) {
        pkt = mkPkt(idx)
        this.pkts.set(idx, pkt)
      }
      wrPkt(pkt, buf, this.seq)
      this.sock.send(pkt, ART_PORT, ip)
      sent = true
    }

    this.live = sent
    this.seq = this.seq >= 255 ? 1 : this.seq + 1
  }

  isLive() {
    return this.live
  }

  destroy() {
    clearInterval(this.timer)
    this.pkts.clear()
    try { this.sock.close() } catch { /* ok */ }
  }
}
