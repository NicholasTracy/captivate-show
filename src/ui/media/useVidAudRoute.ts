import { useEffect, useRef, type RefObject } from 'react'
import type { AudRemote } from '../../../shared/medOut'
import { ensureAudGraph } from './audGraph'

/** Route embedded video audio to a specific output device */
export function useVidAudRoute(
  vidRef: RefObject<HTMLVideoElement | null>,
  deviceId: string,
  remote: AudRemote | undefined,
  route: boolean
) {
  useEffect(() => {
    const v = vidRef.current
    if (!v || !route) return
    ensureAudGraph(v, !!remote?.host, deviceId)
  }, [vidRef, deviceId, remote?.host, remote?.port, route])
}
