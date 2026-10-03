import Tooltip, { type TooltipProps } from '@mui/material/Tooltip'
import type { ReactElement } from 'react'

export const TIP_SX = {
  maxWidth: '22rem',
  py: 1,
  px: 1.15,
  lineHeight: 1.45,
  fontSize: '0.78rem',
} as const

/** Captivate-style brief tooltip */
export function Tip({
  title,
  children,
  placement = 'top',
}: {
  title: NonNullable<TooltipProps['title']>
  children: ReactElement
  placement?: TooltipProps['placement']
}) {
  return (
    <Tooltip title={title} placement={placement} enterDelay={400} slotProps={{ tooltip: { sx: TIP_SX } }}>
      {children}
    </Tooltip>
  )
}
