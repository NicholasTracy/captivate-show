import { useEffect, useState } from 'react'
import styled from 'styled-components'
import type { AudOut, VidDest, VidOut } from '../../../shared/medOut'
import { PanelHead, SidePanel } from '../../cap/layout'
import { saveMedOut, useSnap } from '../../store/store'
import VuMeter from '../stat/VuMeter'

const DOT_LIVE = '#6bcf7f'
const DOT_IDLE = '#c9a227'
const DOT_OFF = '#555'

/** Active media outputs - VU meters and video status */
export default function OutPanel() {
  const { medOut, audLevels, vidStates } = useSnap()
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([])
  const [displays, setDisplays] = useState<{ id: number; label: string }[]>([])

  useEffect(() => {
    const loadDevices = async () => {
      try {
        // Labels stay blank until the app has media permission once
        await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
          s.getTracks().forEach((t) => t.stop())
        })
      } catch {
        /* ok — still enumerate with generic labels */
      }
      const list = await navigator.mediaDevices.enumerateDevices()
      setDevices(
        list
          .filter((d) => d.kind === 'audiooutput')
          .map((d, i) => ({ id: d.deviceId, label: d.label || `Output ${i + 1}` }))
      )
    }
    void loadDevices()
    void window.api?.disp.list().then(setDisplays)
  }, [])

  const patchAud = (id: string, patch: Partial<AudOut>) => {
    void saveMedOut({
      audOuts: medOut.audOuts.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })
  }

  const patchVid = (id: string, patch: Partial<VidOut>) => {
    void saveMedOut({
      vidOuts: medOut.vidOuts.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })
  }

  return (
    <Root>
      <PanelHead>Outputs</PanelHead>
      <Body>
        <SecLabel>Audio</SecLabel>
        {medOut.audOuts.map((out) => (
          <Row key={out.id}>
            <RowHead>
              <Enable checked={out.enabled} onChange={(e) => patchAud(out.id, { enabled: e.target.checked })} title="Enable output" />
              <Name title={out.trkId}>{out.name}</Name>
              <VuMeter level={audLevels[out.id] ?? 0} compact title={`${out.name} level`} />
            </RowHead>
            <CfgRow>
              <Sel value={out.deviceId} onChange={(e) => patchAud(out.id, { deviceId: e.target.value })} title="Audio device">
                <option value="">System default</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </Sel>
              <RemoteIn
                placeholder="Remote host"
                value={out.remote?.host ?? ''}
                onChange={(e) =>
                  patchAud(out.id, {
                    remote: e.target.value
                      ? { host: e.target.value, port: out.remote?.port ?? 5004 }
                      : undefined,
                  })
                }
                title="Remote receiver host (local muted when set)"
              />
              <PortIn
                type="number"
                min={1}
                max={65535}
                placeholder="Port"
                value={out.remote?.port ?? ''}
                disabled={!out.remote?.host}
                onChange={(e) =>
                  patchAud(out.id, {
                    remote: out.remote
                      ? { ...out.remote, port: Number(e.target.value) || 5004 }
                      : undefined,
                  })
                }
              />
            </CfgRow>
          </Row>
        ))}

        <SecLabel>Video</SecLabel>
        {medOut.vidOuts.map((out) => {
          const state = out.enabled ? (vidStates[out.id] ?? 'idle') : 'off'
          return (
            <Row key={out.id}>
              <RowHead>
                <Enable checked={out.enabled} onChange={(e) => patchVid(out.id, { enabled: e.target.checked })} title="Enable output" />
                <Name title={out.trkId}>{out.name}</Name>
                <VidDot $color={dotColor(state)} title={`Video ${state}`} />
                <StateLbl>{state}</StateLbl>
              </RowHead>
              <CfgRow>
                <Sel value={out.dest} onChange={(e) => patchVid(out.id, { dest: e.target.value as VidDest })} title="Video destination">
                  <option value="preview">Preview pane</option>
                  <option value="display">Display</option>
                  <option value="ndi">NDI</option>
                  <option value="rtsp">RTSP stream</option>
                  <option value="screen">Screen capture</option>
                </Sel>
                {out.dest === 'display' ? (
                  <Sel
                    value={out.displayId ?? ''}
                    onChange={(e) => patchVid(out.id, { displayId: e.target.value ? Number(e.target.value) : undefined })}
                    title="Target display"
                  >
                    <option value="">Primary display</option>
                    {displays.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Sel>
                ) : null}
                {out.dest === 'rtsp' ? (
                  <RemoteIn
                    placeholder="rtsp://..."
                    value={out.streamUrl ?? ''}
                    onChange={(e) => patchVid(out.id, { streamUrl: e.target.value })}
                  />
                ) : null}
                {out.dest === 'screen' ? (
                  <RemoteIn
                    placeholder="Screen source id"
                    value={out.screenSource ?? ''}
                    onChange={(e) => patchVid(out.id, { screenSource: e.target.value })}
                  />
                ) : null}
              </CfgRow>
              <CfgRow>
                <Sel
                  value={out.audioDeviceId ?? ''}
                  onChange={(e) => patchVid(out.id, { audioDeviceId: e.target.value })}
                  title="Video embedded audio device"
                >
                  <option value="">Video audio · system default</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </Sel>
                <RemoteIn
                  placeholder="Video audio remote host"
                  value={out.audioRemote?.host ?? ''}
                  onChange={(e) =>
                    patchVid(out.id, {
                      audioRemote: e.target.value
                        ? { host: e.target.value, port: out.audioRemote?.port ?? 5004 }
                        : undefined,
                    })
                  }
                  title="Remote receiver for video audio (local muted when set)"
                />
                <PortIn
                  type="number"
                  min={1}
                  max={65535}
                  placeholder="Port"
                  value={out.audioRemote?.port ?? ''}
                  disabled={!out.audioRemote?.host}
                  onChange={(e) =>
                    patchVid(out.id, {
                      audioRemote: out.audioRemote
                        ? { ...out.audioRemote, port: Number(e.target.value) || 5004 }
                        : undefined,
                    })
                  }
                />
              </CfgRow>
            </Row>
          )
        })}
      </Body>
    </Root>
  )
}

function dotColor(state: 'off' | 'idle' | 'live') {
  if (state === 'live') return DOT_LIVE
  if (state === 'idle') return DOT_IDLE
  return DOT_OFF
}

const Root = styled(SidePanel)`
  flex-shrink: 0;
  width: 100%;
  border-right: none;
  border-top: 1px solid ${(p) => p.theme.colors.divider};
  max-height: 42%;
  min-height: 160px;
`

const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.35rem 0.45rem 0.5rem;
`

const SecLabel = styled.div`
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
  margin: 0.35rem 0 0.25rem;
  &:first-child { margin-top: 0; }
`

const Row = styled.div`
  padding: 0.3rem 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.divider};
  &:last-child { border-bottom: none; }
`

const RowHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
`

const CfgRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
`

const Enable = styled.input.attrs({ type: 'checkbox' })`
  flex-shrink: 0;
`

const Name = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const VidDot = styled.span<{ $color: string }>`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: ${(p) => p.$color};
  box-shadow: 0 0 4px ${(p) => p.$color};
  flex-shrink: 0;
`

const StateLbl = styled.span`
  font-size: 0.62rem;
  color: ${(p) => p.theme.colors.text.secondary};
  text-transform: capitalize;
  min-width: 2.2rem;
`

const Sel = styled.select`
  flex: 1;
  min-width: 6rem;
  font-size: 0.68rem;
  padding: 0.15rem 0.25rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.2rem;
  background: ${(p) => p.theme.colors.bg.darker};
  color: ${(p) => p.theme.colors.text.primary};
`

const RemoteIn = styled.input`
  flex: 1;
  min-width: 5rem;
  font-size: 0.68rem;
  padding: 0.15rem 0.25rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  border-radius: 0.2rem;
  background: ${(p) => p.theme.colors.bg.darker};
  color: ${(p) => p.theme.colors.text.primary};
`

const PortIn = styled(RemoteIn)`
  flex: 0 0 4rem;
  min-width: 4rem;
`
