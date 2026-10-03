import { ThemeProvider } from 'styled-components'
import { ThemeProvider as MuiProv } from '@emotion/react'
import { dark } from './theme'
import { muiTheme } from './muiTheme'
import LoadDlg from './LoadDlg'
import GlobalStyle from './GlobalStyle'
import MedEngines from '../ui/media/MedEngines'

/** Wrap app with Captivate 2 theme providers */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const role = window.api?.role() ?? 'proj'
  const body = role === 'proj' ? <MedEngines>{children}</MedEngines> : children

  return (
    <ThemeProvider theme={dark()}>
      <MuiProv theme={muiTheme}>
        <GlobalStyle />
        <LoadDlg />
        {body}
      </MuiProv>
    </ThemeProvider>
  )
}
