import { useState, useRef, useEffect } from 'react'
import { sampleMemories } from '../data/sampleData'
import { generateTimelineData } from '../utils/timelineData'
import { loadMemoriesFromStorage, loadBirthInfo } from '../utils/storage'

const PREVIEW_LENGTH = 120
const SLOT_W = 96
const DOT_R  = 7
const AXIS_H = 2
const DETAIL_H = 160  // reserved px at bottom for detail panel

export default function Timeline() {
  const stored    = loadMemoriesFromStorage()
  const raw       = stored.isReal ? stored.memories : sampleMemories
  const birthInfo = loadBirthInfo()
  const events    = generateTimelineData(raw, birthInfo)

  const [openId, setOpenId] = useState(null)
  const trackRef = useRef()

  useEffect(() => {
    const handler = (e) => {
      if (trackRef.current && !trackRef.current.contains(e.target)) setOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const openEvent = events.find(e => e.id === openId)

  return (
    <div style={{
      height: '100vh', overflow: 'hidden', background: '#1a0f0a',
      paddingTop: '80px', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '24px 24px 16px', flexShrink: 0 }}>
        <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Timeline
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', margin: 0 }}>
          The story of your life, in order.
        </p>
      </div>

      {/* Timeline area — fills remaining height, horizontal scroll only */}
      <div
        ref={trackRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        onClick={() => setOpenId(null)}
      >
        {/* Scrollable track */}
        <div style={{ height: '100%', overflowX: 'auto', overflowY: 'hidden' }}>
          <HorizontalTimeline
            events={events}
            openId={openId}
            onSelect={setOpenId}
            reservedBottom={openEvent ? DETAIL_H : 0}
          />
        </div>

        {/* Detail panel — overlays bottom of timeline area */}
        {openEvent && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: DETAIL_H }}>
            <DetailPanel event={openEvent} onClose={() => setOpenId(null)} />
          </div>
        )}
      </div>
    </div>
  )
}

function HorizontalTimeline({ events, openId, onSelect, reservedBottom }) {
  const containerRef = useRef()
  const [availH, setAvailH] = useState(400)

  useEffect(() => {
    const el = containerRef.current?.parentElement
    if (!el) return
    const update = () => setAvailH(el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const usableH = availH - reservedBottom
  const midY    = Math.round(usableH / 2)
  const stemH   = midY - DOT_R - AXIS_H - 32   // 32px label space
  const trackW  = Math.max(events.length * SLOT_W + SLOT_W, 600)

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: trackW, height: usableH }}
      onClick={e => e.stopPropagation()}
    >
      {/* Axis */}
      <div style={{
        position: 'absolute', top: midY, left: 0, width: trackW, height: AXIS_H,
        background: '#4a2c1a',
      }} />

      {events.map((ev, i) => {
        const cx    = i * SLOT_W + SLOT_W / 2
        const above = ev.position === 'above'
        const isOpen = openId === ev.id
        const label  = ev.caption || ev.text?.slice(0, 28) || '—'

        return (
          <div key={ev.id} style={{ position: 'absolute', left: cx, top: 0, height: '100%' }}>
            {/* Dot */}
            <div
              onClick={e => { e.stopPropagation(); onSelect(isOpen ? null : ev.id) }}
              style={{
                position: 'absolute',
                left: -DOT_R, top: midY - DOT_R,
                width: DOT_R * 2, height: DOT_R * 2,
                borderRadius: '50%',
                background: isOpen ? '#c9973a' : '#8b3a2a',
                border: `2px solid ${isOpen ? '#f5f0e8' : '#4a2c1a'}`,
                cursor: 'pointer', zIndex: 2,
              }}
            />

            {/* Stem */}
            <div style={{
              position: 'absolute', left: 0, width: 1, background: '#4a2c1a',
              ...(above
                ? { top: midY - stemH - DOT_R, height: stemH }
                : { top: midY + DOT_R,          height: stemH }),
            }} />

            {/* Label */}
            <div
              onClick={e => { e.stopPropagation(); onSelect(isOpen ? null : ev.id) }}
              style={{
                position: 'absolute',
                width: SLOT_W - 8, left: -(SLOT_W - 8) / 2,
                cursor: 'pointer', textAlign: 'center',
                ...(above
                  ? { top: midY - stemH - DOT_R - 48, height: 46 }
                  : { top: midY + DOT_R + stemH + 4,  height: 46 }),
              }}
            >
              <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.7rem', marginBottom: 2 }}>
                {ev.date}
              </div>
              <div style={{
                fontFamily: "'Crimson Text', serif",
                color: isOpen ? '#c9973a' : '#e8dfc8',
                fontSize: '0.75rem', lineHeight: 1.2,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              }}>
                {label}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DetailPanel({ event, onClose }) {
  const text = event.caption || event.text || ''
  const isLong = text.length > PREVIEW_LENGTH
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{
      height: '100%', borderTop: '1px solid #4a2c1a',
      background: '#1a0f0a', padding: '16px 24px',
      overflow: 'hidden', position: 'relative',
    }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#6b4c3b', fontSize: '1rem', cursor: 'pointer' }}>✕</button>
      <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.85rem', marginBottom: 6 }}>
        {event.date}{event.location?.city ? ` · ${event.location.city}, ${event.location.country}` : ''}
      </div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#e8dfc8', fontSize: '0.95rem', margin: '0 0 8px' }}>
        {expanded || !isLong ? text : text.slice(0, PREVIEW_LENGTH) + '…'}
      </p>
      {isLong && (
        <button onClick={() => setExpanded(v => !v)} style={{ background: 'none', border: 'none', color: '#c9973a', fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
