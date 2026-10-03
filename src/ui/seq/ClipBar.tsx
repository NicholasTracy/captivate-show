import type { LxClip, MedClip, MediaAsset } from '../../../shared/types'
import { Clip } from './seqUi'

type Props = {
  left: number
  width: number
  label: string
  color: string
}

/** Flat clip block on a track row */
export default function ClipBar({ left, width, label, color }: Props) {
  return <Clip $left={left} $width={width} $color={color} title={label}>{label}</Clip>
}

export function lxLabel(c: LxClip) {
  return c.label ?? `${c.mode} ch${c.chan ?? '?'}`
}

export function medLabel(c: MedClip, assets: MediaAsset[]) {
  return assets.find((a) => a.id === c.assetId)?.name ?? 'Media'
}
