import styled from 'styled-components'
import { PanelHead, SidePanel } from '../../cap/layout'
import { saveShow, setSnap, useSnap } from '../../store/store'

/** Sequence list - switch active sequence */
export default function SeqMgr() {
  const { show } = useSnap()

  return (
    <Root>
      <Head>
        Sequences <span title="Reusable lighting sequences" style={{ cursor: 'help', opacity: 0.6 }}>?</span>
      </Head>
      <ul>
        {show.seqs.map((s) => (
          <Li
            key={s.id}
            $on={s.id === show.activeSeqId}
            onClick={() => {
              const next = { ...show, activeSeqId: s.id }
              void saveShow(next)
            }}
          >
            {s.name}
          </Li>
        ))}
      </ul>
    </Root>
  )
}

const Root = styled(SidePanel)`
  width: 150px;
  min-width: 150px;
  padding-bottom: 8px;
  overflow-y: auto;
`
const Head = styled(PanelHead)``
const Li = styled.li<{ $on: boolean }>`
  list-style: none;
  padding: 6px 10px;
  margin: 2px 6px;
  border-radius: 0.35rem;
  font-size: 0.78rem;
  cursor: pointer;
  background: ${(p) => (p.$on ? p.theme.colors.bg.raised : 'transparent')};
  border: 1px solid ${(p) => (p.$on ? p.theme.colors.text.secondary : 'transparent')};
  &:hover { background: ${(p) => p.theme.colors.bg.darker}; }
`
