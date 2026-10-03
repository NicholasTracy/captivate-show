import styled from 'styled-components'

/** Sequencer layout constants */
export const SEQ = {
  trkH: 108,
  rulerH: 28,
  grpH: 22,
  sideW: 148,
} as const

export const SeqRoot = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.colors.bg.primary};
  border-left: 1px solid ${(p) => p.theme.colors.divider};
`

export const SeqScroll = styled.div`
  flex: 1;
  overflow-x: hidden;
  overflow-y: auto;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: ${(p) => p.theme.colors.divider} transparent;

  &::-webkit-scrollbar {
    width: 10px;
    height: 0;
  }

  &::-webkit-scrollbar:horizontal {
    display: none;
    height: 0;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.divider};
    border-radius: 5px;
  }
`

export const SeqTable = styled.div<{ $w: number }>`
  position: relative;
  min-width: ${(p) => p.$w + SEQ.sideW}px;
`

export const HeadRow = styled.div`
  display: flex;
  position: sticky;
  top: 0;
  z-index: 4;
  background: ${(p) => p.theme.colors.bg.panel};
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
`

export const SideCorner = styled.div`
  width: ${SEQ.sideW}px;
  min-width: ${SEQ.sideW}px;
  height: ${SEQ.rulerH}px;
  border-right: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.darker};
`

export const GrpRow = styled.div`
  display: flex;
  align-items: center;
  height: ${SEQ.grpH}px;
  padding: 0 10px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
  background: ${(p) => p.theme.colors.bg.darker};
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
`

export const TrkRow = styled.div`
  display: flex;
  height: ${SEQ.trkH}px;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
`

export const TrkLabel = styled.div<{ $color: string }>`
  width: ${SEQ.sideW}px;
  min-width: ${SEQ.sideW}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 8px;
  border-right: 1px solid ${(p) => p.theme.colors.divider};
  border-left: 3px solid ${(p) => p.$color};
  background: ${(p) => p.theme.colors.bg.panel};
  font-size: 0.78rem;
  color: ${(p) => p.theme.colors.text.primary};
`

export const TrkLane = styled.div<{ $w: number; $pxPerSec: number; $alt?: boolean }>`
  position: relative;
  width: ${(p) => p.$w}px;
  min-width: ${(p) => p.$w}px;
  background-color: ${(p) => (p.$alt ? p.theme.colors.bg.darker : p.theme.colors.bg.primary)};
  background-image: repeating-linear-gradient(
    to right,
    ${(p) => p.theme.colors.divider} 0,
    ${(p) => p.theme.colors.divider} 1px,
    transparent 1px,
    transparent ${(p) => p.$pxPerSec}px
  );
  cursor: crosshair;
`

export const Playhead = styled.div<{ $x: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${(p) => p.$x}px;
  width: 2px;
  background: #ff6b6b;
  pointer-events: none;
  z-index: 3;
  box-shadow: 0 0 6px rgba(255, 80, 80, 0.6);
`

export const AddBtn = styled.button`
  padding: 0 6px;
  font-size: 0.72rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.25rem;
  background: ${(p) => p.theme.colors.bg.darker};
  color: ${(p) => p.theme.colors.text.secondary};
  cursor: pointer;
  &:hover { color: ${(p) => p.theme.colors.text.primary}; border-color: ${(p) => p.theme.colors.text.secondary}; }
`

export const Clip = styled.div<{ $left: number; $width: number; $color: string; $sel?: boolean; $dragDx?: number }>`
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: ${(p) => p.$left}px;
  width: ${(p) => Math.max(4, p.$width)}px;
  transform: translateX(${(p) => p.$dragDx ?? 0}px);
  border: 1px solid ${(p) => p.$color};
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
  font-size: 0.72rem;
  padding: 4px 8px;
  color: ${(p) => p.theme.colors.text.primary};
  white-space: nowrap;
  text-overflow: ellipsis;
  pointer-events: auto;
  cursor: ${(p) => (p.$sel ? 'grabbing' : 'grab')};
  box-shadow: ${(p) => (p.$sel ? `0 0 0 2px ${p.$color}, 0 0 10px rgba(0,0,0,0.45)` : 'none')};
  z-index: ${(p) => (p.$sel ? 2 : 1)};
  &:hover { background: rgba(255, 255, 255, 0.12); }
`

export const RulerWrap = styled.div<{ $w: number }>`
  position: relative;
  width: ${(p) => p.$w}px;
  height: ${SEQ.rulerH}px;
  background: ${(p) => p.theme.colors.bg.darker};
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  cursor: crosshair;
`

export const RulerMark = styled.div<{ $x: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${(p) => p.$x}px;
  border-left: 1px solid ${(p) => p.theme.colors.divider};
  padding-left: 4px;
  font-size: 0.62rem;
  color: ${(p) => p.theme.colors.text.secondary};
  display: flex;
  align-items: center;
`

export const PlayOverlay = styled.div<{ $top: number; $h: number; $left: number; $w: number }>`
  position: absolute;
  top: ${(p) => p.$top}px;
  left: ${(p) => p.$left}px;
  width: ${(p) => p.$w}px;
  height: ${(p) => p.$h}px;
  pointer-events: none;
  z-index: 5;
`
