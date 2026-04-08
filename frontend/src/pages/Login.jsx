import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function Login() {
  const [params] = useSearchParams()
  const [isSignup, setIsSignup] = useState(params.get('signup') === 'true')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: wire to backend auth
    navigate('/scrapbook')
  }

  const inputStyle = {
    width: '100%',
    background: '#f5f0e8',
    border: '1px solid #c9b89a',
    borderRadius: '2px',
    padding: '10px 14px',
    fontFamily: "'Crimson Text', serif",
    fontSize: '1.05rem',
    color: '#2c1810',
    outline: 'none',
    marginBottom: '12px',
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #1a0f0a 0%, #2c1810 60%, #1a0f0a 100%)' }}>

      <div style={{
        background: '#f5f0e8',
        padding: '48px 40px',
        borderRadius: '2px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 8px 48px rgba(0,0,0,0.5)',
        border: '1px solid #c9b89a',
      }}>
        <h2 style={{ fontFamily: "'Special Elite', cursive", color: '#2c1810', fontSize: '1.8rem', textAlign: 'center', marginBottom: '8px' }}>
          {isSignup ? 'Begin Your Story' : 'Welcome Back'}
        </h2>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#6b4c3b', textAlign: 'center', marginBottom: '28px', fontSize: '1rem' }}>
          {isSignup ? 'Create your account to get started' : 'Open your book'}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              style={inputStyle}
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            style={inputStyle}
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={inputStyle}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            required
          />

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#8b3a2a',
              color: '#f5f0e8',
              border: 'none',
              padding: '12px',
              fontFamily: "'Special Elite', cursive",
              fontSize: '1.1rem',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              borderRadius: '2px',
              marginTop: '4px',
            }}
          >
            {isSignup ? 'Create Account — $29' : 'Sign In'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #c9b89a', marginTop: '24px', paddingTop: '20px' }}>
          <p style={{ fontFamily: "'Crimson Text', serif", textAlign: 'center', color: '#6b4c3b', fontSize: '0.95rem', marginBottom: '12px' }}>
            Or continue with
          </p>
          <div className="flex gap-3">
            {['Facebook', 'Instagram'].map(provider => (
              <button key={provider} style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #c9b89a',
                padding: '9px',
                fontFamily: "'Crimson Text', serif",
                fontSize: '0.95rem',
                color: '#2c1810',
                cursor: 'pointer',
                borderRadius: '2px',
              }}>
                {provider}
              </button>
            ))}
          </div>
        </div>

        <p style={{ fontFamily: "'Crimson Text', serif", textAlign: 'center', color: '#6b4c3b', fontSize: '0.95rem', marginTop: '20px' }}>
          {isSignup ? 'Already have an account? ' : "Don't have an account? "}
          <span
            style={{ color: '#8b3a2a', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? 'Sign in' : 'Start your story'}
          </span>
        </p>
      </div>
    </div>
  )
}
