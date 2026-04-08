import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { sampleTravelStats, usStateStats } from '../data/sampleData'

const COLORS = ['#c9973a', '#8b3a2a', '#4a7c9b', '#4a7c5a', '#8b3a7a', '#6b7c3a', '#4a4a7a']

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#2c1810',
        border: '1px solid #4a2c1a',
        padding: '10px 14px',
        fontFamily: "'Crimson Text', serif",
        color: '#e8dfc8',
        fontSize: '0.9rem',
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{payload[0].name}</p>
        <p style={{ margin: '4px 0 0', color: '#c9973a' }}>{payload[0].value}% of life</p>
      </div>
    )
  }
  return null
}

export default function Stats() {
  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '80px', paddingBottom: '60px', paddingInline: '24px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.2rem', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Life Stats
          </h1>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a' }}>
            Where have you spent your life?
          </p>
        </motion.div>

        {/* Country breakdown */}
        <Section title="% of Life by Country">
          <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 260px' }}>
              <PieChart width={260} height={260}>
                <Pie
                  data={sampleTravelStats}
                  dataKey="percentage"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={55}
                  strokeWidth={0}
                >
                  {sampleTravelStats.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              {sampleTravelStats.map((item, i) => (
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

        {/* US State breakdown */}
        <Section title="% of US Life by State">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={usStateStats} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <XAxis
                dataKey="state"
                tick={{ fontFamily: "'Crimson Text', serif", fill: '#9c7a5a', fontSize: 12 }}
                axisLine={{ stroke: '#4a2c1a' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontFamily: "'Crimson Text', serif", fill: '#9c7a5a', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `${v}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="percentage" name="State" radius={[2, 2, 0, 0]}>
                {usStateStats.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Fun facts */}
        <Section title="Fun Facts">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Countries visited', value: '5' },
              { label: 'US states visited', value: '6' },
              { label: 'Total memories logged', value: '6' },
              { label: 'Years documented', value: '8' },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: 'rgba(201,151,58,0.06)',
                border: '1px solid #4a2c1a',
                padding: '20px 16px',
                textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Special Elite', cursive", color: '#c9973a', fontSize: '2.2rem', lineHeight: 1, marginBottom: '6px' }}>
                  {value}
                </div>
                <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.85rem' }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <p style={{ textAlign: 'center', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#4a2c1a', fontSize: '0.85rem', marginTop: '32px' }}>
          Stats are calculated from your logged memories. Add more memories to improve accuracy.
        </p>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginBottom: '48px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid #4a2c1a',
        padding: '28px 24px',
      }}
    >
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
