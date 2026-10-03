import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { parseFixtureLibrary } from '../../../shared/fixLib'
import {
  downloadFixText,
  fixFileLabel,
  loadFixFiles,
  loadManufacturers,
  type FixFile,
  type FixMfr,
  type FixSource,
} from '../../../shared/fixRemote'
import type { FixtureType } from '../../../shared/fixType'
import Btn from '../../cap/Btn'
import { FieldInput, FieldSelect, ModalBg, ModalBody, ModalBox, ModalHead } from '../../cap/modal'

const SOURCES: { id: FixSource; label: string }[] = [
  { id: 'captivate', label: 'Captivate Community Library' },
  { id: 'qlc', label: 'QLC+ Fixture Library' },
  { id: 'ofl', label: 'Open Fixture Library' },
]

/** Online fixture library browser - Captivate 2 style */
export default function FixLibDlg({
  open,
  onClose,
  onImport,
}: {
  open: boolean
  onClose: () => void
  onImport: (fixtures: FixtureType[]) => void
}) {
  const [source, setSource] = useState<FixSource>('captivate')
  const [mfrs, setMfrs] = useState<FixMfr[]>([])
  const [mfr, setMfr] = useState('')
  const [files, setFiles] = useState<FixFile[]>([])
  const [selPath, setSelPath] = useState('')
  const [mfrQ, setMfrQ] = useState('')
  const [fixQ, setFixQ] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setBusy(true)
    setMsg('')
    void loadManufacturers(source)
      .then((list) => {
        setMfrs(list)
        setMfr(list[0]?.key ?? '')
      })
      .catch((e) => setMsg(String(e)))
      .finally(() => setBusy(false))
  }, [open, source])

  useEffect(() => {
    if (!open || !mfr) { setFiles([]); return }
    setBusy(true)
    void loadFixFiles(source, mfr)
      .then((list) => {
        setFiles(list)
        setSelPath(list[0]?.path ?? '')
      })
      .catch((e) => setMsg(String(e)))
      .finally(() => setBusy(false))
  }, [open, source, mfr])

  const mfrList = useMemo(() => {
    const q = mfrQ.trim().toLowerCase()
    if (!q) return mfrs
    return mfrs.filter((m) => m.label.toLowerCase().includes(q))
  }, [mfrs, mfrQ])

  const fileList = useMemo(() => {
    const q = fixQ.trim().toLowerCase()
    if (!q) return files
    return files.filter((f) => {
      const label = fixFileLabel(source, f.name).toLowerCase()
      return label.includes(q) || f.name.toLowerCase().includes(q)
    })
  }, [files, fixQ, source])

  const sel = files.find((f) => f.path === selPath)

  const doImport = async () => {
    if (!sel) { setMsg('Select a fixture to import.'); return }
    setBusy(true)
    setMsg('')
    try {
      const text = await downloadFixText(sel.downloadUrl)
      let imported = parseFixtureLibrary(text)
      if (source === 'ofl') {
        const mfrLabel = mfrs.find((m) => m.key === mfr)?.label
        imported = imported.map((f) =>
          !f.manufacturer || f.manufacturer.toLowerCase() === 'unknown'
            ? { ...f, manufacturer: mfrLabel ?? f.manufacturer }
            : f
        )
      }
      onImport(imported)
      onClose()
    } catch (e) {
      setMsg(String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!open) return null

  return (
    <ModalBg onClick={onClose}>
      <BrowseBox onClick={(e) => e.stopPropagation()}>
        <ModalHead>
          Search Fixture Library
          <Btn label="Close" onClick={onClose} />
        </ModalHead>
        <ModalBody>
          <Row>
            <label>Source</label>
            <FieldSelect value={source} onChange={(e) => setSource(e.target.value as FixSource)}>
              {SOURCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </FieldSelect>
          </Row>
          <Grid>
            <Col>
              <Lbl>Manufacturer</Lbl>
              <FieldInput value={mfrQ} onChange={(e) => setMfrQ(e.target.value)} placeholder="Filter…" />
              <List>
                {mfrList.map((m) => (
                  <ListBtn key={m.key} $on={m.key === mfr} onClick={() => setMfr(m.key)}>{m.label}</ListBtn>
                ))}
              </List>
            </Col>
            <Col>
              <Lbl>{source === 'captivate' ? 'Model' : 'Fixture'}</Lbl>
              <FieldInput value={fixQ} onChange={(e) => setFixQ(e.target.value)} placeholder="Filter…" />
              <List>
                {fileList.map((f) => (
                  <ListBtn key={f.path} $on={f.path === selPath} onClick={() => setSelPath(f.path)}>
                    {fixFileLabel(source, f.name)}
                  </ListBtn>
                ))}
              </List>
            </Col>
          </Grid>
          {msg ? <Msg>{msg}</Msg> : null}
          <Actions>
            <Btn label={busy ? 'Working…' : 'Import selected'} onClick={() => void doImport()} />
          </Actions>
        </ModalBody>
      </BrowseBox>
    </ModalBg>
  )
}

const BrowseBox = styled(ModalBox)`width: min(56rem, 96vw);`
const Row = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;
  label { font-size: 0.72rem; color: ${(p) => p.theme.colors.text.secondary}; min-width: 4.5rem; }
`
const Grid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; min-height: 280px;
`
const Col = styled.div`
  display: flex; flex-direction: column; gap: 0.35rem; min-height: 0;
  border: 1px solid ${(p) => p.theme.colors.divider}; border-radius: 0.35rem; padding: 0.45rem;
  background: ${(p) => p.theme.colors.bg.darker};
`
const Lbl = styled.div`
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  color: ${(p) => p.theme.colors.text.secondary};
`
const List = styled.div`
  flex: 1; overflow: auto; min-height: 0;
`
const ListBtn = styled.button<{ $on: boolean }>`
  display: block; width: 100%; text-align: left;
  padding: 0.35rem 0.45rem; margin-bottom: 2px;
  border: 1px solid ${(p) => (p.$on ? p.theme.colors.text.secondary : 'transparent')};
  border-radius: 0.25rem;
  background: ${(p) => (p.$on ? p.theme.colors.bg.panel : 'transparent')};
  color: ${(p) => p.theme.colors.text.primary};
  font-size: 0.75rem; cursor: pointer;
  &:hover { background: ${(p) => p.theme.colors.bg.panel}; }
`
const Msg = styled.p`margin: 0.35rem 0 0; font-size: 0.72rem; color: #f88;`
const Actions = styled.div`display: flex; justify-content: flex-end; margin-top: 0.5rem;`
