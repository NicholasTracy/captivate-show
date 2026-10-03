import { useEffect, useState } from 'react'
import PauseIcon from '@mui/icons-material/Pause'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { msToClock, msToTc } from '../../../shared/tc'
import { StatFoot } from '../../cap/layout'
import {
  StatusBarCluster,
  StatusBarConnectionLabel,
  StatusBarConnectionRow,
  StatusBarPlayStopButton,
  StatusBarReadout,
  StatusBarStatusDot,
  StatusBarTextButton,
  StatusBarTransportCluster,
} from '../../cap/statUi'
import { Tip } from '../../cap/tip'
import { setSnap, useSnap } from '../../store/store'
import VuMeter from './VuMeter'

const DOT_ON = '#6bcf7f'
const DOT_OFF = '#555'

/** Captivate-style status bar - transport, timecode, outputs */
export default function StatBar() {
  const { clk, out, audLevels, medOut } = useSnap()
  const [now, setNow] = useState(msToClock())
  const playing = clk.state === 'play'
  const peakAud = Math.max(
    0,
    ...medOut.audOuts.filter((o) => o.enabled).map((o) => audLevels[o.id] ?? 0)
  )

  useEffect(() => {
    const t = setInterval(() => setNow(msToClock()), 1000)
    return () => clearInterval(t)
  }, [])

  const togglePlay = () => {
    if (playing) void window.api.clk.pause()
    else void window.api.clk.play()
  }

  return (
    <StatFoot>
      <StatusBarCluster>
        <Tip title={playing ? 'Pause' : 'Play'}>
          <StatusBarPlayStopButton $playing={playing} onClick={togglePlay}>
            {playing ? <PauseIcon /> : <PlayArrowIcon />}
          </StatusBarPlayStopButton>
        </Tip>
        <Tip title="Stop and return to start">
          <StatusBarTextButton onClick={() => void window.api.clk.stop()}>Stop</StatusBarTextButton>
        </Tip>
        <StatusBarReadout title="Sequencer timecode">{msToTc(clk.tMs, clk.fps)}</StatusBarReadout>
      </StatusBarCluster>

      <StatusBarTransportCluster>
        <Tip title="Audio output level (peak across enabled outputs)">
          <VuMeter level={peakAud} />
        </Tip>
        <Conn label="dmx" on={out.dmx} />
        <Conn label="artnet" on={out.artnet} />
        <Conn label="sacn" on={out.sacn} />
        <Conn label="wled" on={out.wled} />
        <Conn label="strm" on={out.strm} />
      </StatusBarTransportCluster>

      <StatusBarCluster>
        <StatusBarReadout style={{ minWidth: '4.5rem', fontSize: '0.85rem' }}>{now}</StatusBarReadout>
      </StatusBarCluster>
    </StatFoot>
  )
}

function Conn({ label, on }: { label: string; on: boolean }) {
  return (
    <StatusBarConnectionRow
      title={`${label} ${on ? 'live' : 'offline'} - click to open Connections`}
      style={{ cursor: 'pointer' }}
      onClick={() => setSnap({ connOpen: true })}
    >
      <StatusBarStatusDot $color={on ? DOT_ON : DOT_OFF} />
      <StatusBarConnectionLabel>{label}</StatusBarConnectionLabel>
    </StatusBarConnectionRow>
  )
}
