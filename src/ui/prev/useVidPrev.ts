import { useEffect, useRef, type RefObject } from 'react'
import type { ClkState, MedClip, MediaAsset } from '../../../shared/types'

/** Keep preview video in sync without seeking every clock tick */
export function useVidPrev(
  vidRef: RefObject<HTMLVideoElement | null>,
  asset: MediaAsset | null | undefined,
  clip: MedClip | null | undefined,
  clk: ClkState
) {
  const prevTMs = useRef(clk.tMs)
  const prevState = useRef(clk.state)

  useEffect(() => {
    const v = vidRef.current
    if (!v || !asset) return
    const src = 'file:///' + asset.path.replace(/\\/g, '/')
    if (v.src !== src) v.src = src
  }, [asset?.id, asset?.path, vidRef])

  useEffect(() => {
    const v = vidRef.current
    if (!v || !asset || !clip) return

    const local = (clk.tMs - clip.startMs + clip.inMs) / 1000
    const seeked = Math.abs(clk.tMs - prevTMs.current) > 40
    const stateChanged = clk.state !== prevState.current

    prevTMs.current = clk.tMs
    prevState.current = clk.state

    const shouldSeek = clk.state !== 'play' || stateChanged || seeked
    if (shouldSeek && Math.abs(v.currentTime - local) > 0.04) {
      v.currentTime = local
    }

    if (clk.state === 'play') {
      if (v.paused) void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [clk.tMs, clk.state, asset, clip, vidRef])
}