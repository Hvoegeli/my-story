import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #1a0f0a 0%, #2c1810 60%, #1a0f0a 100%)' }}>

      {/* Decorative top rule */}
      <div style={{ width: '320px', height: '1px', background: 'linear-gradient(90deg, transparent, #c9973a, transparent)', marginBottom: '40px' }} />

      <h1 style={{
        fontFamily: "'Special Elite', cursive",
        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
        color: '#f5f0e8',
        letterSpacing: '0.08em',
        textAlign: 'center',
        marginBottom: '8px',
        textShadow: '0 2px 16px rgba(201,151,58,0.3)',
      }}>
        My Story
      </h1>

      <p style={{
        fontFamily: "'Playfair Display', serif",
        fontStyle: 'italic',
        color: '#c9973a',
        fontSize: '1.25rem',
        marginBottom: '48px',
        letterSpacing: '0.04em',
      }}>
        A lifetime of memories, bound in one place.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/login')}
          style={{
            fontFamily: "'Special Elite', cursive",
            background: '#8b3a2a',
            color: '#f5f0e8',
            border: 'none',
            padding: '14px 32px',
            fontSize: '1.1rem',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: '2px',
            boxShadow: '0 4px 20px rgba(139,58,42,0.4)',
            transition: 'background 0.2s',
          }}
          onMouseOver={e => e.target.style.background = '#a04535'}
          onMouseOut={e => e.target.style.background = '#8b3a2a'}
        >
          Open My Book
        </button>

        <button
          onClick={() => navigate('/login?signup=true')}
          style={{
            fontFamily: "'Crimson Text', serif",
            background: 'transparent',
            color: '#e8dfc8',
            border: '1px solid #6b4c3b',
            padding: '12px 32px',
            fontSize: '1.1rem',
            cursor: 'pointer',
            borderRadius: '2px',
            transition: 'border-color 0.2s',
          }}
          onMouseOver={e => e.target.style.borderColor = '#c9973a'}
          onMouseOut={e => e.target.style.borderColor = '#6b4c3b'}
        >
          Start Your Story — $29
        </button>
      </div>

      {/* Feature list */}
      <div className="grid grid-cols-2 gap-x-12 gap-y-3 mt-16 max-w-md">
        {[
          'Vintage flip-page scrapbook',
          'Instagram & Facebook import',
          'Interactive world travel map',
          'Life timeline & milestones',
          'Lifetime % by country & state',
          'Journal entries & photo notes',
          'Shareable link & PDF export',
          'Invite family collaborators',
        ].map(feat => (
          <div key={feat} className="flex items-center gap-2"
            style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.95rem' }}>
            <span style={{ color: '#c9973a' }}>✦</span> {feat}
          </div>
        ))}
      </div>

      <div style={{ width: '320px', height: '1px', background: 'linear-gradient(90deg, transparent, #c9973a, transparent)', marginTop: '48px' }} />
    </div>
  )
}
