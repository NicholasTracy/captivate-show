import { useRef } from 'react'
import { medAtTrk } from '../../../shared/seqUtil'
import { useSnap } from '../../store/store'
import { useVidAudRoute } from '../media/useVidAudRoute'
import { useVidPlay } from '../media/useVidPlay'

function outIdFromUrl() {
  return new URLSearchParams(window.location.search).get('outId') ?? 'vid-out-1'
}

/** Fullscreen video output window for one configured display route */
export default function OutWin() {
  const outId = outIdFromUrl()
  const { show, clk, medOut } = useSnap()
  const ref = useRef<HTMLVideoElement>(null)
  const vidOut = medOut.vidOuts.find((o) => o.id === outId)
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  const clip = vidOut?.enabled && seq ? medAtTrk(seq, vidOut.trkId, clk.tMs) : undefined
  const asset = clip ? show.media.find((m) => m.id === clip.assetId) : undefined
  useVidPlay(ref, asset, clip, clk, { enabled: !!vidOut?.enabled, emptyMode: 'black' })
  useVidAudRoute(ref, vidOut?.audioDeviceId ?? '', vidOut?.audioRemote, !!vidOut?.enabled)

  const label = vidOut?.name ?? outId

  if (!vidOut?.enabled) {
    return (
      <div className="out-win">
        <div className="blank">
          <span>{label}</span>
          <small>Output disabled</small>
        </div>
        <style>{outStyles}</style>
      </div>
    )
  }

  return (
    <div className="out-win">
      <video ref={ref} className={asset ? '' : 'hidden'} />
      <style>{outStyles}</style>
    </div>
  )
}

const outStyles = `
  .out-win { height: 100vh; background: #000; display: flex; flex-direction: column; position: relative; }
  video { flex: 1; width: 100%; height: 100%; object-fit: contain; background: #000; }
  video.hidden { opacity: 0; pointer-events: none; }
  .blank {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #666; gap: 0.35rem; font-size: 1rem;
  }
  .blank small { font-size: 0.85rem; opacity: 0.7; }
`
