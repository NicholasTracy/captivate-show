import styled from 'styled-components'

/** Captivate-style text button */
export default function Btn({
  label,
  onClick,
  title,
  active,
  disabled,
}: {
  label: string
  onClick?: () => void
  title?: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <Root $active={!!active} onClick={onClick} title={title ?? label} disabled={disabled}>
      {label}
    </Root>
  )
}

const Root = styled.button<{ $active: boolean }>`
  background: ${(p) => (p.$active ? p.theme.colors.bg.raised : p.theme.colors.bg.darker)};
  color: ${(p) => p.theme.colors.text.primary};
  border: 1px solid ${(p) => (p.$active ? p.theme.colors.text.secondary : p.theme.colors.divider)};
  border-radius: 0.35rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: ${(p) => p.theme.elevation.insetHighlight};
  &:hover:not(:disabled) { border-color: ${(p) => p.theme.colors.text.secondary}; background: ${(p) => p.theme.colors.bg.panel}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`
