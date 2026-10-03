import { useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { setSnap } from '../../store/store'
import { SEQ } from './seqUi'

type Props = {
  scrollRef: React.RefObject<HTMLDivElement | null>
  pxPerSec: number
}

/** Large horizontal scrollbar synced to the sequencer scroll area */
export default function SeqHScroll({ scrollRef, pxPerSec }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x0: number; scroll0: number } | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const [trackW, setTrackW] = useState(0)

  const pushScroll = useCallback(
    (left: number) => {
      const el = scrollRef.current
      if (!el) return
      const max = Math.max(0, el.scrollWidth - el.clientWidth)
      const next = Math.max(0, Math.min(max, left))
      el.scrollLeft = next
      setScrollLeft(next)
      setSnap({ scrollMs: (next / pxPerSec) * 1000 })
    },
    [scrollRef, pxPerSec]
  )

  const syncMetrics = useCallback(() => {
    const el = scrollRef.current
    const track = trackRef.current
    if (!el) return
    const max = Math.max(0, el.scrollWidth - el.clientWidth)
    setScrollLeft(el.scrollLeft)
    setMaxScroll(max)
    if (track) setTrackW(track.clientWidth)
    setSnap({ scrollMs: (el.scrollLeft / pxPerSec) * 1000 })
  }, [scrollRef, pxPerSec])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      setScrollLeft(el.scrollLeft)
      setMaxScroll(Math.max(0, el.scrollWidth - el.clientWidth))
      setSnap({ scrollMs: (el.scrollLeft / pxPerSec) * 1000 })
    }

    el.addEventListener('scroll', onScroll)
    const ro = new ResizeObserver(syncMetrics)
    ro.observe(el)
    if (trackRef.current) ro.observe(trackRef.current)
    syncMetrics()

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [scrollRef, pxPerSec, syncMetrics])

  useEffect(() => {
    syncMetrics()
  }, [pxPerSec, syncMetrics])

  const el = scrollRef.current
  const clientRatio = el && el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1
  const thumbW = maxScroll <= 0 ? trackW : Math.max(56, trackW * clientRatio)
  const travel = Math.max(1, trackW - thumbW)
  const thumbLeft = maxScroll <= 0 ? 0 : (scrollLeft / maxScroll) * travel

  const scrollFromTrackX = (clientX: number) => {
    const track = trackRef.current
    const el = scrollRef.current
    if (!track || !el) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left - thumbW / 2) / travel))
    pushScroll(ratio * maxScroll)
  }

  const onTrackDown = (e: React.MouseEvent) => {
    if (e.target !== trackRef.current) return
    scrollFromTrackX(e.clientX)
  }

  const onThumbDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    dragRef.current = { x0: e.clientX, scroll0: scrollLeft }

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return
      const dx = ev.clientX - dragRef.current.x0
      const dScroll = (dx / travel) * maxScroll
      pushScroll(dragRef.current.scroll0 + dScroll)
    }

    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <Wrap>
      <SideGap aria-hidden />
      <Track ref={trackRef} onMouseDown={onTrackDown}>
        {maxScroll > 0 ? (
          <Thumb $left={thumbLeft} $w={thumbW} onMouseDown={onThumbDown} title="Drag to scroll timeline" />
        ) : null}
      </Track>
    </Wrap>
  )
}

const Wrap = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: stretch;
  height: 32px;
  border-top: 1px solid ${(p) => p.theme.colors.divider};
  background: ${(p) => p.theme.colors.bg.darker};
`

const SideGap = styled.div`
  width: ${SEQ.sideW}px;
  min-width: ${SEQ.sideW}px;
  flex-shrink: 0;
  border-right: 1px solid ${(p) => p.theme.colors.divider};
`

const Track = styled.div`
  flex: 1;
  position: relative;
  margin: 5px 10px;
  min-width: 0;
  border-radius: 8px;
  background: ${(p) => p.theme.colors.bg.primary};
  border: 1px solid ${(p) => p.theme.colors.divider};
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
  cursor: pointer;
`

const Thumb = styled.div<{ $left: number; $w: number }>`
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: ${(p) => p.$left}px;
  width: ${(p) => p.$w}px;
  border-radius: 6px;
  cursor: grab;
  background: linear-gradient(180deg, #b8b8b8 0%, #7a7a7a 55%, #5e5e5e 100%);
  border: 1px solid #aaa;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.35);

  &:hover {
    background: linear-gradient(180deg, #d0d0d0 0%, #909090 55%, #707070 100%);
  }

  &:active {
    cursor: grabbing;
    background: linear-gradient(180deg, #909090 0%, #666 55%, #505050 100%);
  }
`
