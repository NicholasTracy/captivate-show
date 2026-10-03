import { useEffect, useRef } from 'react'
import { v4 as uid } from 'uuid'
import { msAtX } from '../../../shared/tc'
import type { LxClip, Trk } from '../../../shared/types'
import { getSnap, saveShow, useSnap } from '../../store/store'
import { medDropOnLane, placeMedClip } from '../media/medClip'
import { medDragActive, resolveMedDragId } from '../media/medDrag'
import { clearSelClip, deleteClip, duplicateClip } from './seqClip'
import LxClipBar from './LxClipBar'
import MedClipBar from './MedClipBar'
import Ruler from './Ruler'
import SeqHScroll from './SeqHScroll'
import {
  AddBtn,
  GrpRow,
  HeadRow,
  Playhead,
  SeqRoot,
  SeqScroll,
  SeqTable,
  SideCorner,
  TrkLabel,
  TrkLane,
  TrkRow,
} from './seqUi'

/** Main sequencer - aligned track rows + time grid */
export default function SeqView() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const medTrksRef = useRef<Trk[]>([])
  const { show, clk, pxPerSec, tool, selClip } = useSnap()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)!
  const tlW = (clk.durMs / 1000) * pxPerSec
  const playX = (clk.tMs / 1000) * pxPerSec
  const canEdit = tool === 'sel'

  const lxTrks = seq.trks.filter((t) => t.kind === 'lx')
  const medTrks = seq.trks.filter((t) => t.kind !== 'lx')
  medTrksRef.current = medTrks

  const seek = (e: React.MouseEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const scrollLeft = scrollRef.current?.scrollLeft ?? 0
    void window.api.clk.seek(msAtX(e.clientX - rect.left, scrollLeft, pxPerSec))
  }

  const laneClick = (e: React.MouseEvent, el: HTMLElement) => {
    if (e.target === e.currentTarget) clearSelClip()
    seek(e, el)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { selClip: sel } = getSnap()
      if (!sel) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        void deleteClip(sel.kind, sel.id)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        void duplicateClip(sel.kind, sel.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!medDragActive()) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }

    const onDrop = (e: DragEvent) => {
      if (!medDragActive()) return

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null
      const row = el?.closest('[data-med-trk]') as HTMLElement | null
      const lane = row?.querySelector('[data-trk-lane]') as HTMLElement | null
      if (!row || !lane) return

      e.preventDefault()
      e.stopPropagation()
      const assetId = resolveMedDragId(e)
      if (!assetId) return

      const trkId = row.getAttribute('data-med-trk')
      const trk = medTrksRef.current.find((t) => t.id === trkId)
      if (!trk) return

      const rect = lane.getBoundingClientRect()
      const scrollLeft = scrollRef.current?.scrollLeft ?? 0
      const laneX = e.clientX - rect.left
      void placeMedClip(trk, assetId, msAtX(laneX, scrollLeft, pxPerSec))
    }

    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [pxPerSec])

  const allowMedDrop = (e: React.DragEvent) => {
    if (!medDragActive()) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const panScroll = (e: React.MouseEvent) => {
    if (tool !== 'hand' || e.button !== 0) return
    const el = scrollRef.current
    if (!el) return
    e.preventDefault()
    const x0 = e.clientX
    const scroll0 = el.scrollLeft

    const onMove = (ev: MouseEvent) => {
      el.scrollLeft = scroll0 - (ev.clientX - x0)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <SeqRoot>
      <SeqScroll ref={scrollRef} onMouseDown={panScroll} style={{ cursor: tool === 'hand' ? 'grab' : undefined }}>
        <SeqTable $w={tlW}>
          <HeadRow>
            <SideCorner />
            <div style={{ position: 'relative' }}>
              <Ruler durMs={clk.durMs} pxPerSec={pxPerSec} fps={clk.fps} onScrub={(e, el) => seek(e, el)} />
              <Playhead $x={playX} />
            </div>
          </HeadRow>

          <GrpRow>Fixtures and Lighting</GrpRow>
          {lxTrks.map((trk, i) => (
            <TrkRow key={trk.id}>
              <TrkLabel $color={trk.color ?? '#4a9eff'}>
                <span>{trk.name}</span>
                <AddBtn title="Add test fade clip" onClick={() => void addLx(trk)}>+</AddBtn>
              </TrkLabel>
              <TrkLane $w={tlW} $pxPerSec={pxPerSec} $alt={i % 2 === 1} onClick={(e) => laneClick(e, e.currentTarget)}>
                {seq.lxClips.filter((c) => c.trkId === trk.id).map((c) => (
                  <LxClipBar
                    key={c.id}
                    clip={c}
                    left={(c.startMs / 1000) * pxPerSec}
                    width={((c.endMs - c.startMs) / 1000) * pxPerSec}
                    color={trk.color ?? '#4a9eff'}
                    selected={selClip?.kind === 'lx' && selClip.id === c.id}
                    draggable={canEdit}
                    pxPerSec={pxPerSec}
                  />
                ))}
                <Playhead $x={playX} />
              </TrkLane>
            </TrkRow>
          ))}

          <GrpRow>Media</GrpRow>
          {medTrks.map((trk, i) => (
            <TrkRow
              key={trk.id}
              data-med-trk={trk.id}
              onDragOver={allowMedDrop}
              onDrop={(e) => {
                const lane = (e.currentTarget as HTMLElement).querySelector('[data-trk-lane]') as HTMLElement | null
                if (!lane) return
                medDropOnLane(e, trk, lane, pxPerSec, scrollRef.current?.scrollLeft ?? 0)
              }}
            >
              <TrkLabel $color={trk.color ?? (trk.kind === 'video' ? '#c77dff' : '#6bcf7f')}>
                <span>{trk.name}</span>
              </TrkLabel>
              <TrkLane
                data-trk-lane=""
                $w={tlW}
                $pxPerSec={pxPerSec}
                $alt={i % 2 === 1}
                onClick={(e) => laneClick(e, e.currentTarget)}
                onDragOver={allowMedDrop}
                onDrop={(e) => medDropOnLane(e, trk, e.currentTarget, pxPerSec, scrollRef.current?.scrollLeft ?? 0)}
              >
                {seq.medClips.filter((c) => c.trkId === trk.id).map((c) => {
                  const dur = c.outMs - c.inMs
                  const asset = show.media.find((m) => m.id === c.assetId)
                  return (
                    <MedClipBar
                      key={c.id}
                      clip={c}
                      asset={asset}
                      left={(c.startMs / 1000) * pxPerSec}
                      width={(dur / 1000) * pxPerSec}
                      color={trk.color ?? (trk.kind === 'video' ? '#c77dff' : '#6bcf7f')}
                      selected={selClip?.kind === 'med' && selClip.id === c.id}
                      draggable={canEdit}
                      pxPerSec={pxPerSec}
                    />
                  )
                })}
                <Playhead $x={playX} />
              </TrkLane>
            </TrkRow>
          ))}
        </SeqTable>
      </SeqScroll>
      <SeqHScroll scrollRef={scrollRef} pxPerSec={pxPerSec} />
    </SeqRoot>
  )
}

function addLx(trk: Trk) {
  const { show, clk } = getSnap()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)!
  const clip: LxClip = {
    id: uid(), trkId: trk.id, startMs: clk.tMs, endMs: clk.tMs + 4000,
    mode: 'curve', chan: 1, label: 'Fade', kfs: [{ tMs: 0, val: 0 }, { tMs: 4000, val: 255 }],
  }
  const next = { ...show, seqs: show.seqs.map((s) => (s.id === seq.id ? { ...s, lxClips: [...s.lxClips, clip] } : s)) }
  void saveShow(next)
}
