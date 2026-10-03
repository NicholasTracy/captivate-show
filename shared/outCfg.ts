/** DMX / network output routing - Captivate ConnectionSettings shape */

import { DMX_MAX_UNIVERSES } from './fixType'
import type { WledNode } from './wled'
import { mkWledNode } from './wled'

export interface OutCfg {
  universeCount: number
  openDmxHz: number
  artUniRoute: Record<number, string>
  dmxOn: string[]
  dmxUniByDev: Record<string, number>
  dmxProByDev: Record<string, boolean>
  sacnOn: boolean
  sacnIp: string
  sacnUniRoute: Record<number, string>
  wledOn: boolean
  wledNodes: WledNode[]
}

type LegacyOutCfg = {
  artOn?: boolean
  artIp?: string
  usbOn?: boolean
  usbPort?: string
  sacnUni?: number
  wledIp?: string
}

export const mkOutCfg = (): OutCfg => ({
  universeCount: 1,
  openDmxHz: 30,
  artUniRoute: {},
  dmxOn: [],
  dmxUniByDev: {},
  dmxProByDev: {},
  sacnOn: false,
  sacnIp: '239.255.0.1',
  sacnUniRoute: {},
  wledOn: false,
  wledNodes: [],
})

export function clampUniCount(n: unknown) {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 1
  return Math.max(1, Math.min(DMX_MAX_UNIVERSES, v))
}

export function clampRoutes(routes: Record<number, string>, count: number) {
  const out: Record<number, string> = {}
  for (let u = 1; u <= count; u++) {
    const ip = routes[u]
    if (typeof ip === 'string' && ip.trim()) out[u] = ip.trim()
  }
  return out
}

export function clampDevUni(map: Record<string, number>, count: number) {
  const out: Record<string, number> = {}
  for (const [id, u] of Object.entries(map)) {
    out[id] = Math.max(1, Math.min(count, Math.round(u) || 1))
  }
  return out
}

function clampWledNodes(nodes: WledNode[], count: number) {
  return nodes.map((n) => ({
    ...n,
    universe: Math.max(1, Math.min(count, Math.round(n.universe) || 1)),
  }))
}

/** Migrate persisted cfg from older captivate-show builds */
export function migrateOutCfg(raw: Partial<OutCfg & LegacyOutCfg>): OutCfg {
  const base = mkOutCfg()
  const merged: OutCfg = {
    ...base,
    ...raw,
    artUniRoute: { ...base.artUniRoute, ...(raw.artUniRoute ?? {}) },
    sacnUniRoute: { ...base.sacnUniRoute, ...(raw.sacnUniRoute ?? {}) },
    dmxOn: Array.isArray(raw.dmxOn) ? [...raw.dmxOn] : [],
    dmxUniByDev: { ...(raw.dmxUniByDev ?? {}) },
    dmxProByDev: { ...(raw.dmxProByDev ?? {}) },
    wledNodes: Array.isArray(raw.wledNodes) ? raw.wledNodes.map((n) => ({ ...n })) : [],
  }

  if (raw.artIp && !Object.keys(merged.artUniRoute).length && raw.artOn !== false) {
    merged.artUniRoute[1] = raw.artIp
  }
  if (raw.usbPort && raw.usbOn && !merged.dmxOn.length) {
    merged.dmxOn = [raw.usbPort]
    merged.dmxUniByDev[raw.usbPort] = 1
  }
  if (typeof raw.sacnUni === 'number' && !Object.keys(merged.sacnUniRoute).length) {
    merged.sacnUniRoute[raw.sacnUni] = merged.sacnIp
  }
  if (raw.wledIp && !merged.wledNodes.length) {
    merged.wledNodes = [mkWledNode({ host: raw.wledIp, name: raw.wledIp })]
  }

  merged.universeCount = clampUniCount(merged.universeCount)
  merged.openDmxHz = Math.max(5, Math.min(40, Math.round(merged.openDmxHz) || 30))
  merged.artUniRoute = clampRoutes(merged.artUniRoute, merged.universeCount)
  merged.sacnUniRoute = clampRoutes(merged.sacnUniRoute, merged.universeCount)
  merged.dmxUniByDev = clampDevUni(merged.dmxUniByDev, merged.universeCount)
  merged.wledNodes = clampWledNodes(merged.wledNodes, merged.universeCount)
  return merged
}

export function patchOutCfg(cfg: OutCfg, patch: Partial<OutCfg>): OutCfg {
  let next = migrateOutCfg({ ...cfg, ...patch })
  if (patch.universeCount !== undefined) {
    next = migrateOutCfg({ ...next, universeCount: patch.universeCount })
  }
  return next
}

export function artNetActive(cfg: OutCfg) {
  for (let u = 1; u <= cfg.universeCount; u++) {
    if ((cfg.artUniRoute[u] ?? '').trim()) return true
  }
  return false
}

export function sacnActive(cfg: OutCfg) {
  if (!cfg.sacnOn) return false
  for (let u = 1; u <= cfg.universeCount; u++) {
    if ((cfg.sacnUniRoute[u] ?? cfg.sacnIp).trim()) return true
  }
  return false
}

export function wledActive(cfg: OutCfg) {
  return cfg.wledOn && cfg.wledNodes.some((n) => n.enabled && n.host.trim())
}
