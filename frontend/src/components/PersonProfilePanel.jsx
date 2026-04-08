import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { imageToBase64 } from '../utils/storage'

const uid = () => `s${Date.now()}${Math.random().toString(36).slice(2, 6)}`

const TABS = ['Stories', 'Photos', 'Places']

// ─── Story entry ──────────────────────────────────────────────────────────────
function StoriesTab({ profile, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ text: '', date: '' })

  const save = () => {
    if (!form.text.trim()) return
    onUpdate({ ...profile, stories: [{ id: uid(), ...form }, ...(profile.stories || [])] })
    setForm({ text: '', date: '' })
    setAdding(false)
  }

  const remove = (id) => onUpdate({ ...profile, stories: profile.stories.filter(s => s.id !== id) })

  return (
    <div style={{ padding: '16px' }}>
      {!adding ? (
        <button onClick={() => setAdding(true)} style={addBtnStyle}>
          + Add a Story
        </button>
      ) : (
        <div style={{ background: '#faf7f2', border: '1px solid #d4c4a8', padding: '14px', marginBottom: '14px', borderRadius: '2px' }}>
          <textarea
            autoFocus
            value={form.text}
            onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
            rows={5}
            placeholder="Write a story, memory, or anything you know about this person…"
            style={textareaStyle}
          />
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ ...inputStyle, marginTop: '8px', width: '180px' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={() => setAdding(false)} style={cancelBtnStyle}>Cancel</button>
            <button onClick={save} style={saveBtnStyle}>Save Story</button>
          </div>
        </div>
      )}

      {(profile.stories || []).length === 0 && !adding && (
        <p style={emptyStyle}>No stories yet. Add the first one above.</p>
      )}

      {(profile.stories || []).map(s => (
        <div key={s.id} style={entryCardStyle}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#2c1810', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>
            "{s.text}"
          </p>
          {s.date && <span style={metaStyle}>{s.date}</span>}
          <button onClick={() => remove(s.id)} style={removeBtnStyle}>Remove</button>
        </div>
      ))}
    </div>
  )
}

// ─── Photos tab ───────────────────────────────────────────────────────────────
function PhotosTab({ profile, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [preview, setPreview] = useState(null)
  const [pickedFile, setPickedFile] = useState(null)
  const [form, setForm] = useState({ caption: '', date: '' })
  const fileRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setPickedFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer.files[0]
    if (!f || !f.type.startsWith('image/')) return
    setPickedFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const save = async () => {
    if (!preview) return
    let src = preview
    if (pickedFile) {
      src = await imageToBase64(pickedFile)
    }
    onUpdate({
      ...profile,
      photos: [{ id: uid(), src, ...form }, ...(profile.photos || [])],
    })
    setPreview(null)
    setPickedFile(null)
    setForm({ caption: '', date: '' })
    setAdding(false)
  }

  const remove = (id) => onUpdate({ ...profile, photos: profile.photos.filter(p => p.id !== id) })

  return (
    <div style={{ padding: '16px' }}>
      {!adding ? (
        <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Add a Photo</button>
      ) : (
        <div style={{ background: '#faf7f2', border: '1px solid #d4c4a8', padding: '14px', marginBottom: '14px', borderRadius: '2px' }}>
          <div
            onClick={() => fileRef.current.click()}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            style={{
              border: `2px dashed ${preview ? '#c9973a' : '#c9b89a'}`,
              borderRadius: '2px',
              overflow: 'hidden',
              cursor: 'pointer',
              marginBottom: '10px',
              minHeight: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fff',
            }}
          >
            {preview
              ? <img src={preview} alt="" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block' }} />
              : <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a' }}>Click to choose a photo</span>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
          <input value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
            placeholder="Caption (optional)" style={{ ...inputStyle, marginBottom: '8px' }} />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            style={{ ...inputStyle, width: '180px' }} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button onClick={() => { setAdding(false); setPreview(null) }} style={cancelBtnStyle}>Cancel</button>
            <button onClick={save} style={saveBtnStyle}>Add Photo</button>
          </div>
        </div>
      )}

      {(profile.photos || []).length === 0 && !adding && (
        <p style={emptyStyle}>No photos yet. Add one above.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
        {(profile.photos || []).map(p => (
          <div key={p.id} style={{ position: 'relative', background: '#2c1810', border: '1px solid #4a2c1a' }}>
            <img src={p.src} alt={p.caption || ''} style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }} />
            {p.caption && (
              <p style={{ fontFamily: "'Crimson Text', serif", color: '#e8dfc8', fontSize: '0.72rem', padding: '5px 7px', margin: 0 }}>{p.caption}</p>
            )}
            <button onClick={() => remove(p.id)}
              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(44,24,16,0.85)', border: 'none', color: '#9c7a5a', width: 20, height: 20, borderRadius: '50%', cursor: 'pointer', fontSize: '0.75rem', lineHeight: '20px', textAlign: 'center', padding: 0 }}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Places tab ───────────────────────────────────────────────────────────────
function PlacesTab({ profile, onUpdate }) {
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', country: '', state: '', yearFrom: '', yearTo: '', note: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.name.trim()) return
    onUpdate({ ...profile, places: [{ id: uid(), ...form }, ...(profile.places || [])] })
    setForm({ name: '', country: '', state: '', yearFrom: '', yearTo: '', note: '' })
    setAdding(false)
  }

  const remove = (id) => onUpdate({ ...profile, places: profile.places.filter(p => p.id !== id) })

  return (
    <div style={{ padding: '16px' }}>
      {!adding ? (
        <button onClick={() => setAdding(true)} style={addBtnStyle}>+ Add a Place</button>
      ) : (
        <div style={{ background: '#faf7f2', border: '1px solid #d4c4a8', padding: '14px', marginBottom: '14px', borderRadius: '2px' }}>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="Place name (e.g. County Cork, Dublin, Chicago)" style={{ ...inputStyle, marginBottom: '8px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input value={form.country} onChange={e => set('country', e.target.value)} placeholder="Country" style={inputStyle} />
            <input value={form.state} onChange={e => set('state', e.target.value)} placeholder="State / Province" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input value={form.yearFrom} onChange={e => set('yearFrom', e.target.value)} placeholder="From year" type="number" style={inputStyle} />
            <input value={form.yearTo} onChange={e => set('yearTo', e.target.value)} placeholder="To year (or blank)" type="number" style={inputStyle} />
          </div>
          <input value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="Note (e.g. 'Emigrated here in 1922')" style={{ ...inputStyle, marginBottom: '10px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setAdding(false)} style={cancelBtnStyle}>Cancel</button>
            <button onClick={save} style={saveBtnStyle}>Add Place</button>
          </div>
        </div>
      )}

      {(profile.places || []).length === 0 && !adding && (
        <p style={emptyStyle}>No places recorded yet.</p>
      )}

      {(profile.places || []).map(p => (
        <div key={p.id} style={entryCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontFamily: "'Special Elite', cursive", color: '#2c1810', fontSize: '0.9rem' }}>{p.name}</span>
              {(p.country || p.state) && (
                <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem', marginLeft: '6px' }}>
                  {[p.state, p.country].filter(Boolean).join(', ')}
                </span>
              )}
              {(p.yearFrom) && (
                <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.78rem', marginTop: '2px' }}>
                  {p.yearFrom}{p.yearTo ? ` – ${p.yearTo}` : ' – present'}
                </div>
              )}
              {p.note && <div style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#6b4c3b', fontSize: '0.78rem', marginTop: '3px' }}>{p.note}</div>}
            </div>
            <button onClick={() => remove(p.id)} style={removeBtnStyle}>Remove</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function PersonProfilePanel({ personId, person, profile = {}, onClose, onUpdate }) {
  const [tab, setTab] = useState('Stories')

  const isUser = personId === 'user'
  const displayName = person.name || (isUser ? 'You' : 'Unknown')
  const years = [person.birthYear, person.deathYear].filter(Boolean).join(' — ')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(10,5,3,0.6)' }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 0, right: 0, bottom: 0,
            width: '100%',
            maxWidth: '440px',
            background: '#f5f0e8',
            boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ background: '#2c1810', padding: '20px 20px 16px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1.4rem', margin: 0, letterSpacing: '0.06em' }}>
                  {displayName}
                </h2>
                {years && <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.85rem', margin: '4px 0 0' }}>{years}</p>}
                {person.birthPlace && <p style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem', margin: '2px 0 0' }}>b. {person.birthPlace}</p>}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9c7a5a', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 12px' }}>×</button>
            </div>
            {person.note && (
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '0.82rem', margin: '10px 0 0', borderTop: '1px solid #4a2c1a', paddingTop: '10px' }}>
                {person.note}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #d4c4a8', flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '11px 8px',
                  background: tab === t ? '#f5f0e8' : '#ede5d5',
                  border: 'none',
                  borderBottom: tab === t ? '2px solid #8b3a2a' : '2px solid transparent',
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '0.95rem',
                  color: tab === t ? '#2c1810' : '#9c7a5a',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  marginBottom: '-2px',
                }}>
                {t}
                {t === 'Stories' && (profile.stories?.length > 0) && (
                  <span style={{ marginLeft: '5px', background: '#8b3a2a', color: '#f5f0e8', borderRadius: '10px', fontSize: '0.65rem', padding: '1px 5px' }}>
                    {profile.stories.length}
                  </span>
                )}
                {t === 'Photos' && (profile.photos?.length > 0) && (
                  <span style={{ marginLeft: '5px', background: '#8b3a2a', color: '#f5f0e8', borderRadius: '10px', fontSize: '0.65rem', padding: '1px 5px' }}>
                    {profile.photos.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {tab === 'Stories' && <StoriesTab profile={profile} onUpdate={onUpdate} />}
            {tab === 'Photos'  && <PhotosTab  profile={profile} onUpdate={onUpdate} />}
            {tab === 'Places'  && <PlacesTab  profile={profile} onUpdate={onUpdate} />}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: '#fff', border: '1px solid #c9b89a',
  borderRadius: '2px', padding: '7px 10px',
  fontFamily: "'Crimson Text', serif", fontSize: '0.92rem', color: '#2c1810', outline: 'none',
}
const textareaStyle = {
  ...inputStyle, width: '100%', resize: 'vertical', display: 'block',
}
const addBtnStyle = {
  display: 'block', width: '100%', padding: '10px',
  background: 'transparent', border: '1px dashed #c9b89a',
  fontFamily: "'Crimson Text', serif", fontSize: '0.95rem',
  color: '#8b3a2a', cursor: 'pointer', borderRadius: '2px', marginBottom: '14px',
}
const saveBtnStyle = {
  flex: 1, background: '#8b3a2a', color: '#f5f0e8', border: 'none',
  padding: '8px', fontFamily: "'Special Elite', cursive",
  fontSize: '0.9rem', letterSpacing: '0.04em', cursor: 'pointer', borderRadius: '2px',
}
const cancelBtnStyle = {
  background: 'transparent', border: '1px solid #c9b89a', color: '#6b4c3b',
  padding: '8px 14px', fontFamily: "'Crimson Text', serif",
  fontSize: '0.9rem', cursor: 'pointer', borderRadius: '2px',
}
const entryCardStyle = {
  background: '#fff', border: '1px solid #d4c4a8',
  padding: '12px 14px', marginBottom: '10px', borderRadius: '2px',
  position: 'relative',
}
const removeBtnStyle = {
  background: 'transparent', border: 'none',
  color: '#c9b89a', fontSize: '0.72rem',
  cursor: 'pointer', fontFamily: "'Crimson Text', serif",
  padding: '0', marginTop: '6px', display: 'block',
}
const metaStyle = {
  fontFamily: "'Crimson Text', serif", color: '#9c7a5a',
  fontSize: '0.75rem', display: 'block', marginTop: '4px',
}
const emptyStyle = {
  fontFamily: "'Crimson Text', serif", fontStyle: 'italic',
  color: '#b0966e', fontSize: '0.9rem', textAlign: 'center', marginTop: '24px',
}
