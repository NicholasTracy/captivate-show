import { useEffect } from 'react'
import { boot } from './store/store'
import ProjWin from './ui/proj/ProjWin'
import PrevWin from './ui/prev/PrevWin'
import OutWin from './ui/out/OutWin'
import FixWin from './ui/fix/FixWin'
import SchWin from './ui/sch/SchWin'

export default function App() {
  const role = window.api?.role() ?? 'proj'

  useEffect(() => {
    void boot()
  }, [])

  if (role === 'prev') return <PrevWin />
  if (role === 'out') return <OutWin />
  if (role === 'fix') return <FixWin />
  if (role === 'sch') return <SchWin />
  return <ProjWin />
}
