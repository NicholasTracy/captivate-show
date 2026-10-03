import { createTheme } from '@mui/material/styles'
import { TIP_SX } from './tip'

/** MUI dark theme aligned with Captivate 2 inputs/tooltips */
export const muiTheme = createTheme({
  palette: { mode: 'dark' },
  zIndex: { tooltip: 1600 },
  components: {
    MuiTooltip: {
      defaultProps: { enterDelay: 400, placement: 'top' },
      styleOverrides: { tooltip: { ...TIP_SX } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { backgroundColor: '#000' },
        input: { color: '#fff' },
        notchedOutline: { borderColor: 'rgba(255,255,255,0.28)' },
      },
    },
  },
})
