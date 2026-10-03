import Btn from '../../cap/Btn'
import { TopBar } from '../../cap/layout'
import { Tip } from '../../cap/tip'
import { getSnap, runTask, setSnap } from '../../store/store'

/** Top menu - file, windows, connections */
export default function MenuBar() {
  const { show } = getSnap()

  return (
    <TopBar>
      <Tip title="Open .cshow file">
        <span><Btn label="Open" onClick={() => void runTask('Opening project…', openShow)} /></span>
      </Tip>
      <Tip title="Save show file">
        <span><Btn label="Save" onClick={() => void runTask('Saving project…', () => window.api.show.save())} /></span>
      </Tip>
      <Tip title="DMX, Art-Net, sACN, WLED, streaming">
        <span><Btn label="Connections" onClick={() => setSnap({ connOpen: true })} /></span>
      </Tip>
      <Tip title="Fixture patch and stage map">
        <span><Btn label="Fixtures" onClick={() => void window.api.win.fix()} /></span>
      </Tip>
      <Tip title="Schedule shows by date/time">
        <span><Btn label="Scheduler" onClick={() => void window.api.win.sch()} /></span>
      </Tip>
      <Tip title="Pop out preview monitor">
        <span><Btn label="Preview" onClick={() => void window.api.win.prev()} /></span>
      </Tip>
      <Tip title="Fullscreen video output">
        <span><Btn label="Output" onClick={() => void window.api.win.out()} /></span>
      </Tip>
      <div style={{ flex: 1 }} />
      <span style={{ color: '#777', fontSize: '0.72rem' }}>{show.meta.name}</span>
    </TopBar>
  )
}

async function openShow() {
  const s = await window.api.show.open()
  if (s) setSnap({ show: s })
}
