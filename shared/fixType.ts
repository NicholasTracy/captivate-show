/** Captivate-compatible fixture type (shared contract with Captivate 2) */

export const FIX_LIB_SCHEMA = 'captivate.fixture-library'
export const FIX_LIB_VERSION = 2
export const DMX_MAX_UNIVERSES = 16
export const DMX_NUM_CHANNELS = 512

/** Full fixture definition - channels kept opaque for cross-app JSON compat */
export interface FixtureType {
  id: string
  name: string
  manufacturer?: string
  intensity: number
  channels: unknown[]
  subFixtures: unknown[]
  groups: string[]
  moverCalibration?: unknown
  model?: unknown
}

export interface FixtureLibrary {
  schema: typeof FIX_LIB_SCHEMA
  version: number
  fixtures: FixtureType[]
}

/** DMX slots used by a fixture type */
export function fixFootprint(ft: FixtureType): number {
  let n = Array.isArray(ft.channels) ? ft.channels.length : 1
  if (Array.isArray(ft.subFixtures)) {
    for (const sub of ft.subFixtures) {
      const chs = (sub as { channels?: unknown[] })?.channels
      if (!Array.isArray(chs)) continue
      for (const idx of chs) {
        if (typeof idx === 'number' && idx >= 0) n = Math.max(n, Math.floor(idx) + 1)
      }
    }
  }
  return Math.max(1, n)
}
