export function msToTc(ms: number, fps = 24): string {
  const t = Math.max(0, ms)
  const ff = Math.floor((t % 1000) / (1000 / fps))
  const s = Math.floor(t / 1000) % 60
  const m = Math.floor(t / 60_000) % 60
  const h = Math.floor(t / 3_600_000)
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${p(h)}:${p(m)}:${p(s)}:${p(ff)}`
}

export function msToClock(d = new Date()): string {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/** Time (ms) at lane-local x plus horizontal scroll offset (px) */
export function msAtX(laneX: number, scrollPx: number, pxPerSec: number): number {
  return Math.max(0, ((scrollPx + laneX) / pxPerSec) * 1000)
}
