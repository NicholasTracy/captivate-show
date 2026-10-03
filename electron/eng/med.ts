import { spawn, execFile } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { v4 as uid } from 'uuid'
import type { MediaAsset, MediaKind } from '../../shared/types'
import type { TaskProgress } from '../../shared/taskProg'

export interface MedImportResult {
  added: MediaAsset[]
  errors: string[]
}

let ffPath = 'ffmpeg'
let probePath = 'ffprobe'

try {
  const mod = require('ffmpeg-static') as string | null
  if (mod) ffPath = mod
} catch {
  /* PATH fallback */
}

try {
  const mod = require('ffprobe-static') as { path?: string } | string | null
  const p = typeof mod === 'string' ? mod : mod?.path
  if (p) probePath = p
} catch {
  /* PATH fallback */
}

type ProbeStream = {
  codec_type: string
  width?: number
  height?: number
  r_frame_rate?: string
  sample_rate?: string
  disposition?: { attached_pic?: number }
}

const AUDIO_EXT = new Set(['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma', '.aiff', '.aif', '.opus'])

function classifyKind(file: string, streams: ProbeStream[]): MediaKind {
  const aud = streams.find((s) => s.codec_type === 'audio')
  const vid = streams.find((s) => s.codec_type === 'video')
  if (!vid) return 'audio'
  if (!aud) return 'video'

  const ext = path.extname(file).toLowerCase()
  if (AUDIO_EXT.has(ext)) return 'audio'

  const w = vid.width ?? 0
  const h = vid.height ?? 0
  if (vid.disposition?.attached_pic === 1) return 'audio'
  if (w > 0 && h > 0 && w <= 32 && h <= 32) return 'audio'

  return 'video'
}

export function probe(file: string): Promise<{ durMs: number; kind: MediaKind; meta: MediaAsset['meta'] }> {
  return new Promise((resolve, reject) => {
    execFile(
      probePath,
      ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file],
      (err, stdout) => {
        if (err) return reject(err)
        try {
          const j = JSON.parse(stdout)
          const durMs = Math.round(parseFloat(j.format?.duration ?? '0') * 1000)
          const streams = (j.streams ?? []) as ProbeStream[]
          const vid = streams.find((s) => s.codec_type === 'video')
          const aud = streams.find((s) => s.codec_type === 'audio')
          const kind = classifyKind(file, streams)
          resolve({
            durMs,
            kind,
            meta: {
              fps: vid?.r_frame_rate ? evalFps(vid.r_frame_rate) : undefined,
              w: vid?.width,
              h: vid?.height,
              rate: aud?.sample_rate ? +aud.sample_rate : undefined,
              hasAudio: !!aud,
            },
          })
        } catch (e) {
          reject(e)
        }
      }
    )
  })
}

function evalFps(rate: string): number | undefined {
  const [a, b] = rate.split('/').map(Number)
  if (!a || !b) return undefined
  return Math.round((a / b) * 100) / 100
}

/** Peak count stored per imported waveform */
export const WAVE_PEAKS = 2400

export function mkWave(file: string, cacheDir: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(cacheDir, { recursive: true })
    const out = path.join(cacheDir, `${uid()}.json`)
    const peaks: number[] = []
    const args = ['-i', file, '-ac', '1', '-ar', '16000', '-f', 's16le', '-acodec', 'pcm_s16le', 'pipe:1']
    const proc = spawn(ffPath, args, { stdio: ['ignore', 'pipe', 'ignore'] })
    const chunks: Buffer[] = []
    proc.stdout.on('data', (d: Buffer) => chunks.push(d))
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`ffmpeg wave exit ${code}`))
      const buf = Buffer.concat(chunks)
      const samples = Math.floor(buf.length / 2)
      const step = Math.max(1, Math.floor(samples / WAVE_PEAKS))
      for (let i = 0; i < WAVE_PEAKS; i++) {
        const i0 = i * step
        const i1 = Math.min(samples, (i + 1) * step)
        let max = 0
        for (let s = i0; s < i1; s++) {
          max = Math.max(max, Math.abs(buf.readInt16LE(s * 2)) / 32768)
        }
        peaks.push(max)
      }
      fs.writeFileSync(out, JSON.stringify(peaks))
      resolve(out)
    })
  })
}

/** Extract a preview frame for video bin thumbnail */
export function mkThumb(file: string, cacheDir: string, durMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(cacheDir, { recursive: true })
    const out = path.join(cacheDir, `${uid()}.jpg`)
    const seek = Math.max(0, Math.min((durMs / 1000) * 0.1, 5))
    const args = ['-ss', seek.toFixed(2), '-i', file, '-frames:v', '1', '-q:v', '4', '-y', out]
    execFile(ffPath, args, (err) => {
      if (err) return reject(err)
      resolve(out)
    })
  })
}

/** Import one or more media files into asset list */
export async function importMediaFiles(
  files: string[],
  cacheDir: string,
  onProgress?: (p: TaskProgress) => void
): Promise<MedImportResult> {
  const added: MediaAsset[] = []
  const errors: string[] = []
  const total = Math.max(1, files.length)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const name = path.basename(file)
    onProgress?.({ label: `Probing ${name}…`, progress: Math.round((i / total) * 100) })

    try {
      const info = await probe(file)
      const asset: MediaAsset = {
        id: uid(),
        name,
        kind: info.kind,
        path: file,
        durMs: info.durMs,
        meta: info.meta,
      }

      const hasAudio = !!info.meta?.hasAudio

      if (info.kind === 'audio' || hasAudio) {
        onProgress?.({ label: `Waveform ${name}…`, progress: Math.round(((i + 0.35) / total) * 100) })
        try {
          asset.wavePath = await mkWave(file, cacheDir)
        } catch (e) {
          console.warn('waveform failed', file, e)
        }
      }

      if (info.kind === 'video') {
        onProgress?.({ label: `Thumbnail ${name}…`, progress: Math.round(((i + 0.55) / total) * 100) })
        try {
          asset.thumbPath = await mkThumb(file, cacheDir, info.durMs)
        } catch (e) {
          console.warn('thumbnail failed', file, e)
        }
      }

      added.push(asset)
      onProgress?.({ label: `Imported ${name}`, progress: Math.round(((i + 1) / total) * 100) })
    } catch (e) {
      const msg = `${name}: ${e instanceof Error ? e.message : String(e)}`
      console.error('import fail', file, e)
      errors.push(msg)
    }
  }

  return { added, errors }
}
