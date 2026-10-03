import makeMdns from 'multicast-dns'
import type { WledDiscovered } from '../../../shared/wled'

const SVC = '_wled._tcp.local'
const DEFAULT_MS = 2200

export function discoverWled(timeoutMs = DEFAULT_MS): Promise<WledDiscovered[]> {
  return new Promise((resolve) => {
    const mdns = makeMdns()
    const services = new Map<string, { host: string | null; ip: string | null }>()
    const ipByHost = new Map<string, string>()
    const aHosts = new Set<string>()

    const done = () => {
      try { mdns.removeListener('response', onResp as (...args: unknown[]) => void) } catch { /* ok */ }
      try { mdns.destroy() } catch { /* ok */ }
      const out = new Map<string, WledDiscovered>()
      for (const [svc, row] of services) {
        const host = norm(row.host ?? svc.split('._wled._tcp')[0] + '.local')
        if (!host) continue
        out.set(host.toLowerCase(), {
          host,
          ip: row.ip ?? ipByHost.get(host.toLowerCase()) ?? null,
          name: humanize(svc, host),
        })
      }
      for (const h of aHosts) {
        if (!/wled/i.test(h)) continue
        const host = norm(h)
        if (!host || out.has(host.toLowerCase())) continue
        out.set(host.toLowerCase(), {
          host,
          ip: ipByHost.get(host.toLowerCase()) ?? null,
          name: humanize(host, host),
        })
      }
      resolve([...out.values()].sort((a, b) => a.host.localeCompare(b.host)))
    }

    const onResp = (pkt: { answers?: unknown[]; additionals?: unknown[] }) => {
      const recs = [...(pkt.answers ?? []), ...(pkt.additionals ?? [])] as {
        type?: string
        name?: string
        data?: unknown
      }[]
      for (const r of recs) {
        const type = String(r.type ?? '')
        const name = String(r.name ?? '').trim()
        if (!name) continue
        if (type === 'PTR' && same(name, SVC)) {
          const svc = norm(String(r.data ?? ''))
          if (svc && !services.has(svc)) services.set(svc, { host: null, ip: null })
        } else if (type === 'SRV') {
          const svc = norm(name)
          const row = services.get(svc)
          if (!row) continue
          const target = norm(String((r.data as { target?: string })?.target ?? ''))
          if (target) {
            row.host = target
            row.ip = ipByHost.get(target.toLowerCase()) ?? row.ip
          }
        } else if (type === 'A') {
          const host = norm(name)
          const ip = String(r.data ?? '').trim()
          if (!host || !/^\d+\.\d+\.\d+\.\d+$/.test(ip)) continue
          ipByHost.set(host.toLowerCase(), ip)
          aHosts.add(host)
          for (const row of services.values()) {
            if (row.host && same(row.host, host)) row.ip = ip
          }
        }
      }
    }

    mdns.on('response', onResp)
    try { mdns.query(SVC, 'PTR') } catch { done(); return }
    setTimeout(done, Math.max(300, Math.min(8000, timeoutMs)))
  })
}

function norm(v: string) {
  const t = v.trim()
  return t.endsWith('.') ? t.slice(0, -1) : t
}

function same(a: string, b: string) {
  return norm(a).toLowerCase() === norm(b).toLowerCase()
}

function humanize(svc: string, fallback: string) {
  const n = norm(svc).split('._wled._tcp')[0]?.trim()
  return n || fallback
}
