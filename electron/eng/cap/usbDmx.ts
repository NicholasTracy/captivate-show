/** Open DMX USB output - Captivate-style dongle filter + naming */
import type { DmxConn, DmxDev } from '../../../shared/conn'
import { mkDmxConn } from '../../../shared/conn'
import {
  dmxConnectionId,
  dmxPortName,
  dmxTypeName,
  isDmxPort,
  type SerialPortInfo,
} from '../../../shared/dmxUsb'
import type { OutCfg } from '../../../shared/outCfg'

type FrameSrc = () => Map<number, Uint8Array>

type UsbPort = {
  write: (b: Buffer) => void
  close: () => void
  isOpen: boolean
  open: (cb: (err: Error | null) => void) => void
}

type ActiveConn = { port: UsbPort; live: boolean; path: string; type: DmxDev['type'] }

export class UsbOut {
  private conns = new Map<string, ActiveConn>()
  private timer: NodeJS.Timeout
  private live = false
  private err = ''
  private dmxConn: DmxConn = mkDmxConn()
  private devById = new Map<string, DmxDev>()

  constructor(private cfg: () => OutCfg, private frames: FrameSrc) {
    this.timer = setInterval(() => void this.tick(), 1000 / 30)
  }

  private async tick() {
    const c = this.cfg()
    const enabled = new Set(c.dmxOn)
    const available = await listDevs(c)
    for (const d of available) this.devById.set(d.connectionId, d)
    this.dmxConn.available = available
    this.dmxConn.connectable = [...enabled]

    for (const [id, conn] of this.conns) {
      if (!enabled.has(id)) {
        try { conn.port.close() } catch { /* ok */ }
        this.conns.delete(id)
      }
    }

    const connected: string[] = []
    let anyLive = false

    for (const id of enabled) {
      const dev = this.devById.get(id) ?? available.find((d) => d.connectionId === id)
      if (!dev) continue
      const uni = c.dmxUniByDev[id] ?? 1
      const buf = this.frames().get(uni)
      if (!buf) continue

      const usePro = c.dmxProByDev[id] === true
      const type: DmxDev['type'] = usePro ? 'DmxUsbPro' : 'OpenDmxUsb'
      dev.type = type
      dev.name = dmxTypeName(type)

      let conn = this.conns.get(id)
      if (!conn || conn.path !== dev.path) {
        if (conn) {
          try { conn.port.close() } catch { /* ok */ }
          this.conns.delete(id)
        }
        try {
          const port = await this.openPort(dev.path)
          conn = { port, live: false, path: dev.path, type }
          this.conns.set(id, conn)
        } catch (e) {
          this.err = String(e)
          continue
        }
      }

      const pkt = usePro ? mkProPkt(buf) : mkOpenPkt(buf)
      try {
        conn.port.write(pkt)
        conn.live = true
        connected.push(id)
        anyLive = true
        this.err = ''
      } catch (e) {
        this.err = String(e)
        conn.live = false
        try { conn.port.close() } catch { /* ok */ }
        this.conns.delete(id)
      }
    }

    this.live = anyLive
    this.dmxConn.connected = connected
  }

  private openPort(path: string): Promise<UsbPort> {
    return new Promise((res, rej) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { SerialPort } = require('serialport') as typeof import('serialport')
        const port = new SerialPort({ path, baudRate: 250000, autoOpen: false }) as unknown as UsbPort
        port.open((err) => (err ? rej(err) : res(port)))
      } catch (e) {
        rej(e)
      }
    })
  }

  isLive() {
    return this.live
  }

  getErr() {
    return this.err
  }

  getConn() {
    return {
      available: [...this.dmxConn.available],
      connected: [...this.dmxConn.connected],
      connectable: [...this.dmxConn.connectable],
    }
  }

  destroy() {
    clearInterval(this.timer)
    for (const [, conn] of this.conns) {
      try { conn.port.close() } catch { /* ok */ }
    }
    this.conns.clear()
  }
}

function mkOpenPkt(buf: Uint8Array) {
  const pkt = Buffer.alloc(513)
  pkt[0] = 0
  for (let i = 0; i < 512; i++) pkt[i + 1] = buf[i] ?? 0
  return pkt
}

function mkProPkt(buf: Uint8Array) {
  const pkt = Buffer.alloc(518)
  pkt[0] = 0x7e
  pkt[1] = 6
  pkt[2] = 513 & 0xff
  pkt[3] = (513 >> 8) & 0xff
  pkt[4] = 0
  for (let i = 0; i < 512; i++) pkt[5 + i] = buf[i] ?? 0
  pkt[517] = 0xe7
  return pkt
}

async function listDevs(cfg: OutCfg): Promise<DmxDev[]> {
  const ports = await listPorts()
  return ports.map((p) => {
    const usePro = cfg.dmxProByDev[dmxConnectionId(p)] === true
    const type: DmxDev['type'] = usePro ? 'DmxUsbPro' : 'OpenDmxUsb'
    return {
      connectionId: dmxConnectionId(p),
      path: p.path,
      name: cfg.dmxOn.includes(dmxConnectionId(p)) ? dmxTypeName(type) : dmxPortName(p),
      type: cfg.dmxOn.includes(dmxConnectionId(p)) ? type : null,
    }
  })
}

/** List FTDI DMX dongles only */
export async function listPorts(): Promise<SerialPortInfo[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SerialPort } = require('serialport') as typeof import('serialport')
    const ports = await SerialPort.list()
    return ports.filter(isDmxPort).map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer,
      serialNumber: p.serialNumber,
      vendorId: p.vendorId,
      productId: p.productId,
      friendlyName: (p as { friendlyName?: string }).friendlyName,
    }))
  } catch {
    return []
  }
}

export async function pollDmxConn(cfg: OutCfg): Promise<DmxConn> {
  const available = await listDevs(cfg)
  return { available, connected: [], connectable: [...cfg.dmxOn] }
}
