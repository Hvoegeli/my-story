import { useState } from 'react'

export default function MemoryCard({ memory, onUpdate }) {
  const [editingNote, setEditingNote] = useState(false)
  const [note, setNote] = useState(memory.note || '')
  const [editingMeta, setEditingMeta] = useState(false)
  const [meta, setMeta] = useState({
    date: memory.date || '',
    city: memory.location?.city || '',
    country: memory.location?.country || '',
  })

  const saveNote = () => {
    setEditingNote(false)
    onUpdate?.({ ...memory, note })
  }

  const saveMeta = () => {
    setEditingMeta(false)
    onUpdate?.({ ...memory, date: meta.date, location: { ...memory.location, city: meta.city, country: meta.country } })
  }

  return (
    <div style={{
      background: '#f5f0e8',
      border: '1px solid #d4c4a8',
      padding: '16px',
      marginBottom: '16px',
      boxShadow: '2px 2px 8px rgba(44,24,16,0.1)',
      position: 'relative',
    }}>
      {/* Source badge */}
      <div style={{
        position: 'absolute', top: '10px', right: '10px',
        background: memory.source === 'instagram' ? '#833ab4' : memory.source === 'facebook' ? '#1877f2' : '#8b3a2a',
        color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '2px',
        fontFamily: "'Crimson Text', serif", letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}>
        {memory.source}
      </div>

      {/* Photo */}
      {memory.type === 'photo' && memory.src && (
        <img
          src={memory.src}
          alt={memory.caption || ''}
          style={{ width: '100%', height: '180px', objectFit: 'cover', marginBottom: '10px', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(44,24,16,0.15)' }}
        />
      )}

      {/* Caption / post text */}
      {(memory.caption || memory.text) && (
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: memory.type === 'post' || memory.type === 'journal' ? 'italic' : 'normal', color: '#2c1810', fontSize: '0.95rem', marginBottom: '8px' }}>
          {memory.caption || memory.text}
        </p>
      )}

      {/* Date & location — editable */}
      {!editingMeta ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.85rem' }}>
            {memory.date} {memory.location?.city ? `· ${memory.location.city}, ${memory.location.country}` : ''}
          </span>
          <button onClick={() => setEditingMeta(true)} style={editBtnStyle}>Edit</button>
        </div>
      ) : (
        <div style={{ marginBottom: '8px' }}>
          <div className="flex gap-2 mb-1">
            <input value={meta.date} onChange={e => setMeta({ ...meta, date: e.target.value })} placeholder="YYYY-MM-DD" style={inlineInputStyle} />
            <input value={meta.city} onChange={e => setMeta({ ...meta, city: e.target.value })} placeholder="City" style={inlineInputStyle} />
            <input value={meta.country} onChange={e => setMeta({ ...meta, country: e.target.value })} placeholder="Country" style={inlineInputStyle} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveMeta} style={{ ...editBtnStyle, background: '#8b3a2a', color: '#f5f0e8' }}>Save</button>
            <button onClick={() => setEditingMeta(false)} style={editBtnStyle}>Cancel</button>
          </div>
        </div>
      )}

      {/* Personal note — editable */}
      {!editingNote ? (
        <div style={{ borderTop: '1px dashed #c9b89a', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#6b4c3b', fontSize: '0.9rem', margin: 0, flex: 1 }}>
            {note || <span style={{ color: '#b0966e' }}>Add a personal note...</span>}
          </p>
          <button onClick={() => setEditingNote(true)} style={editBtnStyle}>
            {note ? 'Edit' : '+ Note'}
          </button>
        </div>
      ) : (
        <div style={{ borderTop: '1px dashed #c9b89a', paddingTop: '8px' }}>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="What do you remember about this moment?"
            style={{ ...inlineInputStyle, width: '100%', resize: 'vertical', marginBottom: '6px' }}
          />
          <div className="flex gap-2">
            <button onClick={saveNote} style={{ ...editBtnStyle, background: '#8b3a2a', color: '#f5f0e8' }}>Save</button>
            <button onClick={() => setEditingNote(false)} style={editBtnStyle}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const editBtnStyle = {
  background: 'transparent',
  border: '1px solid #c9b89a',
  color: '#6b4c3b',
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontFamily: "'Crimson Text', serif",
  cursor: 'pointer',
  borderRadius: '2px',
  whiteSpace: 'nowrap',
}

const inlineInputStyle = {
  background: '#fff',
  border: '1px solid #c9b89a',
  borderRadius: '2px',
  padding: '4px 8px',
  fontFamily: "'Crimson Text', serif",
  fontSize: '0.85rem',
  color: '#2c1810',
  outline: 'none',
}
