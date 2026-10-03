import styled from 'styled-components'

/** Modal overlay - Captivate panel style */
export const ModalBg = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`

export const ModalBox = styled.div`
  width: min(520px, 92vw);
  max-height: 85vh;
  overflow: auto;
  background: ${(p) => p.theme.colors.bg.panel};
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.5rem;
  box-shadow: ${(p) => p.theme.elevation.shadowMd};
`

export const ModalHead = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

export const ModalBody = styled.div`
  padding: 0.75rem 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`

export const Sec = styled.section`
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.35rem;
  background: ${(p) => p.theme.colors.bg.darker};
  padding: 0.65rem 0.75rem;
`

export const SecTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
`

export const FieldRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  font-size: 0.78rem;
  color: ${(p) => p.theme.colors.text.primary};
  &:last-child { margin-bottom: 0; }
`

export const FieldInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.3rem 0.45rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.28rem;
  background: #000;
  color: ${(p) => p.theme.colors.text.primary};
  font-size: 0.78rem;
`

export const FieldSelect = styled.select`
  flex: 1;
  padding: 0.3rem 0.45rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.28rem;
  background: #000;
  color: ${(p) => p.theme.colors.text.primary};
  font-size: 0.78rem;
`

export const Hint = styled.p`
  margin: 0.35rem 0 0;
  font-size: 0.68rem;
  color: ${(p) => p.theme.colors.text.secondary};
`
