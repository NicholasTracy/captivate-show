import { useCallback, useState } from 'react'
import { moveClipStart, selectClip, type ClipKind } from './seqClip'

/** Drag a clip block horizontally on its track */
export function useClipDrag(
  kind: ClipKind,
  clipId: string,
  startMs: number,
  pxPerSec: number,
  enabled: boolean
) {
  const [dragDx, setDragDx] = useState(0)

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return
      e.stopPropagation()
      e.preventDefault()
      selectClip(kind, clipId)

      const x0 = e.clientX
      const ms0 = startMs
      let dx = 0

      const onMove = (ev: MouseEvent) => {
        dx = ev.clientX - x0
        setDragDx(dx)
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        setDragDx(0)
        if (Math.abs(dx) > 2) {
          const dMs = (dx / pxPerSec) * 1000
          void moveClipStart(kind, clipId, ms0 + dMs)
        }
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [kind, clipId, startMs, pxPerSec, enabled]
  )

  return { onMouseDown, dragDx }
}
