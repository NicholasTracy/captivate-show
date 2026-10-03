/** Media output routing - audio devices/remotes and video destinations */

export type VidDest = 'preview' | 'display' | 'ndi' | 'rtsp' | 'screen'
export type VidOutState = 'off' | 'idle' | 'live'

export interface AudRemote {
  host: string
  port: number
}

export interface AudOut {
  id: string
  name: string
  trkId: string
  enabled: boolean
  /** '' = system default output */
  deviceId: string
  remote?: AudRemote
}

export interface VidOut {
  id: string
  name: string
  trkId: string
  enabled: boolean
  dest: VidDest
  displayId?: number
  screenSource?: string
  streamUrl?: string
  /** Embedded video audio — '' = system default output */
  audioDeviceId: string
  audioRemote?: AudRemote
}

export interface MedOutCfg {
  audOuts: AudOut[]
  vidOuts: VidOut[]
}

export interface MedOutStatus {
  audLevels: Record<string, number>
  vidStates: Record<string, VidOutState>
}

const AUD_IDS = ['aud-out-1', 'aud-out-2', 'aud-out-3', 'aud-out-4'] as const
const VID_IDS = ['vid-out-1', 'vid-out-2', 'vid-out-3', 'vid-out-4'] as const
const AUD_TRKS = ['t-aud-1', 't-aud-2', 't-aud-3', 't-aud-4'] as const
const VID_TRKS = ['t-vid-1', 't-vid-2', 't-vid-3', 't-vid-4'] as const

export function mkMedOutCfg(): MedOutCfg {
  return {
    audOuts: AUD_IDS.map((id, i) => ({
      id,
      name: `Audio Out ${i + 1}`,
      trkId: AUD_TRKS[i],
      enabled: i === 0,
      deviceId: '',
    })),
    vidOuts: VID_IDS.map((id, i) => ({
      id,
      name: `Video Out ${i + 1}`,
      trkId: VID_TRKS[i],
      enabled: i === 0,
      dest: i === 0 ? 'preview' : 'display',
      displayId: undefined,
      audioDeviceId: '',
    })),
  }
}

export function normMedOutCfg(raw: Partial<MedOutCfg> | null | undefined): MedOutCfg {
  const base = mkMedOutCfg()
  if (!raw) return base
  return {
    audOuts: base.audOuts.map((d) => ({ ...d, ...(raw.audOuts?.find((a) => a.id === d.id) ?? {}) })),
    vidOuts: base.vidOuts.map((d) => ({ ...d, ...(raw.vidOuts?.find((v) => v.id === d.id) ?? {}) })),
  }
}

export function patchMedOutCfg(cur: MedOutCfg, patch: Partial<MedOutCfg>): MedOutCfg {
  return normMedOutCfg({
    audOuts: patch.audOuts ?? cur.audOuts,
    vidOuts: patch.vidOuts ?? cur.vidOuts,
  })
}
