import type { Seq, ShowFile } from './types'

const MIN_DUR_MS = 60_000
const PAD_MS = 10_000

/** Latest end time of any clip on a sequence (ms) */
export function seqContentEndMs(seq: Seq): number {
  let end = 0
  for (const c of seq.lxClips) end = Math.max(end, c.endMs)
  for (const c of seq.medClips) end = Math.max(end, c.startMs + Math.max(0, c.outMs - c.inMs))
  return end
}

/** Latest clip end across all sequences in the show */
export function showContentEndMs(show: ShowFile): number {
  let end = 0
  for (const seq of show.seqs) end = Math.max(end, seqContentEndMs(seq))
  return end
}

/** Set show timeline length to fit all clips (+ padding), never below minimum */
export function fitTimelineDur(show: ShowFile): ShowFile {
  const needed = Math.max(MIN_DUR_MS, showContentEndMs(show) + PAD_MS)
  if (needed === show.meta.durMs) return show
  return { ...show, meta: { ...show.meta, durMs: needed } }
}

/** Media clips active at playhead time on tracks of the given kind */
export function medAt(seq: Seq, tMs: number, kind: 'audio' | 'video') {
  return seq.medClips.filter((c) => {
    const trk = seq.trks.find((t) => t.id === c.trkId)
    if (!trk || trk.mute || trk.kind !== kind) return false
    const end = c.startMs + (c.outMs - c.inMs)
    return tMs >= c.startMs && tMs <= end
  })
}

/** Active media clip on a specific track at playhead time */
export function medAtTrk(seq: Seq, trkId: string, tMs: number) {
  const trk = seq.trks.find((t) => t.id === trkId)
  if (!trk || trk.mute || trk.kind === 'lx') return undefined
  return seq.medClips.find((c) => {
    if (c.trkId !== trkId) return false
    const end = c.startMs + (c.outMs - c.inMs)
    return tMs >= c.startMs && tMs <= end
  })
}
