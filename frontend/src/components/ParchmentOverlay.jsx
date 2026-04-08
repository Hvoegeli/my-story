import { motion, AnimatePresence } from 'framer-motion'

export default function ParchmentOverlay({ title, onClose, children, maxWidth = 540, zIndex = 100 }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex,
          background: 'rgba(10,5,3,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth,
            position: 'relative',
            filter: 'drop-shadow(0 24px 64px rgba(0,0,0,0.8))',
          }}
        >
          {/* Top rolled edge */}
          <div style={{
            height: 28,
            background: 'linear-gradient(180deg, #5a2e0e 0%, #c9973a 45%, #a0722a 100%)',
            borderRadius: '48% 48% 0 0 / 80% 80% 0 0',
            position: 'relative',
            boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
          }}>
            {/* Scroll line details */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'rgba(201,151,58,0.6)' }} />
            <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, height: 1, background: 'rgba(201,151,58,0.3)' }} />
          </div>

          {/* Parchment body */}
          <div style={{
            background: '#f5f0e8',
            borderLeft: '3px solid #c9973a',
            borderRight: '3px solid #c9973a',
            position: 'relative',
          }}>
            {/* Header bar */}
            <div style={{
              background: 'linear-gradient(180deg, #2c1810 0%, #3d1f10 100%)',
              padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '2px solid #c9973a',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#c9973a', fontSize: '1rem' }}>✦</span>
                <span style={{
                  fontFamily: "'Special Elite', cursive",
                  color: '#f5f0e8',
                  fontSize: '1.1rem',
                  letterSpacing: '0.06em',
                }}>
                  {title}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none',
                  color: '#9c7a5a', fontSize: '1.5rem',
                  cursor: 'pointer', lineHeight: 1,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>

            {/* Parchment texture overlay (subtle) */}
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(180,140,80,0.04) 28px, rgba(180,140,80,0.04) 29px)',
            }} />

            {/* Content */}
            <div style={{ position: 'relative', maxHeight: '72vh', overflowY: 'auto', padding: '24px' }}>
              {children}
            </div>
          </div>

          {/* Bottom rolled edge */}
          <div style={{
            height: 28,
            background: 'linear-gradient(0deg, #5a2e0e 0%, #c9973a 45%, #a0722a 100%)',
            borderRadius: '0 0 48% 48% / 0 0 80% 80%',
            boxShadow: '0 -4px 8px rgba(0,0,0,0.4)',
            position: 'relative',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(201,151,58,0.6)' }} />
            <div style={{ position: 'absolute', top: 4, left: 0, right: 0, height: 1, background: 'rgba(201,151,58,0.3)' }} />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
