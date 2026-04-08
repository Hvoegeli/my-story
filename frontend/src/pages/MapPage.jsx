import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet'
import { motion } from 'framer-motion'
import { sampleMemories } from '../data/sampleData'
import { loadBirthInfo, loadTreeFromStorage } from '../utils/storage'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Year → color ─────────────────────────────────────────────────────────────
const YEAR_BANDS = [
  { before: 1950, color: '#9b59b6', label: 'Before 1950' },
  { before: 1970, color: '#3498db', label: '1950s–60s' },
  { before: 1990, color: '#1abc9c', label: '1970s–80s' },
  { before: 2000, color: '#2ecc71', label: '1990s' },
  { before: 2010, color: '#f39c12', label: '2000s' },
  { before: 2020, color: '#e67e22', label: '2010s' },
  { before: 9999, color: '#e74c3c', label: '2020s+' },
]

function yearColor(dateStr) {
  if (!dateStr) return '#c9973a'
  const year = parseInt(dateStr.slice(0, 4), 10)
  return (YEAR_BANDS.find(b => year < b.before) || YEAR_BANDS.at(-1)).color
}

function decadeColor(dateStr) {
  if (!dateStr) return '#c9973a'
  const year = parseInt(dateStr.slice(0, 4), 10)
  const decade = Math.floor(year / 10) * 10
  const palette = ['#9b59b6','#3498db','#1abc9c','#2ecc71','#f39c12','#e67e22','#e74c3c','#c9973a','#8b3a2a']
  return palette[((decade - 1950) / 10) % palette.length] || '#c9973a'
}

function fiveYearColor(dateStr) {
  if (!dateStr) return '#c9973a'
  const year = parseInt(dateStr.slice(0, 4), 10)
  const band = Math.floor((year - 1950) / 5)
  const palette = ['#9b59b6','#8e44ad','#3498db','#2980b9','#1abc9c','#16a085','#2ecc71','#27ae60','#f39c12','#e67e22','#d35400','#e74c3c','#c0392b','#c9973a','#8b3a2a']
  return palette[Math.max(0, band) % palette.length]
}

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

// ─── Collect ancestor countries from family tree ───────────────────────────
function getAncestorCountries() {
  const tree = loadTreeFromStorage()
  if (!tree) return new Set()
  const { people, rels } = tree
  const ancestorCountries = new Set()

  // BFS ancestors of user (parents, grandparents, etc.)
  const visited = new Set(['user'])
  const queue = [...(rels?.user?.parents || [])]
  while (queue.length) {
    const id = queue.shift()
    if (visited.has(id)) continue
    visited.add(id)
    const p = people?.[id]
    if (p?.birthPlace) {
      // Try to extract country from birthPlace (last comma-separated segment)
      const parts = p.birthPlace.split(',').map(s => s.trim())
      if (parts.length > 0) ancestorCountries.add(parts[parts.length - 1])
    }
    const parentIds = rels?.[id]?.parents || []
    queue.push(...parentIds)
  }
  return ancestorCountries
}

const FILTER_MODES = [
  { id: 'year',    label: 'By Year' },
  { id: 'decade',  label: 'By Decade' },
  { id: 'fiveyear', label: 'By 5-Year' },
  { id: 'type',    label: 'By Type' },
]

const TYPE_COLORS = { photo: '#c9973a', journal: '#4a7c9b', post: '#4a7c5a', manual: '#8b3a2a' }

export default function MapPage() {
  const [filterMode, setFilterMode] = useState('year')
  const [showPanel, setShowPanel] = useState(true)

  const allMemories = loadMemories()
  const birthInfo = loadBirthInfo()
  const ancestorCountries = useMemo(getAncestorCountries, [])

  const memoriesWithCoords = allMemories
    .filter(m => m.location?.lat && m.location?.lng)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  // Prepend birth city pin if available
  const allPins = useMemo(() => {
    const pins = [...memoriesWithCoords]
    // Birth pin seeded if we have coords (we don't geocode, so only if a memory has birthCity)
    return pins
  }, [memoriesWithCoords])

  const pathCoords = allPins.map(m => [m.location.lat, m.location.lng])

  function pinColor(mem) {
    if (filterMode === 'decade') return decadeColor(mem.date)
    if (filterMode === 'fiveyear') return fiveYearColor(mem.date)
    if (filterMode === 'type') return TYPE_COLORS[mem.type] || TYPE_COLORS.manual
    return yearColor(mem.date)
  }

  // Legend items
  const legendItems = useMemo(() => {
    if (filterMode === 'type') {
      const usedTypes = [...new Set(allPins.map(m => m.type))]
      return usedTypes.map(t => ({ color: TYPE_COLORS[t] || '#c9973a', label: t }))
    }
    if (filterMode === 'decade') {
      const usedDecades = [...new Set(allPins.map(m => {
        const y = parseInt(m.date?.slice(0, 4) || '0')
        return Math.floor(y / 10) * 10
      }))].sort()
      return usedDecades.map(d => ({ color: decadeColor(`${d}-01-01`), label: `${d}s` }))
    }
    if (filterMode === 'fiveyear') {
      const usedBands = [...new Set(allPins.map(m => {
        const y = parseInt(m.date?.slice(0, 4) || '0')
        return Math.floor(y / 5) * 5
      }))].sort()
      return usedBands.map(b => ({ color: fiveYearColor(`${b}-01-01`), label: `${b}–${b + 4}` }))
    }
    // year mode — show only used bands
    return YEAR_BANDS.filter(band => allPins.some(m => yearColor(m.date) === band.color))
      .map(band => ({ color: band.color, label: band.label }))
  }, [filterMode, allPins])

  const visitedCountries = new Set(allMemories.map(m => m.location?.country).filter(Boolean))
  const livedCountries = new Set()
  if (birthInfo?.country) livedCountries.add(birthInfo.country)

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '72px', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '28px 24px 12px' }}>
        <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '6px' }}>
          World Map
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '1rem', marginBottom: '10px' }}>
          Every place your story has taken you.
        </p>
      </motion.div>

      {/* Map + filter panel row */}
      <div style={{ display: 'flex', flex: 1, margin: '0 24px 24px', gap: '12px', minHeight: '520px' }}>

        {/* Map */}
        <div style={{ flex: 1, border: '1px solid #4a2c1a', position: 'relative', minHeight: '520px' }}>
          <MapContainer center={[30, 0]} zoom={2}
            style={{ height: '100%', minHeight: '520px', width: '100%', background: '#1a2a3a' }}
            zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Travel path */}
            {pathCoords.length > 1 && (
              <Polyline positions={pathCoords} color="#8b3a2a" weight={2} opacity={0.7} dashArray="6 4" />
            )}

            {/* Memory markers */}
            {allPins.map(mem => {
              const color = pinColor(mem)
              return (
                <CircleMarker key={mem.id}
                  center={[mem.location.lat, mem.location.lng]}
                  radius={9} fillColor={color} color="#f5f0e8" weight={2} fillOpacity={0.9}>
                  <Popup>
                    <div style={{ fontFamily: "'Crimson Text', serif", minWidth: '180px' }}>
                      {mem.src && <img src={mem.src} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', marginBottom: '8px' }} />}
                      <p style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2c1810' }}>
                        {mem.caption || mem.text?.slice(0, 60)}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#6b4c3b', margin: 0 }}>
                        {mem.date}{mem.location.city ? ` · ${mem.location.city}, ${mem.location.country}` : ''}
                      </p>
                      {mem.note && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#6b4c3b', marginTop: '4px' }}>{mem.note}</p>}
                      <div style={{ marginTop: '6px', display: 'inline-block', background: color, width: 10, height: 10, borderRadius: '50%' }} />
                      <span style={{ fontSize: '0.72rem', color: '#9c7a5a', marginLeft: '5px' }}>{mem.date?.slice(0, 4)}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>

        {/* Right filter panel */}
        <div style={{ width: showPanel ? 220 : 36, background: '#12080500', border: '1px solid #4a2c1a', transition: 'width 0.25s', overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <button
            onClick={() => setShowPanel(p => !p)}
            style={{ background: '#2c1810', border: 'none', color: '#c9973a', padding: '8px', cursor: 'pointer', width: '100%', fontFamily: "'Crimson Text', serif", fontSize: '0.75rem', letterSpacing: '0.04em', flexShrink: 0 }}>
            {showPanel ? '▶ Hide' : '◀'}
          </button>

          {showPanel && (
            <div style={{ padding: '14px 12px', overflowY: 'auto' }}>
              <p style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '0.8rem', letterSpacing: '0.06em', margin: '0 0 10px' }}>
                COLOR PINS BY
              </p>
              {FILTER_MODES.map(f => (
                <button key={f.id} onClick={() => setFilterMode(f.id)}
                  style={{
                    display: 'block', width: '100%', marginBottom: '6px', textAlign: 'left',
                    background: filterMode === f.id ? '#4a2c1a' : 'transparent',
                    border: '1px solid ' + (filterMode === f.id ? '#c9973a' : '#4a2c1a'),
                    color: filterMode === f.id ? '#f5f0e8' : '#9c7a5a',
                    padding: '6px 10px', fontFamily: "'Crimson Text', serif",
                    fontSize: '0.85rem', cursor: 'pointer', borderRadius: '2px',
                  }}>
                  {f.label}
                </button>
              ))}

              {/* Legend */}
              <div style={{ borderTop: '1px solid #4a2c1a', marginTop: '14px', paddingTop: '14px' }}>
                <p style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '0.75rem', letterSpacing: '0.04em', margin: '0 0 8px' }}>LEGEND</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
                  <div style={{ width: 10, height: 0, borderTop: '2px dashed #8b3a2a' }} />
                  <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.75rem' }}>Travel path</span>
                </div>
                {legendItems.map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, border: '1.5px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
                    <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.75rem' }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Country color key */}
              <div style={{ borderTop: '1px solid #4a2c1a', marginTop: '14px', paddingTop: '14px' }}>
                <p style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '0.75rem', letterSpacing: '0.04em', margin: '0 0 8px' }}>COUNTRIES</p>
                {[
                  { color: '#c9973a', label: 'Lived there (gold)' },
                  { color: '#3498db', label: 'Visited (blue)' },
                  { color: '#2ecc71', label: 'Ancestor origin (green)' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                    <div style={{ width: 12, height: 8, background: item.color, flexShrink: 0, borderRadius: '1px' }} />
                    <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.72rem' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Countries visited list */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '1rem', marginBottom: '12px', letterSpacing: '0.06em' }}>
            Countries in Your Story
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[...new Set(allMemories.map(m => m.location?.country).filter(Boolean))].map(country => {
              const lived = livedCountries.has(country)
              const ancestor = ancestorCountries.has(country)
              const bg = ancestor ? 'rgba(46,204,113,0.15)' : lived ? 'rgba(201,151,58,0.15)' : 'rgba(52,152,219,0.1)'
              const border = ancestor ? '#2ecc71' : lived ? '#c9973a' : '#3498db'
              return (
                <span key={country} style={{
                  background: bg, border: `1px solid ${border}`, color: '#e8dfc8',
                  padding: '4px 12px', fontFamily: "'Crimson Text', serif",
                  fontSize: '0.9rem', borderRadius: '2px',
                }}>
                  {country}
                  {lived && ' ✦'}
                  {ancestor && ' ◆'}
                </span>
              )
            })}
          </div>
          <p style={{ fontFamily: "'Crimson Text', serif", color: '#4a2c1a', fontSize: '0.75rem', marginTop: '8px', fontStyle: 'italic' }}>
            ✦ lived there &nbsp;·&nbsp; ◆ ancestor origin
          </p>
        </div>
      </div>
    </div>
  )
}
