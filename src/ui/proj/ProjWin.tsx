import MedPanel from '../media/MedPanel'
import OutPanel from '../out/OutPanel'
import PrevPane from '../prev/PrevPane'
import SeqMgr from '../seq/SeqMgr'
import SeqView from '../seq/SeqView'
import StatBar from '../stat/StatBar'
import ToolBar from './ToolBar'
import MenuBar from './MenuBar'
import ConnDlg from './ConnDlg'
import { AppRoot, BodyRow } from '../../cap/layout'
import styled from 'styled-components'

/** Primary project window */
export default function ProjWin() {
  return (
    <AppRoot>
      <MenuBar />
      <ToolBar />
      <BodyRow>
        <LeftCol>
          <LeftTop>
            <MedPanel />
            <SeqMgr />
          </LeftTop>
          <OutPanel />
        </LeftCol>
        <RightCol>
          <PrevPane />
          <SeqView />
        </RightCol>
      </BodyRow>
      <StatBar />
      <ConnDlg />
    </AppRoot>
  )
}

const LeftCol = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex-shrink: 0;
  width: 370px;
  min-width: 370px;
`

const LeftTop = styled.div`
  display: flex;
  min-height: 0;
  flex: 1;
`

const RightCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  > :last-child {
    flex: 1;
    min-height: 0;
  }
`
