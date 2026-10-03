import { msToTc } from '../../../shared/tc'
import { RulerMark, RulerWrap } from './seqUi'

/** Timeline time ruler with grid marks */
export default function Ruler({
  durMs,
  pxPerSec,
  fps,
  onScrub,
}: {
  durMs: number
  pxPerSec: number
  fps: number
  onScrub?: (e: React.MouseEvent, el: HTMLElement) => void
}) {
  const w = (durMs / 1000) * pxPerSec
  const stepMs = pxPerSec >= 120 ? 1000 : pxPerSec >= 60 ? 2000 : 5000
  const marks: number[] = []
  for (let ms = 0; ms <= durMs; ms += stepMs) marks.push(ms)

  return (
    <RulerWrap $w={w} onClick={(e) => onScrub?.(e, e.currentTarget)}>
      {marks.map((ms) => (
        <RulerMark key={ms} $x={(ms / 1000) * pxPerSec}>
          {msToTc(ms, fps).slice(3, 11)}
        </RulerMark>
      ))}
    </RulerWrap>
  )
}
