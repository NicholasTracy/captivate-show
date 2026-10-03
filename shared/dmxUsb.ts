/** USB DMX dongle detection - Captivate-compatible FTDI filter */

export interface SerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  vendorId?: string
  productId?: string
  friendlyName?: string
}

function normUsbId(v?: string) {
  if (!v) return ''
  return v.trim().toLowerCase().replace(/^0x/i, '')
}

/** FTDI 0403:6001 - Enttec DMX USB Pro, Open DMX, clones */
export function isDmxPort(p: SerialPortInfo) {
  const pid = normUsbId(p.productId)
  const vid = normUsbId(p.vendorId)
  if (pid !== '6001') return false
  return vid === '' || vid === '0403'
}

export function dmxConnectionId(p: SerialPortInfo) {
  return p.serialNumber?.trim() || p.path
}

/** Human device name - never the COM port path */
export function dmxPortName(p: SerialPortInfo) {
  const friendly = p.friendlyName?.trim()
  if (friendly) {
    const clean = friendly
      .replace(/\s*\(COM\d+\)\s*$/i, '')
      .replace(/^COM\d+\s*[-–]?\s*/i, '')
      .trim()
    if (clean && !/^COM\d+$/i.test(clean)) return clean
  }
  const mfr = p.manufacturer?.trim()
  if (mfr && !/^ftdi$/i.test(mfr)) return mfr
  return 'Dmx Usb Device'
}

export function dmxTypeName(type: 'OpenDmxUsb' | 'DmxUsbPro' | null) {
  if (type === 'DmxUsbPro') return 'Dmx Usb Pro'
  if (type === 'OpenDmxUsb') return 'Open Dmx Usb'
  return 'Dmx Usb Device'
}
