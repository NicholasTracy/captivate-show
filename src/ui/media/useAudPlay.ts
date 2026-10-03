import { useEffect, useRef, type RefObject } from 'react'
import type { ClkState, MedClip, MediaAsset } from '../../../shared/types'

function fileUrl(p: string) {
  return 'file:///' + p.replace(/\\/g, '/')
}

/** Keep audio in sync without seeking or restarting every clock tick */
export function useAudPlay(
  audioRef: RefObject<HTMLAudioElement | null>,
  asset: MediaAsset | undefined,
  clip: MedClip | undefined,
  clk: ClkState,
  resumeCtx?: () => void
) {
  const prevTMs = useRef(clk.tMs)
  const prevState = useRef(clk.state)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !asset) return
    const src = fileUrl(asset.path)
    if (audio.src !== src) audio.src = src
  }, [asset?.id, asset?.path, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (clk.state !== 'play' || !asset || !clip) {
      audio.pause()
      prevTMs.current = clk.tMs
      prevState.current = clk.state
      return
    }

    const localSec = (clk.tMs - clip.startMs + clip.inMs) / 1000
    const seeked = Math.abs(clk.tMs - prevTMs.current) > 40
    const stateChanged = clk.state !== prevState.current

    prevTMs.current = clk.tMs
    prevState.current = clk.state

    const shouldSeek = stateChanged || seeked
    if (shouldSeek && Math.abs(audio.currentTime - localSec) > 0.04) {
      audio.currentTime = localSec
    }

    if (audio.paused) {
      resumeCtx?.()
      void audio.play().catch(() => {})
    }
  }, [clk.tMs, clk.state, asset, clip, audioRef, resumeCtx])
}
