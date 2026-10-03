import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

function fileUrl(p: string) {
  return 'file:///' + p.replace(/\\/g, '/')
}

const VB_H = 100
const VB_MID = VB_H / 2

/** Waveform SVG - optional slice via in/out fractions of full asset */
export default function Waveform({
  path,
  inFrac = 0,
  outFrac = 1,
  color = '#6bcf7f',
  className,
}: {
  path?: string
  inFrac?: number
  outFrac?: number
  color?: string
  className?: string
}) {
  const [peaks, setPeaks] = useState<number[]>([])

  useEffect(() => {
    if (!path) { setPeaks([]); return }
    let dead = false
    void fetch(fileUrl(path))
      .then((r) => r.json())
      .then((d) => { if (!dead) setPeaks(Array.isArray(d) ? d : []) })
      .catch(() => { if (!dead) setPeaks([]) })
    return () => { dead = true }
  }, [path])

  const slice = useMemo(() => {
    if (!peaks.length) return peaks
    const a = Math.max(0, Math.min(1, inFrac))
    const b = Math.max(a, Math.min(1, outFrac))
    const i0 = Math.floor(a * peaks.length)
    const i1 = Math.max(i0 + 1, Math.ceil(b * peaks.length))
    return peaks.slice(i0, i1)
  }, [peaks, inFrac, outFrac])

  const scaled = useMemo(() => {
    if (!slice.length) return slice
    const max = Math.max(...slice, 0.0001)
    return slice.map((p) => p / max)
  }, [slice])

  const pathD = useMemo(() => {
    const n = scaled.length
    if (!n) return ''
    let d = `M 0 ${VB_MID}`
    for (let i = 0; i < n; i++) d += ` L ${i} ${VB_MID - scaled[i] * VB_MID}`
    for (let i = n - 1; i >= 0; i--) d += ` L ${i} ${VB_MID + scaled[i] * VB_MID}`
    return `${d} Z`
  }, [scaled])

  if (!pathD) return null

  return (
    <Svg className={className} viewBox={`0 0 ${Math.max(1, scaled.length - 1)} ${VB_H}`} preserveAspectRatio="none" aria-hidden>
      <path d={pathD} fill={color} fillOpacity="0.88" />
    </Svg>
  )
}

const Svg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
  pointer-events: none;
  user-select: none;
`
