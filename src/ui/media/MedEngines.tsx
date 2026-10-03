import { type ReactNode } from 'react'
import MultiAudEngine from './MultiAudEngine'
import VidEngine from './VidEngine'

/** Multi-channel audio + video output engines (project window only) */
export default function MedEngines({ children }: { children?: ReactNode }) {
  return (
    <>
      <MultiAudEngine />
      <VidEngine />
      {children}
    </>
  )
}
