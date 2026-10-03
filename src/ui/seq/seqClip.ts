import { v4 as uid } from 'uuid'
import type { LxClip, MedClip } from '../../../shared/types'
import { getSnap, saveShow, setSnap } from '../../store/store'

export type ClipKind = 'lx' | 'med'

export function selectClip(kind: ClipKind, id: string) {
  setSnap({ selClip: { kind, id } })
}

export function clearSelClip() {
  setSnap({ selClip: null })
}

export async function deleteClip(kind: ClipKind, id: string) {
  const { show } = getSnap()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  if (!seq) return

  await saveShow({
    ...show,
    seqs: show.seqs.map((s) =>
      s.id !== seq.id
        ? s
        : kind === 'lx'
          ? { ...s, lxClips: s.lxClips.filter((c) => c.id !== id) }
          : { ...s, medClips: s.medClips.filter((c) => c.id !== id) }
    ),
  })
  clearSelClip()
}

export async function duplicateClip(kind: ClipKind, id: string) {
  const { show } = getSnap()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  if (!seq) return

  if (kind === 'lx') {
    const src = seq.lxClips.find((c) => c.id === id)
    if (!src) return
    const dur = src.endMs - src.startMs
    const copy: LxClip = {
      ...src,
      id: uid(),
      startMs: src.endMs,
      endMs: src.endMs + dur,
      kfs: src.kfs?.map((k) => ({ ...k })),
    }
    await saveShow({
      ...show,
      seqs: show.seqs.map((s) => (s.id === seq.id ? { ...s, lxClips: [...s.lxClips, copy] } : s)),
    })
    selectClip('lx', copy.id)
    return
  }

  const src = seq.medClips.find((c) => c.id === id)
  if (!src) return
  const dur = src.outMs - src.inMs
  const copy: MedClip = { ...src, id: uid(), startMs: src.startMs + dur }
  await saveShow({
    ...show,
    seqs: show.seqs.map((s) => (s.id === seq.id ? { ...s, medClips: [...s.medClips, copy] } : s)),
  })
  selectClip('med', copy.id)
}

export async function moveClipStart(kind: ClipKind, id: string, startMs: number) {
  const ms = Math.max(0, Math.round(startMs))
  const { show } = getSnap()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  if (!seq) return

  if (kind === 'lx') {
    await saveShow({
      ...show,
      seqs: show.seqs.map((s) => {
        if (s.id !== seq.id) return s
        return {
          ...s,
          lxClips: s.lxClips.map((c) => {
            if (c.id !== id) return c
            const dur = c.endMs - c.startMs
            return { ...c, startMs: ms, endMs: ms + dur }
          }),
        }
      }),
    })
    return
  }

  await saveShow({
    ...show,
    seqs: show.seqs.map((s) => {
      if (s.id !== seq.id) return s
      return {
        ...s,
        medClips: s.medClips.map((c) => (c.id === id ? { ...c, startMs: ms } : c)),
      }
    }),
  })
}
