import styled from 'styled-components'
import { STATUS_BAR_CONTROL_HEIGHT } from '../../cap/statUiParts'

const SEGMENTS = 24
const GREEN_END = 15
const YELLOW_END = 20

type Props = {
  level: number
  title?: string
  compact?: boolean
}

/** Stereo-style VU meter - green / yellow / red segments */
export default function VuMeter({ level, title = 'Audio output level', compact }: Props) {
  const lit = Math.round(Math.min(1, Math.max(0, level)) * SEGMENTS)

  return (
    <Track $compact={!!compact} title={title} aria-label={title}>
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <Seg key={i} $zone={zone(i)} $on={i < lit} />
      ))}
    </Track>
  )
}

function zone(i: number): 'green' | 'yellow' | 'red' {
  if (i < GREEN_END) return 'green'
  if (i < YELLOW_END) return 'yellow'
  return 'red'
}

const Track = styled.div<{ $compact?: boolean }>`
  display: flex;
  width: ${(p) => (p.$compact ? '4.5rem' : '6.75rem')};
  height: ${(p) =>
    p.$compact ? '0.85rem' : `calc(${STATUS_BAR_CONTROL_HEIGHT} - 0.55rem)`};
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: ${(p) => (p.$compact ? '0.25rem' : '0.35rem')};
  overflow: hidden;
  background: ${(p) => p.theme.colors.bg.darker};
  box-shadow: ${(p) => p.theme.elevation.insetDepth};
  gap: 1px;
  padding: ${(p) => (p.$compact ? '1px' : '2px')};
  flex-shrink: 0;
`

const Seg = styled.div<{ $zone: 'green' | 'yellow' | 'red'; $on: boolean }>`
  flex: 1;
  border-radius: 1px;
  background: ${(p) => segColor(p.$zone, p.$on)};
  box-shadow: ${(p) => (p.$on ? 'inset 0 1px 0 rgba(255,255,255,0.35)' : 'none')};
  transition: background 40ms linear;
`

function segColor(zone: 'green' | 'yellow' | 'red', on: boolean) {
  if (zone === 'green') return on ? '#5fd068' : '#1e3d24'
  if (zone === 'yellow') return on ? '#e6c619' : '#3d3618'
  return on ? '#e85555' : '#3d1c1c'
}
