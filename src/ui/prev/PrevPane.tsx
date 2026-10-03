import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { medAtTrk } from '../../../shared/seqUtil'
import { getSnap, setSnap, useSnap } from '../../store/store'
import { useVidAudRoute } from '../media/useVidAudRoute'
import { useVidPlay } from '../media/useVidPlay'

/** Inline video preview synced to playhead via preview output routing */
export default function PrevPane() {
  const { show, clk, medOut, vidStates } = useSnap()
  const vidRef = useRef<HTMLVideoElement>(null)
  const previewOut = medOut.vidOuts.find((o) => o.enabled && o.dest === 'preview')
  const state = previewOut ? (vidStates[previewOut.id] ?? 'idle') : 'off'
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  const trk = previewOut ? seq?.trks.find((t) => t.id === previewOut.trkId) : undefined
  const clip = previewOut && seq ? medAtTrk(seq, previewOut.trkId, clk.tMs) : undefined
  const asset = clip ? show.media.find((m) => m.id === clip.assetId) : undefined

  useVidPlay(vidRef, asset, clip, clk, { enabled: !!previewOut, emptyMode: 'preview' })
  useVidAudRoute(vidRef, previewOut?.audioDeviceId ?? '', previewOut?.audioRemote, !!previewOut)

  useEffect(() => {
    if (!previewOut) return
    const cur = getSnap().vidStates
    let next: 'off' | 'idle' | 'live' = 'idle'
    if (!asset || !clip) next = 'idle'
    else next = clk.state === 'play' ? 'live' : 'idle'
    if (cur[previewOut.id] !== next) setSnap({ vidStates: { ...cur, [previewOut.id]: next } })
  }, [previewOut, asset?.id, clip?.id, clk.state])

  return (
    <Wrap>
      <Head>
        Preview
        {previewOut ? <Tag>{previewOut.name} · {trk?.name ?? previewOut.trkId}</Tag> : null}
        <Dot $live={state === 'live'} title={`Preview ${state}`} />
      </Head>
      <Body>
        {previewOut ? (
          <>
            <video ref={vidRef} />
            {!asset && <Overlay>No video at playhead</Overlay>}
          </>
        ) : (
          <Empty>Enable a video output routed to Preview</Empty>
        )}
      </Body>
    </Wrap>
  )
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  background: #000;
`

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
  background: ${(p) => p.theme.colors.bg.darker};
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
`

const Tag = styled.span`
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  font-size: 0.62rem;
  opacity: 0.85;
`

const Dot = styled.span<{ $live: boolean }>`
  margin-left: auto;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: ${(p) => (p.$live ? '#6bcf7f' : '#555')};
  box-shadow: ${(p) => (p.$live ? '0 0 5px #6bcf7f' : 'none')};
`

const Body = styled.div`
  flex: 1;
  min-height: 140px;
  max-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
  }
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: 0.78rem;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
`

const Empty = styled.div`
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: 0.78rem;
  text-align: center;
  padding: 0 1rem;
`
