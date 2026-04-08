import { useState } from 'react'
import { motion } from 'framer-motion'
import { sampleMemories } from '../data/sampleData'

function loadMemories() {
  try {
    const saved = localStorage.getItem('my-story-memories')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.length > 0) return parsed
    }
  } catch {}
  return sampleMemories
}

const MILESTONES = ['Graduation', 'Travel', 'Relationship', 'Career', 'Family', 'Achievement']

const MILESTONE_COLORS = {
  Graduation: '#c9973a',
  Travel: '#4a7c9b',
  Relationship: '#a04535',
  Career: '#4a7c5a',
  Family: '#8b3a7a',
  Achievement: '#6b7c3a',
}

function groupByYear(memories) {
  const groups = {}
  memories.forEach(m => {
    const year = m.date?.slice(0, 4) || 'Unknown'
    if (!groups[year]) groups[year] = []
    groups[year].push(m)
  })
  return Object.entries(groups).sort(([a], [b]) => b - a)
}

export default function Timeline() {
  const [view, setView] = useState('chronological') // 'chronological' | 'years' | 'milestones'
  const [memories] = useState(
    [...loadMemories()].sort((a, b) => new Date(b.date) - new Date(a.date))
  )

  const byYear = groupByYear(memories)

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '80px', paddingBottom: '60px', paddingInline: '24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Timeline
          </h1>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a' }}>
            The story of your life, in order.
          </p>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '20px' }}>
            {[['chronological', 'Chronological'], ['years', 'By Year'], ['milestones', 'Milestones']].map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? '#8b3a2a' : 'transparent',
                  border: '1px solid ' + (view === v ? '#8b3a2a' : '#4a2c1a'),
                  color: view === v ? '#f5f0e8' : '#9c7a5a',
                  padding: '6px 16px',
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  borderRadius: '2px',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #4a2c1a', marginBottom: '40px' }} />

        {/* Chronological view */}
        {view === 'chronological' && (
          <div style={{ position: 'relative', paddingLeft: '32px' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '1px', background: 'linear-gradient(to bottom, transparent, #4a2c1a 10%, #4a2c1a 90%, transparent)' }} />

            {memories.map((mem, i) => (
              <motion.div
                key={mem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ position: 'relative', marginBottom: '32px' }}
              >
                {/* Dot on timeline */}
                <div style={{
                  position: 'absolute', left: '-28px', top: '6px',
                  width: '10px', height: '10px',
                  borderRadius: '50%',
                  background: mem.milestone ? MILESTONE_COLORS[mem.milestone] || '#c9973a' : '#4a2c1a',
                  border: '2px solid ' + (mem.milestone ? MILESTONE_COLORS[mem.milestone] || '#c9973a' : '#6b4c3b'),
                }} />

                <MemoryEntry memory={mem} />
              </motion.div>
            ))}
          </div>
        )}

        {/* By year view */}
        {view === 'years' && (
          <div>
            {byYear.map(([year, mems]) => (
              <div key={year} style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <span style={{
                    fontFamily: "'Special Elite', cursive",
                    color: '#c9973a',
                    fontSize: '1.8rem',
                    lineHeight: 1,
                  }}>{year}</span>
                  <div style={{ flex: 1, height: '1px', background: '#4a2c1a' }} />
                </div>
                {mems.map(mem => <MemoryEntry key={mem.id} memory={mem} />)}
              </div>
            ))}
          </div>
        )}

        {/* Milestones view */}
        {view === 'milestones' && (
          <div>
            {MILESTONES.map(milestone => {
              const mems = memories.filter(m => m.milestone === milestone)
              if (mems.length === 0) return null
              return (
                <div key={milestone} style={{ marginBottom: '40px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: MILESTONE_COLORS[milestone] }} />
                    <span style={{
                      fontFamily: "'Special Elite', cursive",
                      color: '#f5f0e8',
                      fontSize: '1.2rem',
                    }}>{milestone}</span>
                    <div style={{ flex: 1, height: '1px', background: '#4a2c1a' }} />
                  </div>
                  {mems.map(mem => <MemoryEntry key={mem.id} memory={mem} />)}
                </div>
              )
            })}
            <div style={{ textAlign: 'center', color: '#4a2c1a', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '0.9rem' }}>
              Tag memories with milestones from the scrapbook to see them here.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MemoryEntry({ memory }) {
  return (
    <div style={{
      background: 'rgba(245,240,232,0.05)',
      border: '1px solid #4a2c1a',
      padding: '14px 16px',
      marginBottom: '12px',
      display: 'flex',
      gap: '14px',
      alignItems: 'flex-start',
    }}>
      {memory.src && (
        <img src={memory.src} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', flexShrink: 0, border: '2px solid #4a2c1a' }} />
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: memory.type !== 'photo' ? 'italic' : 'normal', color: '#e8dfc8', fontSize: '0.95rem', marginBottom: '4px' }}>
          {memory.caption || memory.text}
        </p>
        <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem' }}>
          {memory.date}
          {memory.location?.city ? ` · ${memory.location.city}, ${memory.location.country}` : ''}
          {memory.milestone ? ` · ${memory.milestone}` : ''}
        </span>
      </div>
    </div>
  )
}
