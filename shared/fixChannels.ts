/** Channel builders for OFL/QLC import (Captivate-compatible shape) */

export function chMaster(max = 255, isOnOff = false) {
  return { type: 'master', min: 0, max, isOnOff }
}

export function chColor(kind: string, value = 0) {
  return { type: 'color', color: { kind, value } }
}

export function chCustom(label = 'Channel') {
  return { type: 'custom', label }
}

export function chStrobe() {
  return { type: 'strobe', default_strobe: 255, default_solid: 0 }
}

export function chAxis(dir: 'x' | 'y' = 'x') {
  return { type: 'axis', dir, min: 0, max: 255 }
}
