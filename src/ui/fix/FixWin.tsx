import { useState } from 'react'
import styled from 'styled-components'
import { v4 as uid } from 'uuid'
import { mergeFixTypes } from '../../../shared/fixLib'
import { fixFootprint } from '../../../shared/fixType'
import type { FixtureType } from '../../../shared/fixType'
import { patAddr, patFootprint, patName, patTypeId, patUni } from '../../../shared/patch'
import type { PatFix } from '../../../shared/patch'
import Btn from '../../cap/Btn'
import { AppRoot, BodyRow, PanelHead, SidePanel } from '../../cap/layout'
import { FieldInput, FieldRow, FieldSelect } from '../../cap/modal'
import { saveShow, useSnap } from '../../store/store'
import FixLibDlg from './FixLibDlg'

type Tab = 'patch' | 'lib' | 'stage'

/** Fixture patch + stage window - Captivate-compatible library */
export default function FixWin() {
  const { show } = useSnap()
  const [tab, setTab] = useState<Tab>('patch')
  const [addType, setAddType] = useState('')
  const [libOpen, setLibOpen] = useState(false)

  const importLib = async () => {
    const lib = await window.api.fix.importLib()
    await saveShow({ ...show, fixLib: lib })
    if (lib.length && !addType) setAddType(lib[0].id)
  }

  const loadLib = async () => {
    const lib = await window.api.fix.loadLib()
    await saveShow({ ...show, fixLib: lib })
  }

  const saveLib = async () => {
    await window.api.fix.saveLib()
  }

  const addFix = async () => {
    const def = show.fixLib.find((f) => f.id === addType)
    if (!def) return
    const uni = 1
    const sameUni = show.patch.filter((p) => patUni(p) === uni)
    const ch = sameUni.reduce((m, p) => Math.max(m, patAddr(p) + patFootprint(p, show.fixLib)), 1)
    const fix: PatFix = {
      id: uid(),
      name: `${def.name} ${show.patch.length + 1}`,
      type: def.id,
      ch,
      universe: uni,
    }
    await saveShow({ ...show, patch: [...show.patch, fix] })
  }

  const patchFix = async (id: string, patch: Partial<PatFix>) => {
    const patchList = show.patch.map((p) => (p.id === id ? { ...p, ...patch } : p))
    await saveShow({ ...show, patch: patchList })
  }

  const delFix = async (id: string) => {
    await saveShow({ ...show, patch: show.patch.filter((p) => p.id !== id) })
  }

  const patchStage = async (patch: Partial<typeof show.stage>) => {
    await saveShow({ ...show, stage: { ...show.stage, ...patch } })
  }

  const pickBg = async () => {
    const path = await window.api.fix.pickBg()
    if (path) await patchStage({ bgPath: path })
  }

  const importOnline = async (fixtures: FixtureType[]) => {
    const merged = mergeFixTypes(show.fixLib, fixtures)
    await saveShow({ ...show, fixLib: merged })
    await window.api.fix.syncLib()
    if (merged.length && !addType) setAddType(merged[0].id)
  }

  return (
    <AppRoot>
      <PanelHead>
        Fixtures and Stage
        <TabRow>
          <Btn label="Patch" active={tab === 'patch'} onClick={() => setTab('patch')} />
          <Btn label="Library" active={tab === 'lib'} onClick={() => setTab('lib')} />
          <Btn label="Stage" active={tab === 'stage'} onClick={() => setTab('stage')} />
        </TabRow>
      </PanelHead>
      <BodyRow>
        <Main>
          {tab === 'patch' && (
            <>
              <Bar>
                <FieldSelect value={addType} onChange={(e) => setAddType(e.target.value)} disabled={!show.fixLib.length}>
                  <option value="">Select type...</option>
                  {show.fixLib.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({fixFootprint(f)}ch)</option>
                  ))}
                </FieldSelect>
                <Btn label="Add" onClick={() => void addFix()} />
                <Btn label="Import" onClick={() => void importLib()} />
                <Btn label="Search Online" onClick={() => setLibOpen(true)} />
              </Bar>
              {!show.patch.length ? (
                <Empty>Load a Captivate .cfx library, then patch fixtures by universe and address.</Empty>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Uni</th>
                      <th>Addr</th>
                      <th>Ch</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {show.patch.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <CellInput value={p.name ?? patName(p, show.fixLib)} onChange={(e) => void patchFix(p.id, { name: e.target.value })} />
                        </td>
                        <td>{typeName(show.fixLib, patTypeId(p))}</td>
                        <td>
                          <CellInput type="number" min={1} max={16} value={patUni(p)}
                            onChange={(e) => void patchFix(p.id, { universe: +e.target.value })} />
                        </td>
                        <td>
                          <CellInput type="number" min={1} max={512} value={patAddr(p)}
                            onChange={(e) => void patchFix(p.id, { ch: +e.target.value })} />
                        </td>
                        <td>{patFootprint(p, show.fixLib)}</td>
                        <td><DelBtn onClick={() => void delFix(p.id)}>×</DelBtn></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {tab === 'lib' && (
            <>
              <Bar>
                <Btn label="Search Online" onClick={() => setLibOpen(true)} />
                <Btn label="Import merge" onClick={() => void importLib()} />
                <Btn label="Load DB" onClick={() => void loadLib()} />
                <Btn label="Save DB" onClick={() => void saveLib()} />
                <span>{show.fixLib.length} types</span>
              </Bar>
              <LibList>
                {show.fixLib.map((f) => (
                  <li key={f.id}>
                    <strong>{f.name}</strong>
                    {f.manufacturer ? ` · ${f.manufacturer}` : ''} · {fixFootprint(f)} ch
                  </li>
                ))}
                {!show.fixLib.length && <Empty>No library loaded. Uses Captivate .cfx / .json format.</Empty>}
              </LibList>
            </>
          )}

          {tab === 'stage' && (
            <StageWrap>
              <FieldRow>
                Width (ft)
                <FieldInput type="number" min={1} value={show.stage.wFt}
                  onChange={(e) => void patchStage({ wFt: +e.target.value })} />
              </FieldRow>
              <FieldRow>
                Height (ft)
                <FieldInput type="number" min={1} value={show.stage.hFt}
                  onChange={(e) => void patchStage({ hFt: +e.target.value })} />
              </FieldRow>
              <FieldRow>
                Background
                <FieldInput value={show.stage.bgPath ?? ''} readOnly placeholder="No image" />
                <Btn label="Browse" onClick={() => void pickBg()} />
              </FieldRow>
              <Pad $bg={show.stage.bgPath}>
                {show.patch.filter((p) => p.x != null && p.y != null).map((p) => (
                  <Dot key={p.id} $x={p.x!} $y={p.y!} $w={show.stage.wFt} $h={show.stage.hFt} title={patName(p, show.fixLib)} />
                ))}
                {!show.stage.bgPath && <PadHint>Stage pad preview — placement UI next</PadHint>}
              </Pad>
            </StageWrap>
          )}
        </Main>
      </BodyRow>
      <FixLibDlg open={libOpen} onClose={() => setLibOpen(false)} onImport={(f) => void importOnline(f)} />
    </AppRoot>
  )
}

function typeName(lib: FixtureType[], id: string) {
  return lib.find((f) => f.id === id)?.name ?? id
}

const TabRow = styled.div`display: flex; gap: 0.25rem;`
const Main = styled(SidePanel)`flex: 1; border-right: none; padding: 0.75rem; overflow: auto;`
const Bar = styled.div`
  display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;
  font-size: 0.75rem; color: ${(p) => p.theme.colors.text.secondary};
`
const Empty = styled.p`color: ${(p) => p.theme.colors.text.secondary}; font-size: 0.82rem; margin: 1rem 0;`
const Table = styled.table`
  width: 100%; border-collapse: collapse; font-size: 0.75rem;
  th, td { border-bottom: 1px solid ${(p) => p.theme.colors.divider}; padding: 0.35rem 0.4rem; text-align: left; }
  th { color: ${(p) => p.theme.colors.text.secondary}; font-weight: 700; text-transform: uppercase; font-size: 0.65rem; }
`
const CellInput = styled.input`
  width: 100%; min-width: 0; padding: 0.2rem 0.35rem;
  border: 1px solid ${(p) => p.theme.colors.divider}; border-radius: 0.25rem;
  background: #000; color: ${(p) => p.theme.colors.text.primary}; font-size: 0.75rem;
`
const DelBtn = styled.button`
  background: transparent; border: none; color: ${(p) => p.theme.colors.text.error};
  cursor: pointer; font-size: 1.1rem; line-height: 1;
`
const LibList = styled.ul`
  margin: 0; padding: 0; list-style: none;
  li { padding: 0.35rem 0; border-bottom: 1px solid ${(p) => p.theme.colors.divider}; font-size: 0.78rem; }
`
const StageWrap = styled.div`display: flex; flex-direction: column; gap: 0.5rem; max-width: 640px;`
const Pad = styled.div<{ $bg?: string }>`
  position: relative; margin-top: 0.5rem; aspect-ratio: 4 / 3;
  border: 1px solid ${(p) => p.theme.colors.divider}; border-radius: 0.35rem;
  background: ${(p) => (p.$bg ? `url(file://${p.$bg}) center/cover` : p.theme.colors.bg.darker)};
  overflow: hidden;
`
const PadHint = styled.span`
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: ${(p) => p.theme.colors.text.secondary}; font-size: 0.78rem;
`
const Dot = styled.div<{ $x: number; $y: number; $w: number; $h: number }>`
  position: absolute; left: ${(p) => (p.$x / p.$w) * 100}%; top: ${(p) => (p.$y / p.$h) * 100}%;
  width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
  background: ${(p) => p.theme.colors.text.warning}; border: 1px solid #000;
`
