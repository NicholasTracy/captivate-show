import type { Kf, LxClip } from './types'

/** Sample a keyframe curve at local time */
export function evalKf(kfs: Kf[], localMs: number): number {
  if (!kfs.length) return 0
  const sorted = [...kfs].sort((a, b) => a.tMs - b.tMs)
  if (localMs <= sorted[0].tMs) return sorted[0].val
  const last = sorted[sorted.length - 1]
  if (localMs >= last.tMs) return last.val

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (localMs >= a.tMs && localMs <= b.tMs) {
      if (a.ease === 'step') return a.val
      const span = b.tMs - a.tMs || 1
      const t = (localMs - a.tMs) / span
      return Math.round(a.val + (b.val - a.val) * t)
    }
  }
  return last.val
}

/** Evaluate one lighting clip → channel values */
export function evalLxClip(clip: LxClip, tMs: number): Record<number, number> {
  if (tMs < clip.startMs || tMs > clip.endMs) return {}
  const local = tMs - clip.startMs
  const out: Record<number, number> = {}

  if (clip.mode === 'strobe') {
    const hz = 4
    const on = Math.floor(local * hz / 1000) % 2 === 0
    if (clip.chan) out[clip.chan] = on ? 255 : 0
    return out
  }

  if (clip.mode === 'chase') {
    const step = Math.floor(local / 200) % 8
    for (let i = 0; i < 8; i++) {
      out[i + 1] = i === step ? 255 : 0
    }
    return out
  }

  if (clip.kfs?.length && clip.chan) {
    out[clip.chan] = Math.max(0, Math.min(255, evalKf(clip.kfs, local)))
  }
  return out
}

/** Merge channel maps — later wins (simple LTP) */
export function mergeVals(
  maps: Record<number, number>[]
): Record<number, number> {
  const out: Record<number, number> = {}
  for (const m of maps) {
    for (const [ch, val] of Object.entries(m)) out[+ch] = val
  }
  return out
}
