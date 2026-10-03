/** Runtime DMX connection status (Captivate gui.dmx shape) */

export type DmxDevType = 'OpenDmxUsb' | 'DmxUsbPro'

export interface DmxDev {
  connectionId: string
  path: string
  name: string
  type: DmxDevType | null
}

export interface DmxConn {
  available: DmxDev[]
  connected: string[]
  connectable: string[]
}

export function mkDmxConn(): DmxConn {
  return { available: [], connected: [], connectable: [] }
}
