import { useEffect, useRef, type RefObject } from 'react'
import type { ClkState, MedClip, MediaAsset } from '../../../shared/types'
import { resumeAudGraph } from './audGraph'

function fileUrl(p: string) {
  return 'file:///' + p.replace(/\\/g, '/')
}

export type VidEmptyMode = 'preview' | 'black'

type Opts = {
  enabled?: boolean
  /** preview = hold last frame; black = clear video (for display outputs) */
  emptyMode?: VidEmptyMode
}

function clearVideo(v: HTMLVideoElement) {
  v.pause()
  v.removeAttribute('src')
  v.load()
}

/** Keep video in sync without seeking or reloading every clock tick */
export function useVidPlay(
  vidRef: RefObject<HTMLVideoElement | null>,
  asset: MediaAsset | undefined,
  clip: MedClip | undefined,
  clk: ClkState,
  opts: boolean | Opts = true
) {
  const { enabled = true, emptyMode = 'preview' } = typeof opts === 'boolean' ? { enabled: opts } : opts
  const prevTMs = useRef(clk.tMs)
  const prevState = useRef(clk.state)
  const loadedId = useRef<string | undefined>()

  useEffect(() => {
    const v = vidRef.current
    if (!v || !enabled) return
    if (!asset) {
      if (emptyMode === 'black' && loadedId.current) {
        loadedId.current = undefined
        clearVideo(v)
      }
      return
    }
    if (loadedId.current === asset.id) return
    loadedId.current = asset.id
    v.src = fileUrl(asset.path)
  }, [asset?.id, asset?.path, enabled, emptyMode, vidRef])

  useEffect(() => {
    if (!enabled) loadedId.current = undefined
  }, [enabled])

  useEffect(() => {
    const v = vidRef.current
    if (!v || !enabled) return

    if (!asset || !clip) {
      if (emptyMode === 'black' && loadedId.current) {
        loadedId.current = undefined
        clearVideo(v)
      } else {
        v.pause()
      }
      prevTMs.current = clk.tMs
      prevState.current = clk.state
      return
    }

    const localSec = (clk.tMs - clip.startMs + clip.inMs) / 1000
    const seeked = Math.abs(clk.tMs - prevTMs.current) > 40
    const stateChanged = clk.state !== prevState.current

    prevTMs.current = clk.tMs
    prevState.current = clk.state

    const drift = Math.abs(v.currentTime - localSec)
    const shouldSeek =
      clk.state !== 'play' ? drift > 0.04 : (stateChanged || seeked) && drift > 0.04

    if (shouldSeek) v.currentTime = localSec

    if (clk.state === 'play') {
      resumeAudGraph(v)
      if (v.paused) void v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [clk.tMs, clk.state, asset, clip, enabled, emptyMode, vidRef])
}
