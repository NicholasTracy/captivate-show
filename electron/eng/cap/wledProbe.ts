import http from 'node:http'
import type { WledCaps, WledOutMode, WledSegment } from '../../../shared/wled'

const TIMEOUT = 2000
type Json = Record<string, unknown>

export function probeWled(hostInput: string): Promise<WledCaps> {
  const host = normHost(hostInput)
  if (!host) {
    return Promise.resolve(emptyCaps('', ['Missing host/IP']))
  }
  return Promise.all([
    getJson(host, '/json/info'),
    getJson(host, '/json/state'),
    getJson(host, '/json/cfg'),
  ]).then(([info, state, cfg]) => {
    if (!info && !state && !cfg) {
      return emptyCaps(host, ['Controller unreachable'])
    }
    const ledInfo = rec(info?.leds)
    const segments = parseSegs(state)
    const ledCount = num(ledInfo?.count, 0)
    const span = segments.reduce((m, s) => Math.max(m, s.stop, s.start + s.length), 0)
    const supportsPixel = ledCount > 0 || span > 0
    const supportsRgbw = supportsPixel && (truthy(ledInfo?.rgbw) || truthy(ledInfo?.w))
    const defaultOutputMode: WledOutMode = supportsPixel ? 'pixel' : 'auto'
    const ip = typeof info?.ip === 'string' ? info.ip : null
    return {
      host,
      ip,
      reachable: true,
      firmware: typeof info?.ver === 'string' ? info.ver : null,
      ledCount: Math.max(ledCount, span),
      maxSegments: Math.max(segments.length, num(ledInfo?.maxseg, 0), 1),
      defaultOutputMode,
      supportsPixelRgbw: supportsRgbw,
      segments,
      warnings: [],
    }
  })
}

function emptyCaps(host: string, warnings: string[]): WledCaps {
  return {
    host,
    ip: null,
    reachable: false,
    firmware: null,
    ledCount: 0,
    maxSegments: 0,
    defaultOutputMode: 'auto',
    supportsPixelRgbw: false,
    segments: [],
    warnings,
  }
}

function getJson(host: string, path: string): Promise<Json | null> {
  return new Promise((resolve) => {
    const req = http.request({ hostname: host, port: 80, path, method: 'GET', timeout: TIMEOUT }, (res) => {
      if ((res.statusCode ?? 500) >= 400) { res.resume(); resolve(null); return }
      const parts: Buffer[] = []
      res.on('data', (c) => parts.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8')) as Json) } catch { resolve(null) }
      })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
    req.end()
  })
}

function parseSegs(state: Json | null): WledSegment[] {
  const raw = state?.seg
  if (!Array.isArray(raw)) return []
  return raw
    .map((item, i) => {
      const s = rec(item)
      if (!s) return null
      const id = num(s.id, i)
      const start = num(s.start, 0)
      const len = num(s.len, -1)
      const stop = num(s.stop, start)
      const length = len > 0 ? len : stop > start ? stop - start : 0
      const name = typeof s.n === 'string' && s.n.trim() ? s.n.trim() : `Segment ${id + 1}`
      return { id, name, start, stop: Math.max(start, stop), length, active: s.on !== false }
    })
    .filter((s): s is WledSegment => s !== null)
    .sort((a, b) => a.id - b.id)
}

function normHost(v: string) {
  const t = v.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) {
    try { return new URL(t).host } catch { return t }
  }
  return t
}

function rec(v: unknown): Json | null {
  return v && typeof v === 'object' ? (v as Json) : null
}

function num(v: unknown, fb: number) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fb
}

function truthy(v: unknown) {
  if (v === true) return true
  if (typeof v === 'number') return v > 0
  if (typeof v === 'string') return ['true', '1', 'yes'].includes(v.trim().toLowerCase())
  return false
}
