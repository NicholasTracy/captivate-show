/** WLED discovery + probe types (Captivate-compatible) */

import { v4 as uid } from 'uuid'

export interface WledDiscovered {
  host: string
  ip: string | null
  name: string
}

export type WledOutMode = 'auto' | 'pixel' | 'pwm3' | 'pwm4'

export interface WledSegment {
  id: number
  name: string
  start: number
  stop: number
  length: number
  active: boolean
}

export interface WledCaps {
  host: string
  ip: string | null
  reachable: boolean
  firmware: string | null
  ledCount: number
  maxSegments: number
  defaultOutputMode: WledOutMode
  supportsPixelRgbw: boolean
  segments: WledSegment[]
  warnings: string[]
}

export interface WledNode {
  id: string
  host: string
  name: string
  ip: string | null
  enabled: boolean
  universe: number
  outputMode: WledOutMode
  pixelFormat: 'auto' | 'rgb' | 'rgbw'
  segmentId: number | null
  pixelStart: number
  pixelCount: number | null
  ledCount: number
}

export function mkWledNode(partial: Partial<WledNode> & Pick<WledNode, 'host'>): WledNode {
  return {
    id: partial.id ?? uid(),
    host: partial.host,
    name: partial.name ?? partial.host,
    ip: partial.ip ?? null,
    enabled: partial.enabled ?? true,
    universe: partial.universe ?? 1,
    outputMode: partial.outputMode ?? 'auto',
    pixelFormat: partial.pixelFormat ?? 'auto',
    segmentId: partial.segmentId ?? null,
    pixelStart: partial.pixelStart ?? 0,
    pixelCount: partial.pixelCount ?? null,
    ledCount: partial.ledCount ?? 0,
  }
}

export function nodeFromCaps(
  discovered: WledDiscovered,
  caps: WledCaps,
  existing?: Partial<WledNode>
): WledNode {
  const seg = caps.segments.find((s) => s.active) ?? caps.segments[0]
  return mkWledNode({
    ...existing,
    host: discovered.host,
    name: discovered.name || caps.host,
    ip: caps.ip ?? discovered.ip,
    enabled: existing?.enabled ?? true,
    universe: existing?.universe ?? 1,
    outputMode: caps.defaultOutputMode,
    pixelFormat: caps.supportsPixelRgbw ? 'auto' : 'rgb',
    segmentId: seg?.id ?? null,
    pixelStart: seg?.start ?? 0,
    pixelCount: seg?.length > 0 ? seg.length : caps.ledCount > 0 ? caps.ledCount : null,
    ledCount: caps.ledCount,
  })
}
