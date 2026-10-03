import { useEffect, type RefObject } from 'react'
import { getSnap, setSnap } from '../../store/store'
import { ensureAudGraph } from './audGraph'

/** Per-output VU level pushed into store.audLevels[outId] */
export function useAudLevel(
  audioRef: RefObject<HTMLAudioElement | null>,
  outId: string,
  active: boolean,
  muteLocal: boolean,
  deviceId: string
) {
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const graph = ensureAudGraph(audio, muteLocal, deviceId)
    const buf = new Uint8Array(512)
    let smooth = 0
    let lastLvl = -1
    let lastPush = 0
    let raf = 0

    const tick = () => {
      graph.gain.gain.value = muteLocal ? 0 : 1
      let lvl = 0

      if (active) {
        void graph.ctx.resume()
        graph.analyser.getByteTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128
          sum += v * v
        }
        const raw = Math.min(1, Math.sqrt(sum / buf.length) * 4)
        smooth = smooth * 0.75 + raw * 0.25
        lvl = smooth
      } else {
        smooth = 0
      }

      const now = performance.now()
      if (Math.abs(lvl - lastLvl) > 0.012 && now - lastPush > 40) {
        lastLvl = lvl
        lastPush = now
        const cur = getSnap().audLevels
        if (cur[outId] !== lvl) setSnap({ audLevels: { ...cur, [outId]: lvl } })
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      const cur = getSnap().audLevels
      if (cur[outId]) {
        const next = { ...cur }
        delete next[outId]
        setSnap({ audLevels: next })
      }
    }
  }, [audioRef, outId, active, muteLocal, deviceId])
}
