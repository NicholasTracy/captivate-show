import { useEffect } from 'react'
import styled from 'styled-components'
import type { VidOutState } from '../../../shared/medOut'
import { medAtTrk } from '../../../shared/seqUtil'
import { getSnap, setSnap, useSnap } from '../../store/store'

function pushVidState(id: string, state: VidOutState) {
  const cur = getSnap().vidStates
  if (cur[id] === state) return
  setSnap({ vidStates: { ...cur, [id]: state } })
}

function VidOutCtrl({ outId, trkId }: { outId: string; trkId: string }) {
  const { show, clk, medOut } = useSnap()
  const out = medOut.vidOuts.find((o) => o.id === outId)!
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  const clip = out.enabled && seq ? medAtTrk(seq, trkId, clk.tMs) : undefined
  const asset = clip ? show.media.find((m) => m.id === clip.assetId) : undefined

  useEffect(() => {
    if (!out.enabled) pushVidState(outId, 'off')
    else if (!asset || !clip) pushVidState(outId, 'idle')
    else pushVidState(outId, clk.state === 'play' ? 'live' : 'idle')
  }, [out.enabled, outId, asset?.id, clip?.id, clk.state])

  useEffect(() => {
    if (out.dest !== 'display' || !out.enabled) return
    void window.api.win.outOpen(outId, out.displayId)
  }, [out.dest, out.enabled, outId, out.displayId])

  return null
}

/** Open display windows and track output state (preview sync lives in PrevPane) */
export default function VidEngine() {
  const { medOut } = useSnap()

  return (
    <HiddenWrap aria-hidden>
      {medOut.vidOuts.map((out) => (
        <VidOutCtrl key={out.id} outId={out.id} trkId={out.trkId} />
      ))}
    </HiddenWrap>
  )
}

const HiddenWrap = styled.div`
  display: none;
`
