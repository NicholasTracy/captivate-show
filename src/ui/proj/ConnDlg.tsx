import { useEffect, useState } from 'react'
import { v4 as uid } from 'uuid'
import type { DmxConn } from '../../../shared/conn'
import type { OutCfg } from '../../../shared/outCfg'
import type { StrmCfg } from '../../../shared/types'
import type { WledDiscovered, WledNode } from '../../../shared/wled'
import { nodeFromCaps } from '../../../shared/wled'
import Btn from '../../cap/Btn'
import {
  ArtRow,
  CapInput,
  ConnGrid,
  ConnHeadLeft,
  ConnModalBox,
  ConnSec,
  ConnSecHead,
  ConnTitle,
  DevBlock,
  DevDot,
  DevRoot,
  DevRow,
  Hint,
  NoneFound,
  NumInput,
  ProtoLabel,
  ProtoRow,
  SettingLabel,
  SettingRow,
  UniBar,
  UniTag,
  WledMeta,
  WledName,
  WledRow,
  WledRowHead,
} from '../../cap/connUi'
import { ModalBg, ModalBody, ModalHead } from '../../cap/modal'
import { setSnap, useSnap } from '../../store/store'

/** Connections modal - Captivate Devices layout */
export default function ConnDlg() {
  const { connOpen } = useSnap()
  const [out, setOut] = useState<OutCfg | null>(null)
  const [strm, setStrm] = useState<StrmCfg | null>(null)
  const [dmx, setDmx] = useState<DmxConn | null>(null)
  const [usbErr, setUsbErr] = useState('')
  const [wledScan, setWledScan] = useState(false)
  const [wledFound, setWledFound] = useState<WledDiscovered[]>([])

  useEffect(() => {
    if (!connOpen) return
    void Promise.all([
      window.api.out.cfg.get(),
      window.api.strm.get(),
      window.api.out.dmx.get(),
      window.api.out.usbErr(),
    ]).then(([o, s, d, err]) => {
      setOut(o)
      setStrm(s)
      setDmx(d)
      setUsbErr(err)
    })
    const off = window.api.out.dmx.onPush((d) => setDmx(d))
    return off
  }, [connOpen])

  useEffect(() => {
    if (!connOpen || !out?.wledOn) return
    let cancelled = false
    const scan = async () => {
      setWledScan(true)
      try {
        const cfg = await window.api.out.cfg.get()
        const found = await window.api.wled.discover(2200)
        if (cancelled) return
        setWledFound(found)
        const known = new Set(cfg.wledNodes.map((n) => n.host.toLowerCase()))
        const added: WledNode[] = []
        for (const hit of found) {
          if (known.has(hit.host.toLowerCase())) continue
          const caps = await window.api.wled.probe(hit.host)
          added.push(nodeFromCaps(hit, caps))
        }
        if (added.length) {
          const next = await window.api.out.cfg.set({ wledNodes: [...cfg.wledNodes, ...added] })
          if (!cancelled) setOut(next)
        }
      } finally {
        if (!cancelled) setWledScan(false)
      }
    }
    void scan()
    const timer = setInterval(() => void scan(), 15000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [connOpen, out?.wledOn])

  if (!connOpen || !out || !strm || !dmx) return null

  const close = () => setSnap({ connOpen: false })

  const patchOut = async (p: Partial<OutCfg>) => {
    const next = await window.api.out.cfg.set(p)
    setOut(next)
    setUsbErr(await window.api.out.usbErr())
  }

  const patchStrm = async (p: Partial<StrmCfg>) => {
    const next = await window.api.strm.set(p)
    setStrm(next)
  }

  const toggleDev = (id: string) => {
    const on = new Set(out.dmxOn)
    if (on.has(id)) on.delete(id)
    else on.add(id)
    void patchOut({ dmxOn: [...on] })
  }

  const setDevUni = (id: string, uni: number) => {
    void patchOut({ dmxUniByDev: { ...out.dmxUniByDev, [id]: uni } })
  }

  const setDevPro = (id: string, on: boolean) => {
    void patchOut({ dmxProByDev: { ...out.dmxProByDev, [id]: on } })
  }

  const patchNode = (id: string, patch: Partial<WledNode>) => {
    void patchOut({
      wledNodes: out.wledNodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })
  }

  const removeNode = (id: string) => {
    void patchOut({ wledNodes: out.wledNodes.filter((n) => n.id !== id) })
  }

  const addManualWled = async () => {
    const host = prompt('WLED host or IP')
    if (!host?.trim()) return
    const caps = await window.api.wled.probe(host.trim())
    const hit: WledDiscovered = { host: host.trim(), ip: caps.ip, name: caps.host }
    void patchOut({ wledNodes: [...out.wledNodes, nodeFromCaps(hit, caps, { id: uid() })] })
  }

  const rescanWled = async () => {
    setWledScan(true)
    try {
      const found = await window.api.wled.discover(2200)
      setWledFound(found)
      const known = new Map(out.wledNodes.map((n) => [n.host.toLowerCase(), n]))
      const merged = [...out.wledNodes]
      for (const hit of found) {
        const key = hit.host.toLowerCase()
        if (known.has(key)) continue
        const caps = await window.api.wled.probe(hit.host)
        merged.push(nodeFromCaps(hit, caps))
      }
      await patchOut({ wledNodes: merged })
    } finally {
      setWledScan(false)
    }
  }

  const universes = Array.from({ length: out.universeCount }, (_, i) => i + 1)
  const hasOpenDmx = dmx.available.some((d) => d.type === 'OpenDmxUsb' || d.type === null)

  return (
    <ModalBg onClick={close}>
      <ConnModalBox onClick={(e) => e.stopPropagation()}>
        <ModalHead>
          <ConnHeadLeft>
            <ConnTitle>Connections</ConnTitle>
            <UniBar>
              Universes
              <NumInput
                type="number"
                min={1}
                max={16}
                value={out.universeCount}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => void patchOut({ universeCount: +e.target.value })}
              />
            </UniBar>
          </ConnHeadLeft>
          <Btn label="Close" onClick={close} />
        </ModalHead>
        <ModalBody>
          <ConnGrid>
            <ConnSec>
              <ConnSecHead>DMX USB</ConnSecHead>
              {dmx.available.map((dev) => {
                const on = out.dmxOn.includes(dev.connectionId)
                const live = dmx.connected.includes(dev.connectionId)
                const uni = out.dmxUniByDev[dev.connectionId] ?? 1
                const pro = out.dmxProByDev[dev.connectionId] === true
                return (
                  <DevBlock key={dev.connectionId}>
                    <DevRow>
                      <DevRoot $on={on} $live={live} onClick={() => toggleDev(dev.connectionId)}
                        title={live ? 'Connected and sending' : on ? 'Enabled — waiting for port' : 'Click to enable'}>
                        <DevDot $live={live} $on={on} />
                        {dev.name}
                      </DevRoot>
                      <NumInput
                        type="number"
                        min={1}
                        max={out.universeCount}
                        value={uni}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setDevUni(dev.connectionId, +e.target.value)}
                      />
                    </DevRow>
                    <ProtoRow onClick={(e) => e.stopPropagation()}>
                      <ProtoLabel>USB Pro protocol</ProtoLabel>
                      <input type="checkbox" checked={pro} onChange={(e) => setDevPro(dev.connectionId, e.target.checked)} />
                    </ProtoRow>
                  </DevBlock>
                )
              })}
              {!dmx.available.length && <NoneFound>No DMX USB adapters found</NoneFound>}
              {hasOpenDmx && (
                <SettingRow>
                  <SettingLabel>Open DMX refresh rate</SettingLabel>
                  <NumInput type="number" min={5} max={40} value={out.openDmxHz}
                    onChange={(e) => void patchOut({ openDmxHz: +e.target.value })} />
                </SettingRow>
              )}
              {usbErr ? <Hint style={{ color: '#f88' }}>{usbErr}</Hint> : null}
            </ConnSec>

            <ConnSec>
              <ConnSecHead>Art-Net</ConnSecHead>
              {universes.map((uni) => (
                <ArtRow key={uni}>
                  <UniTag>U{uni}</UniTag>
                  <CapInput value={out.artUniRoute[uni] ?? ''} placeholder="e.g. 192.168.1.50"
                    onChange={(e) => void patchOut({ artUniRoute: { ...out.artUniRoute, [uni]: e.target.value } })} />
                </ArtRow>
              ))}
              <Hint>Leave IP blank to disable output on that universe.</Hint>
            </ConnSec>

            <ConnSec>
              <ConnSecHead>sACN</ConnSecHead>
              <SettingRow>
                <SettingLabel>Enable sACN</SettingLabel>
                <input type="checkbox" checked={out.sacnOn} onChange={(e) => void patchOut({ sacnOn: e.target.checked })} />
              </SettingRow>
              <SettingRow>
                <SettingLabel>Default multicast</SettingLabel>
                <CapInput value={out.sacnIp} onChange={(e) => void patchOut({ sacnIp: e.target.value })} />
              </SettingRow>
              {universes.map((uni) => (
                <ArtRow key={uni}>
                  <UniTag>U{uni}</UniTag>
                  <CapInput value={out.sacnUniRoute[uni] ?? ''} placeholder={out.sacnIp}
                    onChange={(e) => void patchOut({ sacnUniRoute: { ...out.sacnUniRoute, [uni]: e.target.value } })} />
                </ArtRow>
              ))}
            </ConnSec>

            <ConnSec>
              <ConnSecHead>WLED</ConnSecHead>
              <SettingRow>
                <SettingLabel>Enable WLED output</SettingLabel>
                <input type="checkbox" checked={out.wledOn} onChange={(e) => void patchOut({ wledOn: e.target.checked })} />
              </SettingRow>
              <SettingRow>
                <Btn label={wledScan ? 'Scanning…' : 'Scan network'} onClick={() => void rescanWled()} />
                <Btn label="Add manual" onClick={() => void addManualWled()} />
                <span style={{ fontSize: '0.68rem', color: '#777' }}>
                  {wledFound.length ? `${wledFound.length} on LAN` : 'Auto-discovery every 15s when enabled'}
                </span>
              </SettingRow>
              {out.wledNodes.map((node) => (
                <WledRow key={node.id}>
                  <WledRowHead>
                    <input type="checkbox" checked={node.enabled} onChange={(e) => patchNode(node.id, { enabled: e.target.checked })} />
                    <WledName>{node.name}</WledName>
                    <NumInput type="number" min={1} max={out.universeCount} value={node.universe}
                      onChange={(e) => patchNode(node.id, { universe: +e.target.value })} />
                    <Btn label="Remove" onClick={() => removeNode(node.id)} />
                  </WledRowHead>
                  <WledMeta>
                    <span>Host: {node.host}</span>
                    <span>IP: {node.ip ?? '—'}</span>
                    <span>LEDs: {node.ledCount || '—'}</span>
                    <span>Mode: {node.outputMode}</span>
                    <span>Segment: {node.segmentId ?? 'all'}</span>
                    <span>Pixels: {node.pixelStart}{node.pixelCount ? ` +${node.pixelCount}` : ''}</span>
                  </WledMeta>
                </WledRow>
              ))}
              {!out.wledNodes.length && out.wledOn && <NoneFound>Scanning for WLED controllers…</NoneFound>}
            </ConnSec>

            <ConnSec>
              <ConnSecHead>Video Stream</ConnSecHead>
              <SettingRow>
                <SettingLabel>Enable stream</SettingLabel>
                <input type="checkbox" checked={strm.on} onChange={(e) => void patchStrm({ on: e.target.checked })} />
              </SettingRow>
              <SettingRow>
                <SettingLabel>Protocol</SettingLabel>
                <select value={strm.proto} onChange={(e) => void patchStrm({ proto: e.target.value as 'rtsp' | 'ndi' })}
                  style={{ flex: 1, background: '#000', color: '#eee', border: '1px solid #555', borderRadius: 4, padding: '0.3rem' }}>
                  <option value="rtsp">RTSP</option>
                  <option value="ndi">NDI</option>
                </select>
              </SettingRow>
              <SettingRow>
                <SettingLabel>URL / name</SettingLabel>
                <CapInput value={strm.url} onChange={(e) => void patchStrm({ url: e.target.value })} />
              </SettingRow>
              <SettingRow>
                <SettingLabel>FPS</SettingLabel>
                <NumInput type="number" min={1} max={60} value={strm.fps} onChange={(e) => void patchStrm({ fps: +e.target.value })} />
              </SettingRow>
            </ConnSec>
          </ConnGrid>
        </ModalBody>
      </ConnModalBox>
    </ModalBg>
  )
}
