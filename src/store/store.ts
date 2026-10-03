import { useSyncExternalStore } from 'react'
import type { TaskProgress } from '../../shared/taskProg'
import type { MedOutCfg, VidOutState } from '../../shared/medOut'
import { mkMedOutCfg } from '../../shared/medOut'
import type { ClkState, OutStatus, ShowFile } from '../../shared/types'
import { mkShow } from '../../shared/types'
import { fitTimelineDur } from '../../shared/seqUtil'

export type LoadingState = TaskProgress | null
export type SelClip = { kind: 'lx' | 'med'; id: string } | null

type Snap = {
  show: ShowFile
  clk: ClkState
  out: OutStatus
  medOut: MedOutCfg
  audLevels: Record<string, number>
  vidStates: Record<string, VidOutState>
  tool: 'sel' | 'razor' | 'hand'
  selClip: SelClip
  pxPerSec: number
  scrollMs: number
  connOpen: boolean
  loading: LoadingState
}

let snap: Snap = {
  show: mkShow(),
  clk: { state: 'stop', tMs: 0, fps: 24, durMs: 120_000 },
  out: { dmx: false, artnet: false, sacn: false, wled: false, strm: false },
  medOut: mkMedOutCfg(),
  audLevels: {},
  vidStates: {},
  tool: 'sel',
  selClip: null,
  pxPerSec: 80,
  scrollMs: 0,
  connOpen: false,
  loading: null,
}

const subs = new Set<() => void>()
const emit = () => subs.forEach((f) => f())

export function getSnap() {
  return snap
}

export function setSnap(patch: Partial<Snap>) {
  snap = { ...snap, ...patch }
  emit()
}

/** Push show changes to main and refresh local snap */
export async function saveShow(next: ShowFile) {
  const fitted = fitTimelineDur(next)
  const saved = await window.api.show.set(fitted)
  const clk = await window.api.clk.get()
  setSnap({ show: saved, clk })
  return saved
}

export function useSnap() {
  return useSyncExternalStore((cb) => {
    subs.add(cb)
    return () => subs.delete(cb)
  }, getSnap)
}

const LOAD_DELAY_MS = 1000

/** Run async work; show loading bar only if it takes longer than ~1s */
export async function runTask<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let shown = false
  let latest: TaskProgress = { label, progress: -1 }
  let unsub: (() => void) | undefined

  if (window.api?.task) {
    unsub = window.api.task.onProgress((p) => {
      latest = p
      if (shown) setSnap({ loading: p })
    })
  }

  const timer = setTimeout(() => {
    shown = true
    setSnap({ loading: latest })
  }, LOAD_DELAY_MS)

  try {
    return await fn()
  } finally {
    clearTimeout(timer)
    unsub?.()
    if (shown) setSnap({ loading: null })
  }
}

/** Load show, clock, outputs from main */
export async function boot() {
  if (!window.api) return
  const [show, clk, out, medOut] = await Promise.all([
    window.api.show.get(),
    window.api.clk.get(),
    window.api.out.status(),
    window.api.medOut.get(),
  ])
  setSnap({ show, clk, out, medOut, audLevels: {}, vidStates: {} })
  window.api.clk.onTick((c) => setSnap({ clk: c }))
  window.api.out.onStatus((o) => setSnap({ out: o }))
  window.api.show.onPush((s) => setSnap({ show: s }))
}

/** Persist media output routing config */
export async function saveMedOut(patch: Partial<MedOutCfg>) {
  const cur = getSnap().medOut
  const next = await window.api.medOut.set({
    audOuts: patch.audOuts ?? cur.audOuts,
    vidOuts: patch.vidOuts ?? cur.vidOuts,
  })
  setSnap({ medOut: next })
  return next
}
