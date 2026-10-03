import { useCallback, useRef } from 'react'
import type { AudOut } from '../../../shared/medOut'
import { medAtTrk } from '../../../shared/seqUtil'
import { useSnap } from '../../store/store'
import { resumeAudGraph } from './audGraph'
import { useAudPlay } from './useAudPlay'
import { useAudLevel } from './useAudLevel'

function AudChannel({ out }: { out: AudOut }) {
  const { show, clk } = useSnap()
  const audioRef = useRef<HTMLAudioElement>(null)
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  const clip = out.enabled && seq ? medAtTrk(seq, out.trkId, clk.tMs) : undefined
  const asset = clip ? show.media.find((m) => m.id === clip.assetId) : undefined
  const playing = clk.state === 'play' && !!asset && !!clip
  const muteLocal = !!out.remote?.host

  const resumeCtx = useCallback(() => {
    resumeAudGraph(audioRef.current)
  }, [])

  useAudPlay(audioRef, out.enabled ? asset : undefined, out.enabled ? clip : undefined, clk, resumeCtx)
  useAudLevel(audioRef, out.id, playing, muteLocal, out.deviceId)

  return <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
}

/** One audio element + meter per configured output */
export default function MultiAudEngine() {
  const { medOut } = useSnap()
  return (
    <>
      {medOut.audOuts.map((out) => (
        <AudChannel key={out.id} out={out} />
      ))}
    </>
  )
}
