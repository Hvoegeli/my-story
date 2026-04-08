import { MapContainer, TileLayer, Popup, Polyline, CircleMarker } from 'react-leaflet'
import { motion } from 'framer-motion'
import { sampleMemories } from '../data/sampleData'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix default marker icons for Vite/React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ─── Year → color scale ───────────────────────────────────────────────────────
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

export default function MapPage() {
  const allMemories = loadMemories()

  const memoriesWithCoords = allMemories
    .filter(m => m.location?.lat && m.location?.lng)
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const pathCoords = memoriesWithCoords.map(m => [m.location.lat, m.location.lng])

  // Which year bands are actually used?
  const usedBands = YEAR_BANDS.filter(band =>
    memoriesWithCoords.some(m => yearColor(m.date) === band.color)
  )

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '72px', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ textAlign: 'center', padding: '28px 24px 16px' }}
      >
        <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '6px' }}>
          World Map
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '1rem', marginBottom: '14px' }}>
          Every place your story has taken you.
        </p>

        {/* Year color legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
          <LegendItem color="#8b3a2a" label="Travel path" line />
          {usedBands.map(band => (
            <LegendItem key={band.label} color={band.color} label={band.label} />
          ))}
        </div>
      </motion.div>

      {/* Map */}
      <div style={{ flex: 1, margin: '0 24px 24px', border: '1px solid #4a2c1a', minHeight: '520px', position: 'relative' }}>
        <MapContainer
          center={[30, 0]}
          zoom={2}
          style={{ height: '100%', minHeight: '520px', width: '100%', background: '#1a2a3a' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Travel path line */}
          {pathCoords.length > 1 && (
            <Polyline
              positions={pathCoords}
              color="#8b3a2a"
              weight={2}
              opacity={0.7}
              dashArray="6 4"
            />
          )}

          {/* Memory markers — color-coded by year */}
          {memoriesWithCoords.map(mem => {
            const color = yearColor(mem.date)
            return (
              <CircleMarker
                key={mem.id}
                center={[mem.location.lat, mem.location.lng]}
                radius={9}
                fillColor={color}
                color="#f5f0e8"
                weight={2}
                fillOpacity={0.9}
              >
                <Popup>
                  <div style={{ fontFamily: "'Crimson Text', serif", minWidth: '180px' }}>
                    {mem.src && <img src={mem.src} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', marginBottom: '8px' }} />}
                    <p style={{ fontWeight: 'bold', marginBottom: '4px', color: '#2c1810' }}>
                      {mem.caption || mem.text?.slice(0, 60)}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#6b4c3b', margin: 0 }}>
                      {mem.date}{mem.location.city ? ` · ${mem.location.city}, ${mem.location.country}` : ''}
                    </p>
                    {mem.note && (
                      <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#6b4c3b', marginTop: '4px' }}>{mem.note}</p>
                    )}
                    <div style={{ marginTop: '6px', display: 'inline-block', background: color, width: 10, height: 10, borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.72rem', color: '#9c7a5a', marginLeft: '5px' }}>
                      {mem.date?.slice(0, 4)}
                    </span>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* Countries visited list */}
      <div style={{ padding: '0 24px 32px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '1rem', marginBottom: '12px', letterSpacing: '0.06em' }}>
            Countries Visited
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[...new Set(allMemories.map(m => m.location?.country).filter(Boolean))].map(country => (
              <span key={country} style={{
                background: 'rgba(201,151,58,0.1)',
                border: '1px solid #4a2c1a',
                color: '#e8dfc8',
                padding: '4px 12px',
                fontFamily: "'Crimson Text', serif",
                fontSize: '0.9rem',
                borderRadius: '2px',
              }}>
                {country}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, line }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      {line ? (
        <div style={{ width: '22px', height: '0', borderTop: '2px dashed ' + color }} />
      ) : (
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: color, border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
      )}
      <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.8rem' }}>{label}</span>
    </div>
  )
}
