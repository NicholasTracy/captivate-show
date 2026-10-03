import { isIPv4 } from 'node:net'

/** Validate IPv4 for Art-Net routing */
export function toIpBuf(ip: string): Buffer | null {
  if (!isIPv4(ip)) return null
  const oct = ip.split('.').map((p) => Number.parseInt(p, 10))
  if (oct.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return Buffer.from(oct)
}
