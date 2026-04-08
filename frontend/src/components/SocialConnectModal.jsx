import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// In production these would be real OAuth redirect URLs from your backend
const OAUTH_URLS = {
  facebook: '/api/social/auth/facebook',
  instagram: '/api/social/auth/instagram',
}

const PLATFORM_CONFIG = {
  facebook: {
    name: 'Facebook',
    color: '#1877f2',
    description: 'Pull your photos and posts from Facebook, including dates and location check-ins.',
    pulls: ['Photos & albums', 'Posts & status updates', 'Check-in locations', 'Life events'],
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#1877f2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  instagram: {
    name: 'Instagram',
    color: '#833ab4',
    description: 'Pull your photos and captions from Instagram, including location tags.',
    pulls: ['Photos & carousels', 'Captions', 'Location tags', 'Post dates'],
    icon: (
      <svg viewBox="0 0 24 24" width="28" height="28" fill="#833ab4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
  },
}

function PlatformPanel({ platform, connected, onConnect, onDisconnect, importing, importCount }) {
  const cfg = PLATFORM_CONFIG[platform]
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div style={{
      border: '1px solid ' + (connected ? cfg.color : '#d4c4a8'),
      borderRadius: '2px',
      overflow: 'hidden',
      marginBottom: '16px',
    }}>
      {/* Platform header */}
      <div style={{
        background: connected ? cfg.color + '18' : '#fff',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        {cfg.icon}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: "'Special Elite', cursive", color: '#2c1810', fontSize: '1.05rem' }}>{cfg.name}</span>
            {connected && (
              <span style={{
                background: '#2d7a2d', color: '#fff',
                fontSize: '0.65rem', padding: '2px 7px', borderRadius: '10px',
                fontFamily: "'Crimson Text', serif", letterSpacing: '0.04em',
              }}>
                Connected
              </span>
            )}
          </div>
          <p style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.85rem', margin: '3px 0 0' }}>
            {cfg.description}
          </p>
        </div>
      </div>

      {/* What will be pulled */}
      <div style={{ background: '#faf7f2', padding: '12px 20px', borderTop: '1px solid #e8dfc8' }}>
        <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.8rem', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          What we pull
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {cfg.pulls.map(item => (
            <span key={item} style={{
              background: '#f5f0e8', border: '1px solid #d4c4a8',
              color: '#6b4c3b', fontSize: '0.78rem', padding: '3px 9px',
              fontFamily: "'Crimson Text', serif", borderRadius: '2px',
            }}>
              ✓ {item}
            </span>
          ))}
        </div>
        <p style={{ fontFamily: "'Crimson Text', serif", color: '#b0966e', fontSize: '0.75rem', margin: '10px 0 0', fontStyle: 'italic' }}>
          We never post, like, follow, or access private messages. Read-only access only.
        </p>
      </div>

      {/* Action area */}
      <div style={{ background: '#fff', padding: '14px 20px', borderTop: '1px solid #e8dfc8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        {connected ? (
          <>
            <div>
              {importing ? (
                <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.9rem', fontStyle: 'italic' }}>
                  Importing memories...
                </span>
              ) : importCount ? (
                <span style={{ fontFamily: "'Crimson Text', serif", color: '#2d7a2d', fontSize: '0.9rem' }}>
                  ✓ {importCount} memories imported
                </span>
              ) : (
                <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.9rem' }}>
                  Ready to import
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onConnect} disabled={importing} style={{
                background: cfg.color, color: '#fff', border: 'none',
                padding: '8px 16px', fontFamily: "'Crimson Text', serif", fontSize: '0.9rem',
                cursor: importing ? 'wait' : 'pointer', borderRadius: '2px', opacity: importing ? 0.7 : 1,
              }}>
                {importing ? 'Importing...' : 'Sync Now'}
              </button>
              {!showConfirm ? (
                <button onClick={() => setShowConfirm(true)} style={{
                  background: 'transparent', color: '#9c7a5a', border: '1px solid #d4c4a8',
                  padding: '8px 12px', fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', cursor: 'pointer', borderRadius: '2px',
                }}>
                  Disconnect
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Crimson Text', serif", color: '#8b3a2a', fontSize: '0.8rem' }}>Sure?</span>
                  <button onClick={() => { onDisconnect(); setShowConfirm(false) }} style={{ background: '#8b3a2a', color: '#fff', border: 'none', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Crimson Text', serif" }}>Yes</button>
                  <button onClick={() => setShowConfirm(false)} style={{ background: 'transparent', border: '1px solid #d4c4a8', color: '#6b4c3b', padding: '5px 10px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '2px', fontFamily: "'Crimson Text', serif" }}>No</button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => onConnect(platform)}
            style={{
              background: cfg.color, color: '#fff', border: 'none',
              padding: '10px 22px', fontFamily: "'Special Elite', cursive",
              fontSize: '0.95rem', letterSpacing: '0.04em',
              cursor: 'pointer', borderRadius: '2px',
              boxShadow: `0 2px 12px ${cfg.color}44`,
            }}
          >
            Connect {cfg.name}
          </button>
        )}
      </div>
    </div>
  )
}

export default function SocialConnectModal({ onClose, onImport }) {
  const [connected, setConnected] = useState({ facebook: false, instagram: false })
  const [importing, setImporting] = useState({ facebook: false, instagram: false })
  const [importCount, setImportCount] = useState({ facebook: 0, instagram: 0 })

  const handleConnect = (platform) => {
    // In production: redirect to OAuth URL
    // For now: simulate connection + import
    setConnected(c => ({ ...c, [platform]: true }))
    handleSync(platform)
  }

  const handleSync = (platform) => {
    setImporting(i => ({ ...i, [platform]: true }))
    // Simulate an import delay (replace with real API call)
    setTimeout(() => {
      setImporting(i => ({ ...i, [platform]: false }))
      const count = platform === 'facebook' ? 12 : 8
      setImportCount(c => ({ ...c, [platform]: count }))
      // Notify parent with placeholder imported memories
      onImport?.(generateFakeImport(platform, count))
    }, 2200)
  }

  const handleDisconnect = (platform) => {
    setConnected(c => ({ ...c, [platform]: false }))
    setImportCount(c => ({ ...c, [platform]: 0 }))
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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            border: '1px solid #c9b89a',
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div style={{ background: '#2c1810', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1.2rem', letterSpacing: '0.06em' }}>
                Connect Social Media
              </span>
              <p style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '0.85rem', margin: '3px 0 0' }}>
                Import your photos and posts into your scrapbook
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9c7a5a', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: '20px' }}>
            <PlatformPanel
              platform="facebook"
              connected={connected.facebook}
              importing={importing.facebook}
              importCount={importCount.facebook}
              onConnect={() => handleConnect('facebook')}
              onDisconnect={() => handleDisconnect('facebook')}
            />
            <PlatformPanel
              platform="instagram"
              connected={connected.instagram}
              importing={importing.instagram}
              importCount={importCount.instagram}
              onConnect={() => handleConnect('instagram')}
              onDisconnect={() => handleDisconnect('instagram')}
            />

            <p style={{ fontFamily: "'Crimson Text', serif", color: '#b0966e', fontSize: '0.8rem', textAlign: 'center', fontStyle: 'italic', marginTop: '4px' }}>
              Connecting requires a one-time login with Meta. Your credentials are never stored by My Story.
            </p>

            <button
              onClick={onClose}
              style={{
                display: 'block', width: '100%', marginTop: '16px',
                background: 'transparent', border: '1px solid #c9b89a',
                padding: '10px', fontFamily: "'Crimson Text', serif",
                color: '#6b4c3b', fontSize: '1rem', cursor: 'pointer', borderRadius: '2px',
              }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Placeholder imported memories to show UI working end-to-end
function generateFakeImport(platform, count) {
  const photos = [
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400',
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400',
  ]
  return Array.from({ length: Math.min(count, 4) }, (_, i) => ({
    id: Date.now() + i,
    type: 'photo',
    src: photos[i % photos.length],
    caption: `${platform === 'facebook' ? 'Facebook' : 'Instagram'} memory`,
    date: `${2020 + Math.floor(Math.random() * 4)}-0${1 + (i % 9)}-${10 + i}`,
    location: { country: 'USA', state: null, city: null, lat: null, lng: null },
    note: null,
    source: platform,
    milestone: null,
  }))
}
