/** Fixture patch + stage types (Captivate-compatible) */

import type { FixtureType } from './fixType'
import { fixFootprint } from './fixType'
import { parseFixtureLibrary, upgradeFixDefs } from './fixLib'

export type FixDef = FixtureType

/** Patched fixture instance - mirrors Captivate Fixture */
export interface PatFix {
  id: string
  name?: string
  type: string
  ch: number
  universe: number
  window?: { x: number; y: number; w?: number; h?: number }
  groups?: string[]
  rotation?: number
  /** Legacy aliases kept for older .cshow files */
  typeId?: string
  uni?: number
  addr?: number
  chCount?: number
  x?: number
  y?: number
}

export interface StageCfg {
  wFt: number
  hFt: number
  bgPath?: string
}

export const mkStage = (): StageCfg => ({ wFt: 40, hFt: 30 })

export function patUni(p: PatFix) {
  return p.universe ?? p.uni ?? 1
}

export function patAddr(p: PatFix) {
  return p.ch ?? p.addr ?? 1
}

export function patTypeId(p: PatFix) {
  return p.type ?? p.typeId ?? ''
}

export function patName(p: PatFix, lib: FixtureType[]) {
  if (p.name) return p.name
  return lib.find((f) => f.id === patTypeId(p))?.name ?? 'Fixture'
}

export function patFootprint(p: PatFix, lib: FixtureType[]) {
  if (p.chCount) return p.chCount
  const ft = lib.find((f) => f.id === patTypeId(p))
  return ft ? fixFootprint(ft) : 1
}

/** Normalize legacy patch rows on load */
export function normPatFix(p: PatFix): PatFix {
  return {
    ...p,
    type: patTypeId(p),
    ch: patAddr(p),
    universe: patUni(p),
    name: p.name,
  }
}

/** Map relative channel vals onto a universe address map */
export function mapFixVals(addr: number, rel: Record<number, number>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const [ch, val] of Object.entries(rel)) {
    const abs = addr + (+ch - 1)
    if (abs >= 1 && abs <= 512) out[abs] = val
  }
  return out
}

/** @deprecated use parseFixtureLibrary from fixLib.ts */
export function parseFixLib(raw: unknown): FixtureType[] {
  try {
    return parseFixtureLibrary(raw)
  } catch {
    if (Array.isArray(raw)) return upgradeFixDefs(raw)
    return []
  }
}
