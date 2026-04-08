import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ALL_COUNTRIES } from '../data/countries'
import { saveBirthInfo, loadBirthInfo } from '../utils/storage'

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming',
]

// Put origin country first, then alphabetical
function buildCountryList(originCountry) {
  if (!originCountry || !ALL_COUNTRIES.includes(originCountry)) return ALL_COUNTRIES
  return [originCountry, ...ALL_COUNTRIES.filter(c => c !== originCountry)]
}

export default function BirthInfoModal({ onComplete }) {
  const existing = loadBirthInfo()
  const defaultCountry = existing?.country || 'United States'
  const countries = buildCountryList(defaultCountry)

  const [form, setForm] = useState({
    city: existing?.city || '',
    state: existing?.state || '',
    country: defaultCountry,
    birthDate: existing?.birthDate || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    saveBirthInfo(form)
    onComplete(form)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,5,3,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            background: '#f5f0e8',
            width: '100%',
            maxWidth: '460px',
            border: '1px solid #c9b89a',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{ background: '#2c1810', padding: '28px 28px 24px', textAlign: 'center' }}>
            <div style={{ color: '#c9973a', fontSize: '1.8rem', marginBottom: '10px' }}>✦</div>
            <h2 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1.6rem', letterSpacing: '0.08em', margin: 0 }}>
              Where did your story begin?
            </h2>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '0.95rem', marginTop: '8px' }}>
              Tell us where and when you were born so we can anchor your story.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Date of Birth</label>
              <input type="date" style={inputStyle} value={form.birthDate} onChange={e => set('birthDate', e.target.value)} required />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>City of Birth</label>
              <input type="text" style={inputStyle} placeholder="e.g. Austin" value={form.city} onChange={e => set('city', e.target.value)} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Country of Origin</label>
                <select style={inputStyle} value={form.country} onChange={e => set('country', e.target.value)} required>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>US State <span style={{ color: '#b0966e', fontWeight: 'normal' }}>(if USA)</span></label>
                <select style={inputStyle} value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">— Select —</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#faf7f2', border: '1px dashed #c9b89a', padding: '12px 14px', marginBottom: '20px' }}>
              <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.82rem', margin: 0, fontStyle: 'italic' }}>
                This anchors the beginning of your story map and life stats. You can update it later in your profile.
              </p>
            </div>

            <button type="submit" style={{
              width: '100%', background: '#8b3a2a', color: '#f5f0e8', border: 'none',
              padding: '14px', fontFamily: "'Special Elite', cursive", fontSize: '1.1rem',
              letterSpacing: '0.08em', cursor: 'pointer', borderRadius: '2px',
              boxShadow: '0 4px 16px rgba(139,58,42,0.3)',
            }}>
              Begin My Story
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const labelStyle = {
  display: 'block', fontFamily: "'Crimson Text', serif", color: '#6b4c3b',
  fontSize: '0.85rem', marginBottom: '5px', letterSpacing: '0.03em',
}

const inputStyle = {
  width: '100%', background: '#fff', border: '1px solid #c9b89a', borderRadius: '2px',
  padding: '9px 11px', fontFamily: "'Crimson Text', serif", fontSize: '0.95rem',
  color: '#2c1810', outline: 'none',
}
