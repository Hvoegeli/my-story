export default function MemoryCard({ memory, onEdit }) {
  return (
    <div style={{
      background: '#f5f0e8',
      border: '1px solid #d4c4a8',
      padding: '14px',
      marginBottom: '14px',
      boxShadow: '2px 2px 8px rgba(44,24,16,0.1)',
      position: 'relative',
    }}>
      {/* Top row: source badge + edit button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{
          background: memory.source === 'instagram' ? '#833ab4' : memory.source === 'facebook' ? '#1877f2' : '#8b3a2a',
          color: '#fff', fontSize: '0.65rem', padding: '2px 7px', borderRadius: '2px',
          fontFamily: "'Crimson Text', serif", letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {memory.source}
        </span>
        <button
          onClick={() => onEdit?.(memory)}
          style={{
            background: 'transparent', border: '1px solid #c9b89a', color: '#6b4c3b',
            padding: '2px 10px', fontSize: '0.75rem', fontFamily: "'Crimson Text', serif",
            cursor: 'pointer', borderRadius: '2px',
          }}
        >
          Edit
        </button>
      </div>

      {/* Photo */}
      {memory.type === 'photo' && memory.src && (
        <img
          src={memory.src}
          alt={memory.caption || ''}
          style={{ width: '100%', height: '160px', objectFit: 'cover', marginBottom: '10px', border: '3px solid #fff', boxShadow: '0 1px 4px rgba(44,24,16,0.15)' }}
        />
      )}

      {/* Caption / text */}
      {(memory.caption || memory.text) && (
        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: memory.type !== 'photo' ? 'italic' : 'normal',
          color: '#2c1810', fontSize: '0.92rem', marginBottom: '6px', lineHeight: 1.5,
        }}>
          {memory.caption || memory.text}
        </p>
      )}

      {/* Date + location */}
      <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.82rem' }}>
        {memory.date}
        {memory.location?.city ? ` · ${memory.location.city}, ${memory.location.country}` : ''}
        {memory.milestone ? ` · ${memory.milestone}` : ''}
      </span>

      {/* Personal note */}
      {memory.note && (
        <p style={{
          borderTop: '1px dashed #c9b89a', paddingTop: '8px', marginTop: '8px',
          fontFamily: "'Crimson Text', serif", fontStyle: 'italic',
          color: '#6b4c3b', fontSize: '0.88rem', margin: '8px 0 0',
        }}>
          {memory.note}
        </p>
      )}
    </div>
  )
}
