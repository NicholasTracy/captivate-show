import Btn from '../../cap/Btn'
import { ToolRow } from '../../cap/layout'
import { Tip } from '../../cap/tip'
import { setSnap, useSnap } from '../../store/store'
import { clearSelClip, deleteClip, duplicateClip } from '../seq/seqClip'

const tools = [
  { id: 'sel' as const, label: 'Sel', tip: 'Select, move, delete, duplicate clips' },
  { id: 'razor' as const, label: 'Cut', tip: 'Razor cut at playhead' },
  { id: 'hand' as const, label: 'Pan', tip: 'Pan the timeline' },
]

/** Sequencer tool ribbon */
export default function ToolBar() {
  const { tool, pxPerSec, selClip } = useSnap()

  return (
    <ToolRow>
      {tools.map((t) => (
        <Tip key={t.id} title={t.tip}>
          <span>
            <Btn label={t.label} active={tool === t.id} onClick={() => setSnap({ tool: t.id })} />
          </span>
        </Tip>
      ))}
      <Tip title="Delete selected clip (Del)">
        <span>
          <Btn
            label="Del"
            disabled={!selClip}
            onClick={() => selClip && void deleteClip(selClip.kind, selClip.id)}
          />
        </span>
      </Tip>
      <Tip title="Duplicate selected clip (Ctrl+D)">
        <span>
          <Btn
            label="Dup"
            disabled={!selClip}
            onClick={() => selClip && void duplicateClip(selClip.kind, selClip.id)}
          />
        </span>
      </Tip>
      {selClip ? (
        <Tip title="Clear clip selection">
          <span><Btn label="Clear" onClick={() => clearSelClip()} /></span>
        </Tip>
      ) : null}
      <Tip title="Split clip at playhead">
        <span><Btn label="Splice" onClick={() => console.log('splice')} /></span>
      </Tip>
      <Tip title="Timeline zoom">
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#777', fontSize: '0.72rem' }}>
          Zoom
          <input type="range" min={10} max={1200} value={pxPerSec} onChange={(e) => setSnap({ pxPerSec: +e.target.value })} />
        </label>
      </Tip>
    </ToolRow>
  )
}
