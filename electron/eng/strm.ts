import type { StrmCfg } from '../../shared/types'
import { saveStrmCfg } from './cap/outStore'

/** Stream output manager stub - NDI/RTSP from main ffmpeg decode (phase 4) */
export class Strm {
  cfg: StrmCfg = {
    on: false,
    proto: 'rtsp',
    url: 'rtsp://127.0.0.1:8554/show',
    name: 'Captivate Show',
    fps: 30,
  }

  get(): StrmCfg {
    return { ...this.cfg }
  }

  set(cfg: Partial<StrmCfg>) {
    this.cfg = { ...this.cfg, ...cfg }
    saveStrmCfg(this.cfg)
  }

  start(_videoPath: string, _tMs: number) {
    if (!this.cfg.on) return
    // Phase 4: spawn ffmpeg encode pipeline here
    console.log('[strm] start', this.cfg.proto, this.cfg.url)
  }

  stop() {
    console.log('[strm] stop')
  }

  tick(_videoPath: string | null, _tMs: number) {
    if (!this.cfg.on) return
    // Phase 4: push frame at playhead
  }
}
