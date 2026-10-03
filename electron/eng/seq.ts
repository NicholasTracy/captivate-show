import { evalLxClip, mergeVals } from '../../shared/clipEval'
import { medAt } from '../../shared/seqUtil'
import { mapFixVals, patAddr, patTypeId, patUni } from '../../shared/patch'
import type { PatFix } from '../../shared/patch'
import type { Seq } from '../../shared/types'

/** Evaluate sequence at t -> per-universe absolute channel maps */
export function evalSeq(seq: Seq, tMs: number, patch: PatFix[] = []): Map<number, Record<number, number>> {
  const byUni = new Map<number, Record<number, number>[]>()

  for (const clip of seq.lxClips) {
    const trk = seq.trks.find((t) => t.id === clip.trkId)
    if (!trk || trk.mute || trk.kind !== 'lx') continue
    const uni = trk.universe ?? 1
    const rel = evalLxClip(clip, tMs)
    if (!Object.keys(rel).length) continue

    let vals = rel
    if (clip.fixture) {
      const fix = patch.find(
        (p) => p.id === clip.fixture || p.name === clip.fixture || patTypeId(p) === clip.fixture
      )
      if (fix) vals = mapFixVals(patAddr(fix), rel)
    }

    if (!byUni.has(uni)) byUni.set(uni, [])
    byUni.get(uni)!.push(vals)
  }

  const out = new Map<number, Record<number, number>>()
  for (const [uni, maps] of byUni) out.set(uni, mergeVals(maps))
  return out
}

export { medAt } from '../../shared/seqUtil'
