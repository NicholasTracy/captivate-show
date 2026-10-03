/** Core show file types - lighting-first, media as clips */

import type { PatFix, StageCfg } from './patch'
import { mkStage, normPatFix } from './patch'
import { upgradeFixDefs } from './fixLib'
import type { FixtureType } from './fixType'

export type MediaKind = 'audio' | 'video'
export type LxMode = 'curve' | 'color' | 'strobe' | 'chase' | 'step' | 'trigger'
export type TrkKind = 'lx' | 'audio' | 'video'
export type PlayState = 'stop' | 'play' | 'pause'

export interface ShowMeta {
  name: string
  fps: number
  durMs: number
}

export interface MediaAsset {
  id: string
  name: string
  kind: MediaKind
  path: string
  durMs: number
  wavePath?: string
  thumbPath?: string
  meta?: { fps?: number; w?: number; h?: number; rate?: number; hasAudio?: boolean }
}

export interface Kf {
  tMs: number
  val: number
  ease?: 'step' | 'linear'
}

export interface LxClip {
  id: string
  trkId: string
  startMs: number
  endMs: number
  mode: LxMode
  fixture?: string
  chan?: number
  kfs?: Kf[]
  label?: string
}

export interface MedClip {
  id: string
  trkId: string
  assetId: string
  startMs: number
  inMs: number
  outMs: number
}

export interface Trk {
  id: string
  name: string
  kind: TrkKind
  universe?: number
  mute?: boolean
  color?: string
}

export interface Seq {
  id: string
  name: string
  trks: Trk[]
  lxClips: LxClip[]
  medClips: MedClip[]
}

export interface SchedSlot {
  id: string
  at: string
  seqId: string
  repeat?: 'once' | 'daily'
}

export interface ShowFile {
  schema: 'captivate.show'
  version: 1
  meta: ShowMeta
  media: MediaAsset[]
  fixLib: FixtureType[]
  patch: PatFix[]
  stage: StageCfg
  seqs: Seq[]
  activeSeqId: string
  sched: SchedSlot[]
}

export interface ClkState {
  state: PlayState
  tMs: number
  fps: number
  durMs: number
}

export interface OutStatus {
  dmx: boolean
  artnet: boolean
  sacn: boolean
  wled: boolean
  strm: boolean
}

export interface StrmCfg {
  on: boolean
  proto: 'rtsp' | 'ndi'
  url: string
  name: string
  fps: number
}

export function mkShow(name = 'Untitled'): ShowFile {
  const seqId = 'seq-main'
  return {
    schema: 'captivate.show',
    version: 1,
    meta: { name, fps: 24, durMs: 120_000 },
    media: [],
    fixLib: [],
    patch: [],
    stage: mkStage(),
    seqs: [
      {
        id: seqId,
        name: 'Main',
        trks: [
          { id: 't-lx-1', name: 'Universe 1', kind: 'lx', universe: 1, color: '#4a9eff' },
          { id: 't-aud-1', name: 'Audio 1', kind: 'audio', color: '#6bcf7f' },
          { id: 't-aud-2', name: 'Audio 2', kind: 'audio', color: '#5ab868' },
          { id: 't-aud-3', name: 'Audio 3', kind: 'audio', color: '#4a9e55' },
          { id: 't-aud-4', name: 'Audio 4', kind: 'audio', color: '#3a8445' },
          { id: 't-vid-1', name: 'Video 1', kind: 'video', color: '#c77dff' },
          { id: 't-vid-2', name: 'Video 2', kind: 'video', color: '#b56ef0' },
          { id: 't-vid-3', name: 'Video 3', kind: 'video', color: '#a35fe3' },
          { id: 't-vid-4', name: 'Video 4', kind: 'video', color: '#9150d6' },
        ],
        lxClips: [],
        medClips: [],
      },
    ],
    activeSeqId: seqId,
    sched: [],
  }
}

/** Migrate older show payloads */
export function normShow(show: ShowFile): ShowFile {
  return {
    ...show,
    fixLib: upgradeFixDefs(show.fixLib ?? []),
    patch: (show.patch ?? []).map((p) => normPatFix(p)),
    stage: show.stage ?? mkStage(),
  }
}
