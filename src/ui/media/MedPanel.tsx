import { useState } from 'react'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import styled from 'styled-components'
import type { MediaAsset } from '../../../shared/types'
import Btn from '../../cap/Btn'
import { PanelHead, SidePanel } from '../../cap/layout'
import { Tip } from '../../cap/tip'
import { runTask, setSnap, useSnap } from '../../store/store'
import { placeMedClip } from './medClip'
import Waveform from './Waveform'
import { deferEndMedDrag, startMedDrag } from './medDrag'

function fileUrl(p: string) {
  return 'file:///' + p.replace(/\\/g, '/')
}

/** Project media bin - import, thumbnails, drag to timeline */
export default function MedPanel() {
  const { show } = useSnap()
  const aud = show.media.filter((m) => m.kind === 'audio')
  const vid = show.media.filter((m) => m.kind === 'video')
  const [dragOver, setDragOver] = useState(false)
  const [msg, setMsg] = useState('')

  const onDropFiles = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const paths = [...e.dataTransfer.files]
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => !!p)
    if (!paths.length) return
    void importPaths(paths, setMsg)
  }

  return (
    <BinWrap
      $hot={dragOver}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDropFiles}
    >
      <PanelHead>
        <span>Media</span>
        <Tip title="Import audio/video into this show">
          <span><Btn label="+ Import" onClick={() => void onImport(setMsg)} /></span>
        </Tip>
      </PanelHead>
      <Sec label="Audio" items={aud} />
      <Sec label="Video" items={vid} />
      {msg ? <Status $err={msg.startsWith('Import failed')}>{msg}</Status> : null}
      {dragOver && <DropHint>Drop media files here</DropHint>}
    </BinWrap>
  )
}

function Sec({ label, items }: { label: string; items: MediaAsset[] }) {
  return (
    <Block>
      <Lbl>{label}</Lbl>
      {items.map((m) => (
        <Item
          key={m.id}
          draggable
          title={`Drag to ${label} track · double-click to place at playhead`}
          onDragStart={(e) => {
            startMedDrag(m.id)
            e.dataTransfer.setData('text/plain', `med-asset:${m.id}`)
            e.dataTransfer.setData('application/x-med-asset', m.id)
            e.dataTransfer.effectAllowed = 'copy'
          }}
          onDragEnd={() => deferEndMedDrag()}
          onDoubleClick={() => void addClip(m)}
        >
          {m.kind === 'audio' ? <WaveThumb path={m.wavePath} /> : <VidThumb asset={m} />}
          <Meta>
            <Name>{m.name}</Name>
            <Dur>{(m.durMs / 1000).toFixed(1)}s</Dur>
          </Meta>
        </Item>
      ))}
      {!items.length && <Empty>None</Empty>}
    </Block>
  )
}

function WaveThumb({ path }: { path?: string }) {
  return (
    <ThumbBox>
      <SpeakerMark aria-hidden>
        <VolumeUpIcon sx={{ fontSize: 18, color: '#6bcf7f' }} />
      </SpeakerMark>
      {path ? (
        <WaveOverlay><Waveform path={path} color="#6bcf7f" /></WaveOverlay>
      ) : null}
    </ThumbBox>
  )
}

function VidThumb({ asset }: { asset: MediaAsset }) {
  return (
    <ThumbBox>
      {asset.thumbPath ? <img src={fileUrl(asset.thumbPath)} alt="" /> : <ThumbPlaceholder>V</ThumbPlaceholder>}
      {asset.wavePath ? (
        <WaveOverlay><Waveform path={asset.wavePath} color="#6bcf7f" /></WaveOverlay>
      ) : null}
    </ThumbBox>
  )
}

async function applyImport(result: { added: number; errors: string[] }, setMsg: (s: string) => void) {
  const show = await window.api.show.get()
  setSnap({ show })
  if (result.errors.length) {
    setMsg(`Import failed:\n${result.errors.join('\n')}`)
  } else if (result.added > 0) {
    setMsg(`Imported ${result.added} file${result.added === 1 ? '' : 's'}`)
  } else {
    setMsg('')
  }
}

async function onImport(setMsg: (s: string) => void) {
  const result = await runTask('Importing media…', () => window.api.med.import())
  await applyImport(result, setMsg)
}

async function importPaths(paths: string[], setMsg: (s: string) => void) {
  const result = await runTask('Importing media…', () => window.api.med.importPaths(paths))
  await applyImport(result, setMsg)
}

async function addClip(asset: MediaAsset) {
  const clk = await window.api.clk.get()
  const show = await window.api.show.get()
  const seq = show.seqs.find((s) => s.id === show.activeSeqId)
  if (!seq) return
  const trk = seq.trks.find((t) => t.kind === asset.kind)
  if (!trk) return
  await placeMedClip(trk, asset.id, clk.tMs)
}

const BinWrap = styled(SidePanel)<{ $hot?: boolean }>`
  width: 220px;
  min-width: 220px;
  padding: 0 0 8px;
  overflow-y: auto;
  outline: ${(p) => (p.$hot ? `2px dashed ${p.theme.colors.text.secondary}` : 'none')};
`

const Block = styled.div`padding: 0 8px;`
const Lbl = styled.div`
  font-size: 0.68rem; color: ${(p) => p.theme.colors.text.secondary};
  text-transform: uppercase; letter-spacing: 0.06em; margin: 8px 0 4px;
`
const Item = styled.div`
  display: flex; gap: 6px; align-items: center;
  padding: 5px 6px; margin-bottom: 4px; border-radius: 0.35rem;
  border: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.darker};
  font-size: 0.78rem; cursor: grab;
  &:hover { border-color: ${(p) => p.theme.colors.text.secondary}; }
`
const ThumbBox = styled.div`
  position: relative;
  width: 56px; height: 36px; flex-shrink: 0;
  border-radius: 0.25rem; overflow: hidden;
  background: #000; border: 1px solid ${(p) => p.theme.colors.divider};
  img { width: 100%; height: 100%; object-fit: cover; }
`
const WaveOverlay = styled.div`
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 45%;
  background: rgba(0, 0, 0, 0.45);
`
const SpeakerMark = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.theme.colors.text.secondary};
`
const ThumbPlaceholder = styled.div`
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  color: ${(p) => p.theme.colors.text.secondary}; font-size: 0.72rem; font-weight: 700;
`
const Meta = styled.div`min-width: 0; flex: 1;`
const Name = styled.div`
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.72rem;
`
const Dur = styled.div`font-size: 0.65rem; color: ${(p) => p.theme.colors.text.secondary};`
const Empty = styled.div`font-size: 0.72rem; color: ${(p) => p.theme.colors.text.secondary};`
const DropHint = styled.div`
  margin: 8px; padding: 8px; text-align: center; font-size: 0.72rem;
  color: ${(p) => p.theme.colors.text.secondary};
  border: 1px dashed ${(p) => p.theme.colors.divider}; border-radius: 0.35rem;
`
const Status = styled.div<{ $err?: boolean }>`
  margin: 6px 8px 0; padding: 6px 8px; font-size: 0.68rem; white-space: pre-wrap;
  color: ${(p) => (p.$err ? '#f88' : p.theme.colors.text.secondary)};
  border: 1px solid ${(p) => p.theme.colors.divider}; border-radius: 0.35rem;
  background: ${(p) => p.theme.colors.bg.darker};
`
