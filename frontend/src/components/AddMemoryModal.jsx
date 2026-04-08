import { useState, useRef } from 'react'
import ParchmentOverlay from './ParchmentOverlay'
import { imageToBase64, loadBirthInfo } from '../utils/storage'
import { ALL_COUNTRIES } from '../data/countries'

const MILESTONES = ['None', 'Graduation', 'Travel', 'Relationship', 'Career', 'Family', 'Achievement']
const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

const TABS = [
  { id: 'photo',   label: 'Photo' },
  { id: 'journal', label: 'Journal Entry' },
  { id: 'post',    label: 'Text Post' },
]

function buildCountryList() {
  const birthInfo = loadBirthInfo()
  const origin = birthInfo?.country
  if (!origin || !ALL_COUNTRIES.includes(origin)) return ALL_COUNTRIES
  return [origin, ...ALL_COUNTRIES.filter(c => c !== origin)]
}

// initialMemory is passed when editing an existing memory
export default function AddMemoryModal({ onClose, onAdd, onSaveEdit, onDelete, initialMemory = null }) {
  const isEditMode = !!initialMemory
  const countries = buildCountryList()

  const [tab, setTab] = useState(
    isEditMode
      ? (initialMemory.type === 'photo' ? 'photo' : initialMemory.type === 'journal' ? 'journal' : 'post')
      : 'photo'
  )
  const [preview, setPreview] = useState(isEditMode ? (initialMemory.src || null) : null)
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  const [form, setForm] = useState({
    caption:         isEditMode ? (initialMemory.caption || '') : '',
    text:            isEditMode ? (initialMemory.text || '') : '',
    date:            isEditMode ? (initialMemory.date || '') : '',
    locationCity:    isEditMode ? (initialMemory.location?.city || '') : '',
    locationState:   isEditMode ? (initialMemory.location?.state || '') : '',
    locationCountry: isEditMode ? (initialMemory.location?.country || countries[0]) : countries[0],
    note:            isEditMode ? (initialMemory.note || '') : '',
    milestone:       isEditMode ? (initialMemory.milestone || 'None') : 'None',
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Resolve image src — convert new file to base64, otherwise keep existing
    let src = null
    if (file) {
      src = await imageToBase64(file)
    } else if (preview && !preview.startsWith('blob:')) {
      src = preview // existing base64 from edit mode
    }

    const memory = {
      id: isEditMode ? initialMemory.id : Date.now(),
      type: tab === 'photo' ? 'photo' : tab === 'journal' ? 'journal' : 'post',
      src,
      caption: form.caption || null,
      text: form.text || null,
      date: form.date || new Date().toISOString().slice(0, 10),
      location: {
        city:    form.locationCity    || null,
        state:   form.locationState   || null,
        country: form.locationCountry || null,
        lat: isEditMode ? (initialMemory.location?.lat || null) : null,
        lng: isEditMode ? (initialMemory.location?.lng || null) : null,
      },
      note:      form.note || null,
      source:    isEditMode ? initialMemory.source : 'manual',
      milestone: form.milestone !== 'None' ? form.milestone : null,
    }

    if (isEditMode) {
      onSaveEdit(memory)
    } else {
      onAdd(memory)
    }
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm('Remove this memory from your story?')) {
      onDelete(initialMemory.id)
      onClose()
    }
  }

  return (
    <ParchmentOverlay
      title={isEditMode ? 'Edit Memory' : 'Add a Memory'}
      onClose={onClose}
      maxWidth={560}
    >
      {/* Type tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #d4c4a8', marginBottom: '20px', marginTop: '-4px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px 8px',
              background: tab === t.id ? '#f5f0e8' : '#ede6d6',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid #8b3a2a' : '2px solid transparent',
              fontFamily: "'Crimson Text', serif",
              fontSize: '1rem',
              color: tab === t.id ? '#2c1810' : '#9c7a5a',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photo tab */}
        {tab === 'photo' && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current.click()}
              style={{
                border: '2px dashed ' + (preview ? '#c9973a' : '#c9b89a'),
                borderRadius: '2px',
                padding: preview ? '0' : '36px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '14px',
                background: preview ? 'transparent' : '#fff',
                overflow: 'hidden',
                position: 'relative',
                minHeight: preview ? 0 : 100,
              }}
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
              ) : (
                <>
                  <div style={{ fontSize: '2rem', color: '#c9b89a', marginBottom: '6px' }}>+</div>
                  <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', margin: 0 }}>Click or drag a photo here</p>
                  <p style={{ fontFamily: "'Crimson Text', serif", color: '#b0966e', margin: '4px 0 0', fontSize: '0.8rem' }}>JPG, PNG, HEIC supported</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
            </div>
            {preview && (
              <button type="button" onClick={() => fileRef.current.click()}
                style={{ ...ghostBtnStyle, marginBottom: '12px', fontSize: '0.8rem' }}>
                Change photo
              </button>
            )}
            <Field label="Caption (optional)">
              <input style={inputStyle} value={form.caption} onChange={e => set('caption', e.target.value)} placeholder="What's in this photo?" />
            </Field>
          </>
        )}

        {/* Journal tab */}
        {tab === 'journal' && (
          <Field label="Journal Entry">
            <textarea style={{ ...inputStyle, height: '130px', resize: 'vertical' }}
              value={form.text} onChange={e => set('text', e.target.value)}
              placeholder="Write about this moment in your life..." required />
          </Field>
        )}

        {/* Post tab */}
        {tab === 'post' && (
          <Field label="Post / Note">
            <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
              value={form.text} onChange={e => set('text', e.target.value)}
              placeholder="What were you thinking or feeling?" required />
          </Field>
        )}

        {/* Date + milestone */}
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

        {/* Location */}
        <Field label="Location">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input style={inputStyle} placeholder="City" value={form.locationCity} onChange={e => set('locationCity', e.target.value)} />
            <select style={inputStyle} value={form.locationCountry} onChange={e => set('locationCountry', e.target.value)}>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select style={inputStyle} value={form.locationState} onChange={e => set('locationState', e.target.value)}>
            <option value="">US State (if applicable)</option>
            {US_STATES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>

        {/* Personal note */}
        <Field label="Personal note (optional)">
          <textarea style={{ ...inputStyle, height: '68px', resize: 'vertical' }}
            value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="What do you want to remember about this moment?" />
        </Field>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          {isEditMode && (
            <button type="button" onClick={handleDelete}
              style={{ ...ghostBtnStyle, color: '#8b3a2a', borderColor: '#c9b89a' }}>
              Delete
            </button>
          )}
          <button type="button" onClick={onClose} style={ghostBtnStyle}>Cancel</button>
          <button type="submit" style={submitBtnStyle}>
            {isEditMode ? 'Save Changes' : 'Add to My Story'}
          </button>
        </div>
      </form>
    </ParchmentOverlay>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '13px' }}>
      <label style={{ display: 'block', fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.85rem', marginBottom: '5px', letterSpacing: '0.03em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', background: '#fff', border: '1px solid #c9b89a', borderRadius: '2px',
  padding: '8px 10px', fontFamily: "'Crimson Text', serif", fontSize: '0.95rem',
  color: '#2c1810', outline: 'none',
}

const submitBtnStyle = {
  flex: 1, background: '#8b3a2a', color: '#f5f0e8', border: 'none',
  padding: '11px', fontFamily: "'Special Elite', cursive", fontSize: '1rem',
  letterSpacing: '0.05em', cursor: 'pointer', borderRadius: '2px',
}

const ghostBtnStyle = {
  background: 'transparent', color: '#6b4c3b', border: '1px solid #c9b89a',
  padding: '11px 16px', fontFamily: "'Crimson Text', serif", fontSize: '1rem',
  cursor: 'pointer', borderRadius: '2px',
}
