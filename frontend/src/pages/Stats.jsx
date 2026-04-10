import { useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { loadBirthInfo, loadMemoriesFromStorage } from '../utils/storage'
import { normalizeCountry, parseDateString } from '../utils/dates'

const COLORS = ['#c9973a', '#8b3a2a', '#4a7c9b', '#4a7c5a', '#8b3a7a', '#6b7c3a', '#4a4a7a', '#9b5a2a', '#3a7a8b']

function computeStats() {
  const birthInfo   = loadBirthInfo()
  const { memories } = loadMemoriesFromStorage()
  const allMemories  = memories || []

  // Year span — use parseDateString for MMDDYYYY/MMYYYY support
  const birthYear   = birthInfo?.birthDate ? new Date(parseDateString(birthInfo.birthDate) ?? birthInfo.birthDate).getFullYear() : null
  const currentYear = new Date().getFullYear()
  const allYears    = allMemories.map(m => { const ts = parseDateString(m.date); return ts ? new Date(ts).getFullYear() : null }).filter(Boolean)
  const earliestYear = birthYear ?? (allYears.length ? Math.min(...allYears) : currentYear - 1)
  const totalYears   = Math.max(1, currentYear - earliestYear)

  // Country counts — normalize names so USA/United States merge
  const countryCounts = {}
  const birthCountry  = birthInfo?.country ? normalizeCountry(birthInfo.country) : null

  // Seed birth country at 1 so it always appears
  if (birthCountry) countryCounts[birthCountry] = 1

  for (const m of allMemories) {
    if (!m.location?.country) continue
    const c = normalizeCountry(m.location.country)
    countryCounts[c] = (countryCounts[c] || 0) + 1
  }

  const countryTotal = Object.values(countryCounts).reduce((s, v) => s + v, 0) || 1
  const countryStats = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, percentage: Math.round((count / countryTotal) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)

  // State counts — seed birth state at 1
  const stateCounts   = {}
  const birthStateNorm = birthInfo?.state && birthCountry === 'United States' ? birthInfo.state : null
  if (birthStateNorm) stateCounts[birthStateNorm] = 1

  for (const m of allMemories) {
    if (!m.location?.state) continue
    if (normalizeCountry(m.location.country) !== 'United States') continue
    stateCounts[m.location.state] = (stateCounts[m.location.state] || 0) + 1
  }

  const stateTotal = Object.values(stateCounts).reduce((s, v) => s + v, 0) || 1
  const stateStats = Object.entries(stateCounts)
    .map(([state, count]) => ({ state, percentage: Math.round((count / stateTotal) * 100) }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 12)

  const uniqueCountries = countryStats.length
  const uniqueStates    = Object.keys(stateCounts).length
  const yearsDocumented = new Set(allYears).size
  const bornIn          = birthStateNorm
    ? (birthInfo.city ? `${birthInfo.city}, ${birthStateNorm}` : birthStateNorm)
    : (birthCountry ?? null)

  return { countryStats, stateStats, uniqueCountries, uniqueStates, totalMemories: allMemories.length, yearsDocumented, totalYears, birthYear, bornIn }
}

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#2c1810', border: '1px solid #4a2c1a', padding: '10px 14px', fontFamily: "'Crimson Text', serif", color: '#e8dfc8', fontSize: '0.9rem' }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
        <p style={{ margin: '4px 0 0', color: '#c9973a' }}>{payload[0].value}% of entries</p>
      </div>
    )
  }
  return null
}

export default function Stats() {
  const stats = useMemo(computeStats, [])
  const { countryStats, stateStats, uniqueCountries, uniqueStates, totalMemories, yearsDocumented, totalYears, birthYear, bornIn } = stats

  const noData = totalMemories === 0 && !loadBirthInfo()

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '80px', paddingBottom: '60px', paddingInline: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Life Stats
          </h1>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a' }}>
            Where have you spent your life?
          </p>
          {birthYear && (
            <p style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.85rem', marginTop: '4px' }}>
              Documented life span: {birthYear} – {new Date().getFullYear()} ({totalYears} years)
            </p>
          )}
        </motion.div>

        {noData ? (
          <div style={{ textAlign: 'center', color: '#4a2c1a', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', padding: '60px 0' }}>
            Add memories or set up your birth info to see your life stats.
          </div>
        ) : (
          <>
            {/* Country breakdown */}
            {countryStats.length > 0 && (
              <Section title="% of Memories by Country">
                <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 240px' }}>
                    <PieChart width={240} height={240}>
                      <Pie data={countryStats} dataKey="percentage" nameKey="country" cx="50%" cy="50%" outerRadius={100} innerRadius={50} strokeWidth={0}>
                        {countryStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </div>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    {countryStats.map((item, i) => (
                      <div key={item.country} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontFamily: "'Crimson Text', serif", color: '#e8dfc8', fontSize: '0.95rem' }}>{item.country}</span>
                            <span style={{ fontFamily: "'Crimson Text', serif", color: '#c9973a', fontSize: '0.95rem' }}>{item.percentage}%</span>
                          </div>
                          <div style={{ height: '4px', background: '#2c1810', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${item.percentage}%`, background: COLORS[i % COLORS.length], borderRadius: '2px' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Section>
            )}

            {/* US State breakdown */}
            {stateStats.length > 0 && (
              <Section title="% of US Memories by State">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stateStats} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                    <XAxis dataKey="state" tick={{ fontFamily: "'Crimson Text', serif", fill: '#9c7a5a', fontSize: 11 }} axisLine={{ stroke: '#4a2c1a' }} tickLine={false} />
                    <YAxis tick={{ fontFamily: "'Crimson Text', serif", fill: '#9c7a5a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="percentage" name="State" radius={[2, 2, 0, 0]}>
                      {stateStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Fun facts */}
            <Section title="Fun Facts">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Countries in your story', value: uniqueCountries || '—' },
                  { label: 'US states visited',        value: uniqueStates || '—' },
                  { label: 'Memories logged',           value: totalMemories },
                  { label: 'Years documented',          value: yearsDocumented || '—' },
                  { label: 'Years of life',             value: totalYears },
                  ...(bornIn ? [{ label: 'Born in', value: bornIn }] : []),
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(201,151,58,0.06)', border: '1px solid #4a2c1a', padding: '20px 16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '2rem', lineHeight: 1, marginBottom: '6px' }}>
                      {value}
                    </div>
                    <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.85rem' }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}

        <p style={{ textAlign: 'center', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#4a2c1a', fontSize: '0.85rem', marginTop: '32px' }}>
          Stats are based on your logged memories. Add more memories to improve accuracy.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ marginBottom: '48px', background: 'rgba(255,255,255,0.02)', border: '1px solid #4a2c1a', padding: '28px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <span style={{ color: '#c9973a', fontSize: '0.9rem' }}>✦</span>
        <h2 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1.1rem', letterSpacing: '0.06em', margin: 0 }}>
          {title}
        </h2>
        <div style={{ flex: 1, height: '1px', background: '#4a2c1a' }} />
      </div>
      {children}
    </motion.div>
  )
}
