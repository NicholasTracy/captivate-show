/** Art-Net DMX packet helpers (from Captivate artNetBuffers.ts) */
const HDR = 18
const CH = 512
const ID = Buffer.from('Art-Net\0', 'ascii')
const OP = Buffer.from([0x00, 0x50])

export function mkPkt(uniIdx: number): Buffer {
  const pkt = Buffer.alloc(HDR + CH)
  ID.copy(pkt, 0)
  OP.copy(pkt, 8)
  pkt.writeUInt16BE(14, 10)
  pkt[14] = uniIdx & 0xff
  pkt[16] = 0x02
  return pkt
}

export function wrPkt(pkt: Buffer, data: Uint8Array, seq: number) {
  pkt[12] = seq & 0xff
  const n = Math.min(CH, data.length)
  for (let i = 0; i < n; i++) pkt[HDR + i] = data[i]
  if (n < CH) pkt.fill(0, HDR + n, HDR + CH)
}

export const ART_PORT = 0x1936
export const ART_MS = 1000 / 44
