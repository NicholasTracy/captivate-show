import styled from 'styled-components'

/** Captivate Connections modal layout */
export const ConnModalBox = styled.div`
  width: min(72rem, 96vw);
  max-height: 88vh;
  overflow: auto;
  background: ${(p) => p.theme.colors.bg.panel};
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.5rem;
  box-shadow: ${(p) => p.theme.elevation.shadowMd};
`

export const ConnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  @media (max-width: 52rem) {
    grid-template-columns: 1fr;
  }
`

export const ConnSec = styled.section`
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.35rem;
  background: ${(p) => p.theme.colors.bg.darker};
  padding: 0.65rem 0.75rem;
`

export const ConnSecHead = styled.header`
  margin: 0 0 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
`

export const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  margin-bottom: 0.45rem;
`

export const SettingLabel = styled.span`
  font-size: 0.78rem;
  color: ${(p) => p.theme.colors.text.primary};
`

export const ArtRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
`

export const UniTag = styled.div`
  min-width: 2.2rem;
  font-size: 0.75rem;
  color: ${(p) => p.theme.colors.text.secondary};
  text-align: right;
`

export const DevBlock = styled.div`
  margin-bottom: 0.45rem;
`

export const DevRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`

export const DevRoot = styled.div<{ $on: boolean; $live: boolean }>`
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: 1 1 auto;
  color: ${(p) =>
    p.$live ? p.theme.colors.text.primary : p.theme.colors.text.secondary};
  border: 1px solid ${(p) => (p.$on ? p.theme.colors.divider : '#0000')};
  &:hover { text-decoration: underline; }
`

export const DevDot = styled.span<{ $live: boolean; $on: boolean }>`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  flex-shrink: 0;
  background: ${(p) => (p.$live ? '#0f0' : p.$on ? '#e8a020' : '#f00')};
  box-shadow: 0 0 0 1px #0008;
`

export const NoneFound = styled.div`
  padding: 0.5rem;
  color: ${(p) => p.theme.colors.text.secondary};
  font-size: 0.78rem;
`

export const NumInput = styled.input`
  width: 4rem;
  padding: 0.25rem 0.35rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.28rem;
  background: #000;
  color: ${(p) => p.theme.colors.text.primary};
  font-size: 0.78rem;
  text-align: center;
`

export const CapInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.45rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.28rem;
  background: #000;
  color: ${(p) => p.theme.colors.text.primary};
  font-size: 0.78rem;
`

export const ProtoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  margin: 0.15rem 0 0 0.35rem;
`

export const ProtoLabel = styled.span`
  font-size: 0.68rem;
  color: ${(p) => p.theme.colors.text.secondary};
`

export const Hint = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.68rem;
  color: ${(p) => p.theme.colors.text.secondary};
`

export const ConnHeadLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`

export const ConnTitle = styled.span`
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const UniBar = styled.label`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.72rem;
  color: ${(p) => p.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

export const WledRow = styled.div`
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.3rem;
  padding: 0.45rem 0.5rem;
  margin-bottom: 0.4rem;
  background: ${(p) => p.theme.colors.bg.panel};
`

export const WledRowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
`

export const WledName = styled.strong`
  font-size: 0.78rem;
  flex: 1;
  min-width: 0;
`

export const WledMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.25rem 0.65rem;
  font-size: 0.68rem;
  color: ${(p) => p.theme.colors.text.secondary};
`
