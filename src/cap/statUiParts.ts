import styled, { css } from 'styled-components'
import type { SxProps, Theme } from '@mui/material/styles'

export const STATUS_BAR_CONTROL_HEIGHT = '2.5rem'
export const STATUS_BAR_TRANSPORT_GAP = '0.7rem'

export const statusBarMuiIconButtonSx: SxProps<Theme> = {
  color: 'text.secondary',
  width: STATUS_BAR_CONTROL_HEIGHT,
  height: STATUS_BAR_CONTROL_HEIGHT,
  borderRadius: '0.35rem',
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.default',
  flexShrink: 0,
  '& .MuiSvgIcon-root': { fontSize: '1.35rem' },
  '&:hover': {
    bgcolor: 'action.hover',
    borderColor: 'text.disabled',
    color: 'text.primary',
  },
}

export const StatusBarCluster = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
`

export const StatusBarTransportCluster = styled(StatusBarCluster)`
  gap: ${STATUS_BAR_TRANSPORT_GAP};
`

const interactive = css`
  font: inherit;
  color: ${(p) => p.theme.colors.text.primary};
  cursor: pointer;
  transition: background-color 120ms ease, border-color 120ms ease;
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`

export const StatusBarTextButton = styled.button`
  ${interactive}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: ${STATUS_BAR_CONTROL_HEIGHT};
  padding: 0 0.65rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.35rem;
  background: ${(p) => p.theme.colors.bg.darker};
  box-shadow: ${(p) => p.theme.elevation.insetHighlight};
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.bg.panel};
    border-color: ${(p) => p.theme.colors.text.secondary};
  }
`

export const StatusBarPlayStopButton = styled.button<{ $playing: boolean }>`
  ${interactive}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${STATUS_BAR_CONTROL_HEIGHT};
  height: ${STATUS_BAR_CONTROL_HEIGHT};
  padding: 0;
  border-radius: 999px;
  border: 1px solid ${(p) => (p.$playing ? 'rgba(120, 220, 130, 0.75)' : p.theme.colors.divider)};
  background: ${(p) =>
    p.$playing
      ? 'linear-gradient(180deg, rgba(120, 220, 130, 0.42), rgba(70, 140, 80, 0.28))'
      : `linear-gradient(180deg, ${p.theme.colors.bg.raised}, ${p.theme.colors.bg.darker})`};
  box-shadow: ${(p) => p.theme.elevation.insetHighlight};
  svg { font-size: 1.45rem; }
`

export const StatusBarReadout = styled.div`
  min-width: 6.5rem;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${(p) => p.theme.colors.text.primary};
  letter-spacing: 0.06em;
`

export const StatusBarMeterTrack = styled.div`
  display: flex;
  width: 4.5rem;
  height: calc(${STATUS_BAR_CONTROL_HEIGHT} - 1rem);
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.35rem;
  overflow: hidden;
  background: ${(p) => p.theme.colors.bg.darker};
  box-shadow: ${(p) => p.theme.elevation.insetDepth};
`

export const StatusBarMeterSegment = styled.div<{ $active: number }>`
  flex: 1;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(210,210,210,0.9));
  opacity: ${(p) => Math.min(1, Math.max(0, p.$active))};
  & + & { border-left: 1px solid ${(p) => p.theme.colors.bg.darker}; }
`

export const StatusBarConnectionRow = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.68rem;
  gap: 0.35rem;
`

export const StatusBarConnectionLabel = styled.span`
  color: ${(p) => p.theme.colors.text.secondary};
  text-transform: lowercase;
`

export const StatusBarStatusDot = styled.div<{ $color: string }>`
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 0.12rem;
  background: ${(p) => p.$color};
  box-shadow: 0 0 0 1px ${(p) => p.theme.colors.bg.darker};
`
