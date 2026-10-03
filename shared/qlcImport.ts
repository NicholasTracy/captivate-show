import { XMLParser } from 'fast-xml-parser'
import { v4 as uid } from 'uuid'
import type { FixtureType } from './fixType'
import { chAxis, chColor, chCustom, chMaster, chStrobe } from './fixChannels'

type QlcCh = { '@_Name'?: string; '@_Preset'?: string; Capability?: unknown }
type QlcMode = { '@_Name'?: string; Channel?: unknown }

function arr<T>(v: T | T[] | undefined): T[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function str(v: unknown, fb: string) {
  return typeof v === 'string' && v.trim() ? v.trim() : fb
}

function qlcChannel(ch: QlcCh) {
  const preset = str(ch['@_Preset'], '').toLowerCase()
  const name = str(ch['@_Name'], 'Channel')
  if (preset.includes('intensity') || preset.includes('dimmer')) return chMaster()
  if (preset.includes('shutter') || preset.includes('strobe')) return chStrobe()
  if (preset === 'coloradd_r') return chColor('Red')
  if (preset === 'coloradd_g') return chColor('Green')
  if (preset === 'coloradd_b') return chColor('Blue')
  if (preset === 'coloradd_w') return chColor('White')
  if (preset.includes('pan')) return chAxis('x')
  if (preset.includes('tilt')) return chAxis('y')
  return chCustom(name)
}

export function looksLikeQlc(text: string) {
  const t = text.trim()
  return t.includes('<FixtureDefinition') || t.includes('<!DOCTYPE FixtureDefinition')
}

export function parseQlcLib(text: string, sourceName = 'QLC Fixture'): FixtureType[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
  const parsed = parser.parse(text) as { FixtureDefinition?: { Manufacturer?: string; Model?: string; Channel?: unknown; Mode?: unknown } }
  const root = parsed.FixtureDefinition
  if (!root) throw new Error('Missing FixtureDefinition root')

  const manufacturer = str(root.Manufacturer, 'Unknown')
  const model = str(root.Model, sourceName)
  const pool = arr(root.Channel as QlcCh)
  const modes = arr(root.Mode as QlcMode)
  if (!modes.length) throw new Error('No modes in QLC fixture')

  const byName: Record<string, QlcCh> = {}
  pool.forEach((ch, i) => {
    byName[str(ch['@_Name'], `Channel ${i + 1}`)] = ch
  })

  return modes.map((mode, mi) => {
    const modeName = str(mode['@_Name'], `Mode ${mi + 1}`)
    const refs = arr(mode.Channel as { '#text'?: string })
    const channels = refs.map((ref, i) => {
      const refName = str(ref['#text'], `Channel ${i + 1}`)
      const src = byName[refName]
      return src ? qlcChannel(src) : chCustom(refName)
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
