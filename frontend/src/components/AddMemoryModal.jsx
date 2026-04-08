import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const MILESTONES = ['None', 'Graduation', 'Travel', 'Relationship', 'Career', 'Family', 'Achievement']
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming'
]

const TABS = [
  { id: 'photo', label: 'Photo' },
  { id: 'journal', label: 'Journal Entry' },
  { id: 'post', label: 'Text Post' },
]

export default function AddMemoryModal({ onClose, onAdd }) {
  const [tab, setTab] = useState('photo')
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const [form, setForm] = useState({
    caption: '',
    text: '',
    date: '',
    locationCity: '',
    locationState: '',
    locationCountry: 'USA',
    note: '',
    milestone: 'None',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const memory = {
      id: Date.now(),
      type: tab === 'photo' ? 'photo' : tab === 'journal' ? 'journal' : 'post',
      src: preview || null,
      caption: form.caption || null,
      text: form.text || null,
      date: form.date || new Date().toISOString().slice(0, 10),
      location: {
        city: form.locationCity || null,
        state: form.locationState || null,
        country: form.locationCountry || 'USA',
        lat: null,
        lng: null,
      },
      note: form.note || null,
      source: 'manual',
      milestone: form.milestone !== 'None' ? form.milestone : null,
    }
    onAdd(memory)
    onClose()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(10,5,3,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 32 }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#f5f0e8',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #c9b89a',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div style={{ background: '#2c1810', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1.2rem', letterSpacing: '0.06em' }}>
              Add a Memory
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9c7a5a', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #d4c4a8' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  padding: '12px 8px',
                  background: tab === t.id ? '#f5f0e8' : '#e8dfc8',
                  border: 'none',
                  borderBottom: tab === t.id ? '2px solid #8b3a2a' : '2px solid transparent',
                  fontFamily: "'Crimson Text', serif",
                  fontSize: '1rem',
                  color: tab === t.id ? '#2c1810' : '#9c7a5a',
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>

            {/* Photo tab */}
            {tab === 'photo' && (
              <>
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: '2px dashed ' + (preview ? '#c9973a' : '#c9b89a'),
                    borderRadius: '2px',
                    padding: preview ? '0' : '40px 24px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    background: preview ? 'transparent' : '#fff',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="" style={{ width: '100%', maxHeight: '260px', objectFit: 'cover', display: 'block' }} />
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s',
                      }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0}
                      >
                        <span style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '8px 16px', fontFamily: "'Crimson Text', serif", fontSize: '0.9rem' }}>
                          Click to change photo
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '2.5rem', color: '#c9b89a', marginBottom: '8px' }}>+</div>
                      <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', margin: 0, fontSize: '1rem' }}>
                        Click or drag a photo here
                      </p>
                      <p style={{ fontFamily: "'Crimson Text', serif", color: '#b0966e', margin: '4px 0 0', fontSize: '0.8rem' }}>
                        JPG, PNG, HEIC supported
                      </p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                </div>

                <Field label="Caption (optional)">
                  <input style={inputStyle} value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="What's in this photo?" />
                </Field>
              </>
            )}

            {/* Journal tab */}
            {tab === 'journal' && (
              <Field label="Journal Entry">
                <textarea
                  style={{ ...inputStyle, height: '140px', resize: 'vertical' }}
                  value={form.text}
                  onChange={e => set('text', e.target.value)}
                  placeholder="Write about this moment in your life..."
                  required
                />
              </Field>
            )}

            {/* Post tab */}
            {tab === 'post' && (
              <Field label="Post / Note">
                <textarea
                  style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
                  value={form.text}
                  onChange={e => set('text', e.target.value)}
                  placeholder="What were you thinking or feeling?"
                  required
                />
              </Field>
            )}

            {/* Shared fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Field label="Date">
                <input style={inputStyle} type="date" value={form.date} onChange={e => set('date', e.target.value)} />
              </Field>
              <Field label="Milestone (optional)">
                <select style={inputStyle} value={form.milestone} onChange={e => set('milestone', e.target.value)}>
                  {MILESTONES.map(m => <option key={m}>{m}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Location">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <input style={inputStyle} placeholder="City" value={form.locationCity} onChange={e => set('locationCity', e.target.value)} />
                <input style={inputStyle} placeholder="Country" value={form.locationCountry} onChange={e => set('locationCountry', e.target.value)} />
              </div>
              <select style={inputStyle} value={form.locationState} onChange={e => set('locationState', e.target.value)}>
                <option value="">US State (if applicable)</option>
                {US_STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Personal note (optional)">
              <textarea
                style={{ ...inputStyle, height: '72px', resize: 'vertical' }}
                value={form.note}
                onChange={e => set('note', e.target.value)}
                placeholder="What do you want to remember about this moment?"
              />
            </Field>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" style={submitBtnStyle}>Add to My Story</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.85rem', marginBottom: '5px', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: '#fff',
  border: '1px solid #c9b89a',
  borderRadius: '2px',
  padding: '8px 10px',
  fontFamily: "'Crimson Text', serif",
  fontSize: '0.95rem',
  color: '#2c1810',
  outline: 'none',
}

const submitBtnStyle = {
  flex: 1,
  background: '#8b3a2a',
  color: '#f5f0e8',
  border: 'none',
  padding: '11px',
  fontFamily: "'Special Elite', cursive",
  fontSize: '1rem',
  letterSpacing: '0.05em',
  cursor: 'pointer',
  borderRadius: '2px',
}

const cancelBtnStyle = {
  background: 'transparent',
  color: '#6b4c3b',
  border: '1px solid #c9b89a',
  padding: '11px 20px',
  fontFamily: "'Crimson Text', serif",
  fontSize: '1rem',
  cursor: 'pointer',
  borderRadius: '2px',
}
