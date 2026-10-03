import { useRef } from 'react'
import { useSnap } from '../../store/store'
import { useVidPrev } from './useVidPrev'

export default function PrevWin() {
  const { show, clk } = useSnap()
  const vidRef = useRef<HTMLVideoElement>(null)
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  const clip = seq?.medClips.find((c) => {
    const trk = seq.trks.find((t) => t.id === c.trkId)
    if (!trk || trk.kind !== 'video') return false
    return clk.tMs >= c.startMs && clk.tMs <= c.startMs + (c.outMs - c.inMs)
  })
  const asset = clip ? show.media.find((m) => m.id === clip.assetId) : null

  useVidPrev(vidRef, asset, clip, clk)

  return (
    <div style={{ height: '100vh', background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 6, background: '#1a1a1a', fontSize: 12 }}>Preview</div>
      {asset ? <video ref={vidRef} style={{ flex: 1, width: '100%' }} /> : (
        <div style={{ flex: 1, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No video at playhead
        </div>
      )}
    </div>
  )
}