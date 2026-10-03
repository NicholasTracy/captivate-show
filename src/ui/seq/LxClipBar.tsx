import type { LxClip } from '../../../shared/types'
import { Clip } from './seqUi'
import { useClipDrag } from './useClipDrag'
import { lxLabel } from './ClipBar'

type Props = {
  clip: LxClip
  left: number
  width: number
  color: string
  selected: boolean
  draggable: boolean
  pxPerSec: number
}

/** Lighting clip block on a track row */
export default function LxClipBar({ clip, left, width, color, selected, draggable, pxPerSec }: Props) {
  const { onMouseDown, dragDx } = useClipDrag('lx', clip.id, clip.startMs, pxPerSec, draggable)
  const label = lxLabel(clip)

  return (
    <Clip
      $left={left}
      $width={width}
      $color={color}
      $sel={selected}
      $dragDx={dragDx}
      title={`${label} - drag to move`}
      onMouseDown={onMouseDown}
    >
      {label}
    </Clip>
  )
}

export { lxLabel }
