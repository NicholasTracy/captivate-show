import styled, { keyframes } from 'styled-components'
import { ModalBg, ModalBox, ModalBody } from './modal'
import { useSnap } from '../store/store'

/** Center-screen loading dialog for long tasks */
export default function LoadDlg() {
  const { loading } = useSnap()
  if (!loading) return null

  const indeterminate = loading.progress < 0
  const pct = Math.max(0, Math.min(100, loading.progress))

  return (
    <ModalBg>
      <Box onClick={(e) => e.stopPropagation()}>
        <ModalBody>
          <Title>{loading.label}</Title>
          <Track aria-hidden>
            {indeterminate ? <Indeterminate /> : <Fill $pct={pct} />}
          </Track>
          <Pct>{indeterminate ? 'Working…' : `${pct}%`}</Pct>
        </ModalBody>
      </Box>
    </ModalBg>
  )
}

const slide = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(250%); }
`

const Box = styled(ModalBox)`
  width: min(22rem, 88vw);
  pointer-events: auto;
`

const Title = styled.div`
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.primary};
  text-align: center;
`

const Track = styled.div`
  height: 6px;
  border-radius: 999px;
  background: ${(p) => p.theme.colors.bg.darker};
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.colors.divider};
`

const Fill = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 999px;
  background: linear-gradient(90deg, #4a9eff, #6bcf7f);
  transition: width 0.2s ease;
`

const Indeterminate = styled.div`
  height: 100%;
  width: 40%;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #4a9eff, #6bcf7f, transparent);
  animation: ${slide} 1.1s ease-in-out infinite;
`

const Pct = styled.div`
  font-size: 0.72rem;
  text-align: center;
  color: ${(p) => p.theme.colors.text.secondary};
`