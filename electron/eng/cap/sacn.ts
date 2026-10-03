/** E1.31 sACN sender - per-universe routes when enabled */
import dgram from 'node:dgram'
import type { OutCfg } from '../../../shared/outCfg'

const CID = Buffer.from('captivate-show!!', 'ascii')
const FPS = 40

function mkPkt(uni: number, data: Uint8Array, seq: number): Buffer {
  const buf = Buffer.alloc(638)
  buf.writeUInt16BE(0x0010, 0)
  buf.write('ASC-E1.17', 4, 'ascii')
  buf.writeUInt16BE(0x7000, 16)
  buf.writeUInt32BE(0x00000004, 18)
  buf.writeUInt16BE(0x7000, 38)
  buf.writeUInt32BE(0x00000002, 40)
  CID.copy(buf, 44, 0, Math.min(16, CID.length))
  buf.writeUInt16BE(uni, 113)
  buf.writeUInt16BE(0x0072, 115)
  buf.writeUInt32BE(0x00000002, 117)
  buf.writeUInt8(0xa1, 121)
  buf.writeUInt16BE(0, 122)
  buf.writeUInt16BE(1, 124)
  buf.writeUInt16BE(513, 126)
  buf.writeUInt8(seq & 0xff, 128)
  const n = Math.min(512, data.length)
  for (let i = 0; i < n; i++) buf[129 + i] = data[i]
  return buf
}

type FrameSrc = () => Map<number, Uint8Array>

export class SacnOut {
  private sock = dgram.createSocket('udp4')
  private seq = 0
  private timer: NodeJS.Timeout
  private live = false

  constructor(private cfg: () => OutCfg, private frames: FrameSrc) {
    this.timer = setInterval(() => this.tick(), 1000 / FPS)
  }

  private tick() {
    const c = this.cfg()
    if (!c.sacnOn) {
      this.live = false
      return
    }
    let sent = false
    for (let uni = 1; uni <= c.universeCount; uni++) {
      const ip = (c.sacnUniRoute[uni] ?? c.sacnIp).trim()
      if (!ip) continue
      const buf = this.frames().get(uni)
      if (!buf) continue
      const pkt = mkPkt(uni, buf, this.seq++)
      this.sock.send(pkt, 5568, ip)
      sent = true
    }
    this.live = sent
  }

  isLive() {
    return this.live
  }

  destroy() {
    clearInterval(this.timer)
    try { this.sock.close() } catch { /* ok */ }
  }
}
