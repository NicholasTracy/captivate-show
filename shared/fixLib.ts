import { v4 as uid } from 'uuid'
import {
  FIX_LIB_SCHEMA,
  FIX_LIB_VERSION,
  type FixtureLibrary,
  type FixtureType,
} from './fixType'
import { looksLikeOfl, parseOflLib } from './oflImport'
import { looksLikeQlc, parseQlcLib } from './qlcImport'

type JsonRecord = Record<string, unknown>

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function normChannels(input: unknown): unknown[] | null {
  if (Array.isArray(input)) return clone(input)
  if (input && typeof input === 'object') {
    return Object.entries(input as JsonRecord)
      .sort(([a], [b]) => {
        const na = Number(a)
        const nb = Number(b)
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb
        return a.localeCompare(b)
      })
      .map(([, v]) => v)
  }
  return null
}

function normSubFixtures(input: unknown): unknown[] {
  if (Array.isArray(input)) return clone(input)
  if (input && typeof input === 'object') return clone(Object.values(input as JsonRecord))
  return []
}

function normFixType(input: unknown): FixtureType | null {
  if (!input || typeof input !== 'object') return null
  const raw = input as JsonRecord
  const root =
    raw.fixture && typeof raw.fixture === 'object' ? (raw.fixture as JsonRecord) : raw
  const channels = normChannels(root.channels)
  if (typeof root.name !== 'string' || !channels) return null
  return {
    id: typeof root.id === 'string' && root.id.trim() ? root.id : uid(),
    name: root.name,
    intensity:
      typeof root.intensity === 'number' && Number.isFinite(root.intensity)
        ? root.intensity
        : 0,
    manufacturer: typeof root.manufacturer === 'string' ? root.manufacturer : undefined,
    channels,
    subFixtures: normSubFixtures(root.subFixtures),
    groups: Array.isArray(root.groups)
      ? root.groups.filter((g): g is string => typeof g === 'string')
      : [],
    moverCalibration:
      root.moverCalibration && typeof root.moverCalibration === 'object'
        ? clone(root.moverCalibration)
        : undefined,
    model: root.model && typeof root.model === 'object' ? clone(root.model) : undefined,
  }
}

function extractCandidates(raw: JsonRecord): unknown[] {
  if (Array.isArray(raw.fixtures) && raw.fixtures.length) return raw.fixtures
  if (Array.isArray(raw.fixtureTypes)) {
    const ids = raw.fixtureTypes
    const byId =
      raw.fixtureTypesByID && typeof raw.fixtureTypesByID === 'object'
        ? (raw.fixtureTypesByID as JsonRecord)
        : null
    if (ids.length && typeof ids[0] === 'string' && byId) {
      const mapped = (ids as string[]).map((id) => byId[id]).filter(Boolean)
      if (mapped.length) return mapped
    } else if (ids.length) return ids
  }
  if (raw.fixtureTypesByID && typeof raw.fixtureTypesByID === 'object') {
    return Object.values(raw.fixtureTypesByID as JsonRecord)
  }
  for (const key of ['dmx', 'state', 'present'] as const) {
    const nested = raw[key]
    if (nested && typeof nested === 'object') return getCandidates(nested)
  }
  return [raw]
}

function getCandidates(input: unknown): unknown[] {
  if (Array.isArray(input)) return input
  if (input && typeof input === 'object') return extractCandidates(input as JsonRecord)
  return []
}

/** Parse Captivate JSON, OFL JSON, or QLC+ XML fixture data */
export function parseFixtureLibrary(input: string | unknown): FixtureType[] {
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (looksLikeQlc(trimmed)) return parseQlcLib(trimmed)
    try {
      const parsed = JSON.parse(trimmed)
      if (looksLikeOfl(parsed)) return parseOflLib(parsed)
      const fixtures = getCandidates(parsed).map(normFixType).filter((f): f is FixtureType => f !== null)
      if (fixtures.length) return fixtures
    } catch {
      if (looksLikeQlc(trimmed)) return parseQlcLib(trimmed)
    }
    throw new Error('No valid fixtures found. Expected Captivate JSON, OFL JSON, or QLC+ XML.')
  }
  if (looksLikeOfl(input)) return parseOflLib(input)
  const fixtures = getCandidates(input).map(normFixType).filter((f): f is FixtureType => f !== null)
  if (!fixtures.length) throw new Error('No valid fixtures found. Expected name + channels.')
  return fixtures
}

/** Merge imported types by id (Captivate merge semantics) */
export function mergeFixTypes(existing: FixtureType[], incoming: FixtureType[]): FixtureType[] {
  const byId = new Map(existing.map((f) => [f.id, f]))
  for (const f of incoming) byId.set(f.id, f)
  return [...byId.values()]
}

export function toFixtureLibrary(fixtures: FixtureType[]): FixtureLibrary {
  return {
    schema: FIX_LIB_SCHEMA,
    version: FIX_LIB_VERSION,
    fixtures: fixtures.map((f) => clone(f)),
  }
}

export function serializeFixtureLibrary(fixtures: FixtureType[]): string {
  return JSON.stringify(toFixtureLibrary(fixtures), null, 2)
}

/** Upgrade legacy FixDef[] rows to FixtureType */
export function upgradeFixDefs(rows: unknown[]): FixtureType[] {
  const out: FixtureType[] = []
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const x = row as JsonRecord
    if (Array.isArray(x.channels)) {
      const ft = normFixType(row)
      if (ft) out.push(ft)
      continue
    }
    if (typeof x.name !== 'string') continue
    out.push({
      id: typeof x.id === 'string' ? x.id : uid(),
      name: x.name,
      manufacturer: typeof x.mfr === 'string' ? x.mfr : undefined,
      intensity: 0,
      channels: Array.from({ length: Math.max(1, Number(x.chCount) || 1) }, () => ({
        type: 'master',
        min: 0,
        max: 255,
        isOnOff: false,
      })),
      subFixtures: [],
      groups: [],
    })
  }
  return out
}
