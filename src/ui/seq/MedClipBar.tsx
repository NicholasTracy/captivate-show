import styled from 'styled-components'
import type { MedClip, MediaAsset } from '../../../shared/types'
import Waveform from '../media/Waveform'
import { useClipDrag } from './useClipDrag'

type Props = {
  clip: MedClip
  asset?: MediaAsset
  left: number
  width: number
  color: string
  selected: boolean
  draggable: boolean
  pxPerSec: number
}

/** Media clip block with waveform (audio track or video with audio) */
export default function MedClipBar({
  clip,
  asset,
  left,
  width,
  color,
  selected,
  draggable,
  pxPerSec,
}: Props) {
  const { onMouseDown, dragDx } = useClipDrag('med', clip.id, clip.startMs, pxPerSec, draggable)
  const label = asset?.name ?? 'Media'
  const dur = Math.max(1, asset?.durMs ?? clip.outMs)
  const inFrac = clip.inMs / dur
  const outFrac = clip.outMs / dur
  const showWave = !!asset?.wavePath

  return (
    <Block
      $left={left}
      $width={width}
      $color={color}
      $sel={selected}
      $dragDx={dragDx}
      title={`${label} - drag to move`}
      onMouseDown={onMouseDown}
    >
      {showWave ? (
        <WaveWrap>
          <Waveform path={asset!.wavePath} inFrac={inFrac} outFrac={outFrac} color={color} />
        </WaveWrap>
      ) : null}
      <Label $hasWave={showWave}>{label}</Label>
    </Block>
  )
}

const Block = styled.div<{ $left: number; $width: number; $color: string; $sel?: boolean; $dragDx?: number }>`
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: ${(p) => p.$left}px;
  width: ${(p) => Math.max(6, p.$width)}px;
  transform: translateX(${(p) => p.$dragDx ?? 0}px);
  border: 1px solid ${(p) => p.$color};
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
  pointer-events: auto;
  cursor: ${(p) => (p.$sel ? 'grabbing' : 'grab')};
  box-shadow: ${(p) => (p.$sel ? `0 0 0 2px ${p.$color}, 0 0 10px rgba(0,0,0,0.45)` : 'none')};
  z-index: ${(p) => (p.$sel ? 2 : 1)};
  &:hover { border-color: ${(p) => p.theme.colors.text.secondary}; }
`

const WaveWrap = styled.div`
  position: absolute;
  inset: 0;
  opacity: 0.95;
`

const Label = styled.div<{ $hasWave: boolean }>`
  position: relative;
  z-index: 1;
  padding: 2px 6px;
  font-size: 0.68rem;
  line-height: 1.2;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.85);
  background: ${(p) => (p.$hasWave ? 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)' : 'transparent')};
`
