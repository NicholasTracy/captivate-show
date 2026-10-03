import { v4 as uid } from 'uuid'
import type { FixtureType } from './fixType'
import { chColor, chCustom, chMaster, chStrobe } from './fixChannels'

type Json = Record<string, unknown>

function rec(v: unknown): Json | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : []
}

function str(v: unknown, fb: string) {
  return typeof v === 'string' && v.trim() ? v.trim() : fb
}

function capType(type: string) {
  const t = type.toLowerCase()
  if (t.includes('intensity') || t.includes('dimmer')) return chMaster()
  if (t.includes('shutter') || t.includes('strobe')) return chStrobe()
  if (t.includes('color') && t.includes('red')) return chColor('Red')
  if (t.includes('color') && t.includes('green')) return chColor('Green')
  if (t.includes('color') && t.includes('blue')) return chColor('Blue')
  if (t.includes('white')) return chColor('White')
  return chCustom(type)
}

function convertOflChannel(name: string, ch: Json) {
  const caps = arr<Json>(ch.capabilities ?? ch.capability)
  const first = caps[0]
  const type = str(first?.type, name)
  return capType(type)
}

export function looksLikeOfl(input: unknown) {
  const o = rec(input)
  if (!o) return false
  const schema = str(o.$schema, '').toLowerCase()
  if (schema.includes('open-fixture-library')) return true
  return typeof o.name === 'string' && rec(o.availableChannels) && Array.isArray(o.modes)
}

export function parseOflLib(input: unknown, opts?: { manufacturer?: string; sourceName?: string }): FixtureType[] {
  const def = rec(input)
  if (!def || !looksLikeOfl(def)) throw new Error('Not a valid OFL fixture')

  const avail = rec(def.availableChannels)
  if (!avail) throw new Error('OFL missing availableChannels')

  const modes = arr<Json>(def.modes)
  if (!modes.length) throw new Error('OFL missing modes')

  const model = str(def.name, opts?.sourceName ?? 'OFL Fixture')
  const manufacturer = str(opts?.manufacturer, str(def.manufacturer, 'Unknown'))

  return modes.map((mode, mi) => {
    const modeName = str(mode.name, `Mode ${mi + 1}`)
    const chRefs = arr<unknown>(mode.channels)
    const channels = chRefs.map((entry, i) => {
      if (typeof entry === 'string') {
        const ch = rec(avail[entry])
        return ch ? convertOflChannel(entry, ch) : chCustom(entry)
      }
      const e = rec(entry)
      const name = str(e?.channel, `Channel ${i + 1}`)
      const ch = rec(avail[name])
      return ch ? convertOflChannel(name, ch) : chCustom(name)
    })
    return {
      id: uid(),
      name: modes.length === 1 ? model : `${model} (${modeName})`,
      manufacturer,
      intensity: 0,
      channels,
      subFixtures: [],
      groups: [],
    }
  })
}
