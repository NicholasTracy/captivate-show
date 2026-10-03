import { v4 as uid } from 'uuid'
import { msAtX } from '../../../shared/tc'
import type { Trk } from '../../../shared/types'
import { saveShow } from '../../store/store'
import { resolveMedDragId } from './medDrag'

/** Place a media bin asset on a sequencer track at the given time */
export async function placeMedClip(trk: Trk, assetId: string, startMs: number): Promise<boolean> {
  const show = await window.api.show.get()
  const asset = show.media.find((m) => m.id === assetId)
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  if (!asset || !seq) return false

  if (asset.kind !== trk.kind) return false

  const clip = {
    id: uid(),
    trkId: trk.id,
    assetId,
    startMs: Math.max(0, startMs),
    inMs: 0,
    outMs: asset.durMs,
  }

  await saveShow({
    ...show,
    seqs: show.seqs.map((s) =>
      s.id === seq.id ? { ...s, medClips: [...s.medClips, clip] } : s
    ),
  })
  return true
}

export function medDropOnLane(
  e: React.DragEvent,
  trk: Trk,
  laneEl: HTMLElement,
  pxPerSec: number,
  scrollPx: number
) {
  e.preventDefault()
  e.stopPropagation()
  const assetId = resolveMedDragId(e)
  if (!assetId) return
  const rect = laneEl.getBoundingClientRect()
  const laneX = e.clientX - rect.left
  void placeMedClip(trk, assetId, msAtX(laneX, scrollPx, pxPerSec))
}
