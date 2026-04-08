import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PersonProfilePanel from '../components/PersonProfilePanel'
import ParchmentOverlay from '../components/ParchmentOverlay'

// ─── Layout constants ─────────────────────────────────────────────────────────
const NW = 130   // node width
const NH = 72    // node height
const HG = 36    // horizontal gap between nodes
const VG = 96    // vertical gap between rows
const PAD = 60   // canvas padding

// ─── Unique ID ────────────────────────────────────────────────────────────────
const uid = () => `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`

// ─── Initial state ────────────────────────────────────────────────────────────
const INIT_PEOPLE = {
  user: { id: 'user', name: '', birthYear: '', deathYear: '', birthPlace: '', note: '', isUser: true },
}
const INIT_RELS = {
  user: { parents: [], children: [], spouses: [], exSpouses: [] },
}

// ─── Layout engine ────────────────────────────────────────────────────────────

function calcGens(rels) {
  const gens = { user: 0 }
  const q = ['user']
  const seen = new Set(['user'])
  while (q.length) {
    const id = q.shift()
    const r = rels[id] || {}
    const g = gens[id]
    for (const p of r.parents  || []) { if (!seen.has(p)) { seen.add(p); gens[p] = g - 1; q.push(p) } }
    for (const c of r.children || []) { if (!seen.has(c)) { seen.add(c); gens[c] = g + 1; q.push(c) } }
    for (const s of r.spouses  || []) { if (!seen.has(s)) { seen.add(s); gens[s] = g;     q.push(s) } }
  }
  return gens
}

// Sort one generation so spouses stay adjacent and nodes anchor near their relatives.
// Gen -1 special case: user's father goes RIGHT of center, mother LEFT of center
// so father's side branches right, mother's side branches left.
function sortRow(ids, g, rels, positions) {
  if (ids.length <= 1) return ids

  let sorted
  if (g === 0) {
    const userSpouses = (rels['user']?.spouses || []).filter(s => ids.includes(s))
    const rest = ids.filter(i => i !== 'user' && !userSpouses.includes(i))
    sorted = ['user', ...userSpouses, ...rest]
  } else if (g === -1) {
    // Parents of user: father right, mother left — keeps lines clean
    const userParents = (rels['user']?.parents || []).filter(id => ids.includes(id))
    const others = ids.filter(i => !userParents.includes(i))
    const father = userParents.find(id => {
      const r = rels[id] || {}
      // Identify father by rel type stored on person or by order added
      return !r._isMother
    })
    const mother = userParents.find(id => id !== father)
    const ordered = []
    if (mother) ordered.push(mother)
    others.filter(o => {
      // mother's ex-spouses go left
      const r = rels[o] || {}
      return r.spouses?.includes(mother) || r.exSpouses?.includes(mother)
    }).forEach(o => ordered.unshift(o))
    if (father) ordered.push(father)
    others.filter(o => {
      const r = rels[o] || {}
      return r.spouses?.includes(father) || r.exSpouses?.includes(father)
    }).forEach(o => ordered.push(o))
    // remaining
    others.filter(o => !ordered.includes(o)).forEach(o => ordered.push(o))
    sorted = ordered.length === ids.length ? ordered : [...ids]
  } else {
    sorted = [...ids].sort((a, b) => {
      const anchor = (id) => {
        const r = rels[id] || {}
        const linked = g < 0 ? r.children : r.parents
        const xs = linked.map(x => positions[x]?.cx).filter(Boolean)
        return xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : 1e9
      }
      return anchor(a) - anchor(b)
    })
  }

  // Pull current spouses immediately adjacent
  const result = [...sorted]
  for (let i = 0; i < result.length; i++) {
    const spouses = (rels[result[i]]?.spouses || []).filter(s => result.includes(s))
    for (const sid of spouses) {
      const si = result.indexOf(sid)
      if (si !== i + 1 && si > i) {
        result.splice(si, 1)
        result.splice(i + 1, 0, sid)
      }
    }
  }
  return result
}

function computeLayout(rels) {
  const gens = calcGens(rels)

  const byGen = {}
  for (const [id, g] of Object.entries(gens)) {
    if (!byGen[g]) byGen[g] = []
    byGen[g].push(id)
  }

  const genNums = Object.keys(byGen).map(Number).sort((a, b) => a - b)
  const minGen  = genNums[0]  ?? 0
  const maxGen  = genNums[genNums.length - 1] ?? 0

  const maxRow  = Math.max(...Object.values(byGen).map(r => r.length), 1)
  const canvasW = Math.max(820, maxRow * (NW + HG) + PAD * 2)
  const canvasH = genNums.length * (NH + VG) + PAD * 2

  const positions = {}

  // Two passes so descendants can anchor on parents and ancestors on children
  for (let pass = 0; pass < 2; pass++) {
    for (const g of genNums) {
      const ordered = sortRow(byGen[g], g, rels, positions)
      const rowW    = ordered.length * (NW + HG) - HG
      const startX  = (canvasW - rowW) / 2
      const rowIdx  = genNums.indexOf(g)
      const y       = PAD + rowIdx * (NH + VG)

      ordered.forEach((id, i) => {
        positions[id] = {
          x:  startX + i * (NW + HG),
          y,
          cx: startX + i * (NW + HG) + NW / 2,
          cy: y + NH / 2,
        }
      })
    }
  }

  return { positions, gens, byGen, genNums, minGen, maxGen, canvasW, canvasH }
}

// ─── Tree backgrounds ─────────────────────────────────────────────────────────

function OakBg({ canvasW, canvasH, ancestorH, descendantH }) {
  const cx = canvasW / 2
  const trunkTop    = ancestorH
  const trunkBottom = canvasH - descendantH
  const trunkH      = trunkBottom - trunkTop
  const crownCy     = ancestorH / 2
  const crownRx     = Math.min(canvasW * 0.42, 360)
  const crownRy     = Math.max(ancestorH * 0.52, 80)
  const rootsTop    = trunkBottom

  return (
    <g opacity="0.7">
      {/* Crown clusters */}
      <ellipse cx={cx}          cy={crownCy}         rx={crownRx}      ry={crownRy}      fill="#1a3d10"/>
      <ellipse cx={cx - crownRx * 0.42} cy={crownCy + crownRy * 0.18} rx={crownRx * 0.52} ry={crownRy * 0.7} fill="#1e4814"/>
      <ellipse cx={cx + crownRx * 0.42} cy={crownCy + crownRy * 0.18} rx={crownRx * 0.52} ry={crownRy * 0.7} fill="#1e4814"/>
      <ellipse cx={cx}          cy={crownCy - crownRy * 0.25} rx={crownRx * 0.62} ry={crownRy * 0.55} fill="#265a1a"/>
      <ellipse cx={cx - crownRx * 0.55} cy={crownCy - crownRy * 0.05} rx={crownRx * 0.38} ry={crownRy * 0.48} fill="#234f18"/>
      <ellipse cx={cx + crownRx * 0.55} cy={crownCy - crownRy * 0.05} rx={crownRx * 0.38} ry={crownRy * 0.48} fill="#234f18"/>
      <ellipse cx={cx}          cy={crownCy - crownRy * 0.38} rx={crownRx * 0.4}  ry={crownRy * 0.36} fill="#2d6920" opacity="0.7"/>

      {/* Trunk */}
      <rect x={cx - 42} y={trunkTop} width={84} height={trunkH} fill="#3d1f06" rx="3"/>
      <line x1={cx - 20} y1={trunkTop + 10} x2={cx - 22} y2={trunkBottom - 10} stroke="#2c1208" strokeWidth="2.5" opacity="0.45"/>
      <line x1={cx + 12} y1={trunkTop + 10} x2={cx + 10} y2={trunkBottom - 10} stroke="#2c1208" strokeWidth="2" opacity="0.35"/>

      {/* Surface roots */}
      <path d={`M ${cx - 30} ${rootsTop + 10} C ${cx - 90} ${rootsTop + 30} ${cx - 180} ${rootsTop + 35} ${cx - 320} ${rootsTop + 45}`}
        stroke="#3d1f06" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <path d={`M ${cx + 30} ${rootsTop + 10} C ${cx + 90} ${rootsTop + 30} ${cx + 180} ${rootsTop + 35} ${cx + 320} ${rootsTop + 45}`}
        stroke="#3d1f06" strokeWidth="12" fill="none" strokeLinecap="round"/>
      <path d={`M ${cx - 20} ${rootsTop + 18} C ${cx - 80} ${rootsTop + 55} ${cx - 200} ${rootsTop + 70} ${cx - 370} ${rootsTop + 88}`}
        stroke="#3d1f06" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d={`M ${cx + 20} ${rootsTop + 18} C ${cx + 80} ${rootsTop + 55} ${cx + 200} ${rootsTop + 70} ${cx + 370} ${rootsTop + 88}`}
        stroke="#3d1f06" strokeWidth="7" fill="none" strokeLinecap="round"/>
      <path d={`M ${cx - 18} ${rootsTop + 26} C ${cx - 60} ${rootsTop + 80} ${cx - 160} ${rootsTop + 110} ${cx - 310} ${rootsTop + 140}`}
        stroke="#3d1f06" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <path d={`M ${cx + 18} ${rootsTop + 26} C ${cx + 60} ${rootsTop + 80} ${cx + 160} ${rootsTop + 110} ${cx + 310} ${rootsTop + 140}`}
        stroke="#3d1f06" strokeWidth="5" fill="none" strokeLinecap="round"/>
    </g>
  )
}

function SequoiaBg({ canvasW, canvasH, ancestorH, descendantH }) {
  const cx = canvasW / 2
  const trunkTop    = ancestorH
  const trunkBottom = canvasH - descendantH
  const crownW      = Math.min(canvasW * 0.28, 240)
  const rootsTop    = trunkBottom

  return (
    <g opacity="0.7">
      {/* Layered triangular crown */}
      {[0, 1, 2, 3].map(i => {
        const w = crownW * (0.55 + i * 0.18)
        const topY = PAD + i * (ancestorH / 5)
        const botY = topY + ancestorH * 0.32
        return (
          <polygon key={i}
            points={`${cx},${topY} ${cx - w},${botY} ${cx + w},${botY}`}
            fill={`hsl(120, 42%, ${17 + i * 3}%)`} opacity="0.92"
          />
        )
      })}
      <polygon points={`${cx},${PAD * 0.6} ${cx - crownW * 0.3},${ancestorH * 0.35} ${cx + crownW * 0.3},${ancestorH * 0.35}`}
        fill="#3d8c2c" opacity="0.45"/>

      {/* Wide trunk */}
      <rect x={cx - 54} y={trunkTop} width={108} height={trunkBottom - trunkTop} fill="#5c2d0e" rx="3"/>
      <line x1={cx - 24} y1={trunkTop + 10} x2={cx - 26} y2={trunkBottom - 10} stroke="#3d1f06" strokeWidth="3" opacity="0.4"/>
      <line x1={cx + 16} y1={trunkTop + 10} x2={cx + 14} y2={trunkBottom - 10} stroke="#3d1f06" strokeWidth="2.5" opacity="0.35"/>

      {/* Shallow wide roots */}
      {[-1, 1].map(dir => [14, 9, 5].map((w, i) => (
        <path key={`${dir}-${i}`}
          d={`M ${cx + dir * 40} ${rootsTop + 8 + i * 10} C ${cx + dir * 120} ${rootsTop + 28 + i * 18} ${cx + dir * 260} ${rootsTop + 38 + i * 24} ${cx + dir * (380 + i * 30)} ${rootsTop + 55 + i * 40}`}
          stroke="#5c2d0e" strokeWidth={w} fill="none" strokeLinecap="round"
        />
      )))}
    </g>
  )
}

// ─── Connection lines ─────────────────────────────────────────────────────────

function Lines({ rels, positions }) {
  const lines = []
  const drawnSpouses = new Set()

  for (const [id, r] of Object.entries(rels)) {
    const from = positions[id]
    if (!from) continue

    // Parent → child arcs
    for (const cid of r.children || []) {
      const to = positions[cid]
      if (!to) continue
      const my = (from.cy + to.cy) / 2
      lines.push(
        <path key={`ch-${id}-${cid}`}
          d={`M ${from.cx} ${from.cy + NH / 2} C ${from.cx} ${my} ${to.cx} ${my} ${to.cx} ${to.cy - NH / 2}`}
          stroke="#c9973a" strokeWidth="1.5" fill="none" opacity="0.5"
        />
      )
    }

    // Current spouse connector — thick gold bar with ♥
    for (const sid of r.spouses || []) {
      const key = [id, sid].sort().join('-')
      if (drawnSpouses.has(key)) continue
      drawnSpouses.add(key)
      const to = positions[sid]
      if (!to) continue
      const midX = (from.cx + to.cx) / 2
      const y    = from.cy
      // Horizontal bar slightly above node center
      const barY = y - NH / 2 - 8
      lines.push(
        <g key={`sp-${key}`}>
          <line x1={from.cx} y1={barY} x2={to.cx} y2={barY}
            stroke="#c9973a" strokeWidth="2" opacity="0.6"/>
          <line x1={from.cx} y1={barY} x2={from.cx} y2={y - NH / 2}
            stroke="#c9973a" strokeWidth="1.5" opacity="0.5"/>
          <line x1={to.cx} y1={barY} x2={to.cx} y2={y - NH / 2}
            stroke="#c9973a" strokeWidth="1.5" opacity="0.5"/>
          <text x={midX} y={barY} textAnchor="middle" dominantBaseline="middle"
            fill="#c9973a" fontSize="11" opacity="0.85">♥</text>
        </g>
      )
    }

    // Ex-spouse connector — gray dashed with ✕
    for (const sid of r.exSpouses || []) {
      const key = `ex-${[id, sid].sort().join('-')}`
      if (drawnSpouses.has(key)) continue
      drawnSpouses.add(key)
      const to = positions[sid]
      if (!to) continue
      const midX = (from.cx + to.cx) / 2
      const barY = from.cy - NH / 2 - 8
      lines.push(
        <g key={key}>
          <line x1={from.cx} y1={barY} x2={to.cx} y2={barY}
            stroke="#6b4c3b" strokeWidth="1.5" opacity="0.4" strokeDasharray="4 3"/>
          <text x={midX} y={barY} textAnchor="middle" dominantBaseline="middle"
            fill="#6b4c3b" fontSize="10" opacity="0.6">✕</text>
        </g>
      )
    }
  }

  return <g>{lines}</g>
}

// ─── Node card ────────────────────────────────────────────────────────────────

function NodeCard({ id, person, pos, isUser, onEdit, onAdd, onProfile }) {
  const [hover, setHover] = useState(false)

  return (
    <foreignObject x={pos.x} y={pos.y} width={NW} height={NH + 30} overflow="visible">
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          width: NW,
          height: NH,
          background: isUser ? '#5a1e12' : '#2c1810',
          border: `1.5px solid ${isUser ? '#c9973a' : '#6b4c3b'}`,
          borderRadius: '3px',
          cursor: 'pointer',
          position: 'relative',
          boxShadow: hover ? '0 4px 20px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.4)',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '8px 10px',
        }}
        onClick={() => onEdit(id, person)}
      >
        <div style={{ fontFamily: "'Special Elite', cursive", color: isUser ? '#f5f0e8' : '#c9973a', fontSize: '0.78rem', letterSpacing: '0.04em', lineHeight: 1.2, marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {person.name || (isUser ? 'You' : '—')}
        </div>
        {(person.birthYear || person.deathYear) && (
          <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.68rem', lineHeight: 1.2 }}>
            {person.birthYear || '?'}{person.deathYear ? ` — ${person.deathYear}` : ''}
          </div>
        )}
        {person.birthPlace && (
          <div style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.63rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {person.birthPlace}
          </div>
        )}
        {person.isAdopted && (
          <div style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.6rem', fontStyle: 'italic' }}>adopted</div>
        )}
        {/* Stories / profile button */}
        <button
          onClick={e => { e.stopPropagation(); onProfile(id) }}
          style={{
            marginTop: '5px', padding: '2px 7px',
            background: 'transparent', border: '1px solid #4a2c1a',
            color: '#c9973a', fontFamily: "'Crimson Text', serif",
            fontSize: '0.6rem', cursor: 'pointer', borderRadius: '2px',
            letterSpacing: '0.04em', alignSelf: 'flex-start',
          }}
        >
          📖 Stories & Photos
        </button>

        {/* Gold + badge — add relative */}
        {hover && (
          <button
            onClick={e => { e.stopPropagation(); onAdd(id) }}
            style={{
              position: 'absolute', top: -10, right: -10,
              width: 24, height: 24, borderRadius: '50%',
              background: '#c9973a', border: '2px solid #f5f0e8',
              color: '#1a0f0a', fontSize: '1.1rem', lineHeight: '20px',
              textAlign: 'center', cursor: 'pointer', fontWeight: 'bold',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
            }}
          >
            +
          </button>
        )}
      </div>
    </foreignObject>
  )
}

// ─── Add relative panel ───────────────────────────────────────────────────────

const REL_OPTIONS = [
  { type: 'father',   label: 'Father',              dir: 'ancestor',   icon: '↑' },
  { type: 'mother',   label: 'Mother',              dir: 'ancestor',   icon: '↑' },
  { type: 'sibling',  label: 'Sibling',             dir: 'same',       icon: '↔' },
  { type: 'spouse',   label: 'Spouse / Partner',    dir: 'same',       icon: '♥' },
  { type: 'child',    label: 'Child',               dir: 'descendant', icon: '↓' },
  { type: 'adoptee',  label: 'Adoptee (Adopted Child)', dir: 'descendant', icon: '↓♡' },
]

function AddRelPanel({ personName, onAdd, onClose }) {
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,5,3,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          onClick={e => e.stopPropagation()}
          style={{ background: '#f5f0e8', width: '100%', maxWidth: '340px', border: '1px solid #c9b89a', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
          <div style={{ background: '#2c1810', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '1rem' }}>
              Add relative to {personName || 'this person'}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9c7a5a', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ padding: '16px' }}>
            {[
              { group: 'Ancestors', items: REL_OPTIONS.filter(r => r.dir === 'ancestor') },
              { group: 'Same Generation', items: REL_OPTIONS.filter(r => r.dir === 'same') },
              { group: 'Descendants', items: REL_OPTIONS.filter(r => r.dir === 'descendant') },
            ].map(({ group, items }) => (
              <div key={group} style={{ marginBottom: '12px' }}>
                <p style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>{group}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                  {items.map(r => (
                    <button key={r.type} onClick={() => onAdd(r.type)}
                      style={{ background: '#2c1810', color: '#e8dfc8', border: '1px solid #4a2c1a', padding: '7px 14px', fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', cursor: 'pointer', borderRadius: '2px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ color: '#c9973a', fontSize: '0.85rem' }}>{r.icon}</span> {r.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Edit / Add person form ───────────────────────────────────────────────────

function PersonForm({ personId, person, isNew, relType, onSave, onDelete, onDivorce, spouseNames, sameGenPeople, onLinkMarried, onClose }) {
  const [form, setForm] = useState({
    name: person?.name || '',
    birthYear: person?.birthYear || '',
    deathYear: person?.deathYear || '',
    birthPlace: person?.birthPlace || '',
    note: person?.note || '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const relLabel = relType ? REL_OPTIONS.find(r => r.type === relType)?.label : null

  return (
    <ParchmentOverlay
      title={isNew ? `Add ${relLabel || 'Person'}` : 'Edit Person'}
      onClose={onClose}
      maxWidth={400}
      zIndex={300}
    >
          <div>
            {[
              ['name', 'Full Name', 'text', 'e.g. Margaret Anne Smith'],
              ['birthYear', 'Birth Year', 'number', 'e.g. 1942'],
              ['deathYear', 'Year of Passing (optional)', 'number', 'e.g. 2018'],
              ['birthPlace', 'Birthplace (optional)', 'text', 'e.g. Dublin, Ireland'],
            ].map(([key, label, type, ph]) => (
              <div key={key} style={{ marginBottom: '11px' }}>
                <label style={{ display: 'block', fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.82rem', marginBottom: '4px' }}>{label}</label>
                <input type={type} placeholder={ph} value={form[key]} onChange={e => set(key, e.target.value)}
                  style={{ width: '100%', background: '#fff', border: '1px solid #c9b89a', borderRadius: '2px', padding: '7px 10px', fontFamily: "'Crimson Text', serif", fontSize: '0.92rem', color: '#2c1810', outline: 'none' }} />
              </div>
            ))}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.82rem', marginBottom: '4px' }}>Notes (optional)</label>
              <textarea rows={2} value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Anything worth remembering about this person…"
                style={{ width: '100%', background: '#fff', border: '1px solid #c9b89a', borderRadius: '2px', padding: '7px 10px', fontFamily: "'Crimson Text', serif", fontSize: '0.92rem', color: '#2c1810', outline: 'none', resize: 'vertical' }} />
            </div>
            {/* Divorce section — only shown when editing someone with a spouse */}
            {!isNew && spouseNames?.length > 0 && (
              <div style={{ background: '#faf7f2', border: '1px solid #d4c4a8', padding: '10px 12px', marginBottom: '14px', borderRadius: '2px' }}>
                <p style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem', margin: '0 0 8px', letterSpacing: '0.03em' }}>
                  Current spouse(s): <strong>{spouseNames.join(', ')}</strong>
                </p>
                {spouseNames.map((name, i) => (
                  <button key={i} onClick={() => onDivorce(i)}
                    style={{ display: 'block', width: '100%', background: 'transparent', border: '1px solid #c9b89a', color: '#8b3a2a', padding: '6px', fontFamily: "'Crimson Text', serif", fontSize: '0.82rem', cursor: 'pointer', borderRadius: '2px', marginBottom: '4px', textAlign: 'left' }}>
                    ✕ Mark divorce from {name}
                  </button>
                ))}
              </div>
            )}

            {/* Link as married — shown when there are same-gen candidates */}
            {sameGenPeople?.length > 0 && (
              <div style={{ background: '#faf7f2', border: '1px solid #d4c4a8', padding: '10px 12px', marginBottom: '14px', borderRadius: '2px' }}>
                <p style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem', margin: '0 0 8px', letterSpacing: '0.03em' }}>
                  Link as married with:
                </p>
                {sameGenPeople.map(({ id, name }) => (
                  <button key={id} onClick={() => { onLinkMarried(id); onClose() }}
                    style={{ display: 'block', width: '100%', background: 'transparent', border: '1px solid #c9b89a', color: '#4a7c3a', padding: '6px', fontFamily: "'Crimson Text', serif", fontSize: '0.82rem', cursor: 'pointer', borderRadius: '2px', marginBottom: '4px', textAlign: 'left' }}>
                    ♥ Link with {name || 'Unknown'}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              {!isNew && personId !== 'user' && (
                <button onClick={() => onDelete(personId)}
                  style={{ background: 'transparent', border: '1px solid #c9b89a', color: '#9c7a5a', padding: '9px 12px', fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', cursor: 'pointer', borderRadius: '2px' }}>
                  Remove
                </button>
              )}
              <button onClick={onClose}
                style={{ background: 'transparent', border: '1px solid #c9b89a', color: '#6b4c3b', padding: '9px 16px', fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', cursor: 'pointer', borderRadius: '2px' }}>
                Cancel
              </button>
              <button onClick={() => { onSave(personId, form, isNew); onClose() }}
                style={{ flex: 1, background: '#8b3a2a', color: '#f5f0e8', border: 'none', padding: '9px', fontFamily: "'Special Elite', cursive", fontSize: '0.95rem', letterSpacing: '0.04em', cursor: 'pointer', borderRadius: '2px' }}>
                {isNew ? 'Add to Tree' : 'Save'}
              </button>
            </div>
          </div>
    </ParchmentOverlay>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TREE_KEY = 'my-story-family-tree'

function loadTree() {
  try {
    const saved = localStorage.getItem(TREE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { people: INIT_PEOPLE, rels: INIT_RELS, profiles: {} }
}

export default function FamilyTree() {
  const init = useMemo(() => loadTree(), [])

  const [treeStyle,    setTreeStyle]    = useState('oak')
  const [people,       setPeople]       = useState(init.people)
  const [rels,         setRels]         = useState(init.rels)
  const [profiles,     setProfiles]     = useState(init.profiles || {})
  const [addPanel,     setAddPanel]     = useState(null)
  const [editPanel,    setEditPanel]    = useState(null)
  const [profilePanel, setProfilePanel] = useState(null)
  const [zoom,         setZoom]         = useState(1.0)

  // Persist tree to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TREE_KEY, JSON.stringify({ people, rels, profiles }))
  }, [people, rels, profiles])

  const layout = useMemo(() => computeLayout(rels), [rels])
  const { positions, genNums, minGen, maxGen, canvasW, canvasH } = layout

  const handleFit = () => {
    const vw = Math.max(window.innerWidth - 48, 300)
    setZoom(Math.min(1, Math.max(0.2, vw / (canvasW || 900))))
  }

  // Heights for the tree background
  const rowHeight = NH + VG
  const ancestorRows = Math.max(0, -minGen)
  const descendantRows = Math.max(0, maxGen)
  const ancestorH  = ancestorRows  * rowHeight + PAD
  const descendantH = descendantRows * rowHeight + PAD
  const Bg = treeStyle === 'oak' ? OakBg : SequoiaBg

  // ── Add a new relative ──────────────────────────────────────────────────────
  const handleAddType = (fromId, relType) => {
    setAddPanel(null)
    const newId   = uid()
    const fromRel = rels[fromId] || { parents: [], children: [], spouses: [] }

    const newPerson = { id: newId, name: '', birthYear: '', deathYear: '', birthPlace: '', note: '', isUser: false }

    // Build new relation entries
    let updatedFrom   = { ...fromRel }
    let updatedNew    = { parents: [], children: [], spouses: [], exSpouses: [] }
    const extra       = {} // extra updates (e.g. updating grandparent's children)

    if (relType === 'father' || relType === 'mother') {
      updatedFrom = { ...updatedFrom, parents: [...updatedFrom.parents, newId] }
      updatedNew  = { ...updatedNew, children: [fromId] }
      // If the other parent already exists, offer to link them (done via UI separately)
    } else if (relType === 'child' || relType === 'adoptee') {
      updatedFrom = { ...updatedFrom, children: [...updatedFrom.children, newId] }
      const isAdopted = relType === 'adoptee'
      newPerson.isAdopted = isAdopted
      // Auto-add current spouse as co-parent
      const spouseId = fromRel.spouses?.[0]
      const parents = spouseId ? [fromId, spouseId] : [fromId]
      updatedNew = { ...updatedNew, parents }
      if (spouseId && rels[spouseId]) {
        extra[spouseId] = {
          ...(rels[spouseId] || {}),
          children: [...(rels[spouseId]?.children || []), newId],
        }
      }
    } else if (relType === 'spouse') {
      updatedFrom = { ...updatedFrom, spouses: [...updatedFrom.spouses, newId] }
      updatedNew  = { ...updatedNew, spouses: [fromId] }
    } else if (relType === 'sibling') {
      const sharedParents = fromRel.parents
      updatedNew = { ...updatedNew, parents: sharedParents }
      sharedParents.forEach(pid => {
        extra[pid] = {
          ...(rels[pid] || { parents: [], children: [], spouses: [], exSpouses: [] }),
          children: [...((rels[pid] || {}).children || []), newId],
        }
      })
    }

    setPeople(p  => ({ ...p, [newId]: newPerson }))
    setRels(r    => ({ ...r, [fromId]: updatedFrom, [newId]: updatedNew, ...extra }))

    // Open edit form for the new person immediately
    setEditPanel({ personId: newId, person: newPerson, isNew: true, relType })
  }

  // ── Save a person's details ────────────────────────────────────────────────
  const handleSave = (personId, form) => {
    setPeople(p => ({ ...p, [personId]: { ...p[personId], ...form } }))
  }

  // ── Divorce: move spouse → exSpouse for both people ───────────────────────
  const handleDivorce = (personId, spouseIndex) => {
    setEditPanel(null)
    setRels(r => {
      const n = { ...r }
      const personRel = { ...(n[personId] || {}), spouses: [...(n[personId]?.spouses || [])], exSpouses: [...(n[personId]?.exSpouses || [])] }
      const spouseId  = personRel.spouses[spouseIndex]
      if (!spouseId) return n

      // Remove from spouses, add to exSpouses for both
      personRel.spouses   = personRel.spouses.filter(s => s !== spouseId)
      personRel.exSpouses = [...personRel.exSpouses, spouseId]

      const spouseRel = { ...(n[spouseId] || {}), spouses: [...(n[spouseId]?.spouses || [])], exSpouses: [...(n[spouseId]?.exSpouses || [])] }
      spouseRel.spouses   = spouseRel.spouses.filter(s => s !== personId)
      spouseRel.exSpouses = [...spouseRel.exSpouses, personId]

      n[personId] = personRel
      n[spouseId] = spouseRel
      return n
    })
  }

  // ── Remove a person ────────────────────────────────────────────────────────
  const handleDelete = (personId) => {
    setEditPanel(null)
    setPeople(p => { const n = { ...p }; delete n[personId]; return n })
    setRels(r => {
      const n = { ...r }
      delete n[personId]
      for (const [id, rel] of Object.entries(n)) {
        n[id] = {
          parents:   (rel.parents   || []).filter(x => x !== personId),
          children:  (rel.children  || []).filter(x => x !== personId),
          spouses:   (rel.spouses   || []).filter(x => x !== personId),
          exSpouses: (rel.exSpouses || []).filter(x => x !== personId),
        }
      }
      return n
    })
  }

  // ── Link two existing people as married ────────────────────────────────────
  const handleLinkMarried = (personId, otherId) => {
    setRels(r => {
      const n = { ...r }
      const aRel = { ...(n[personId] || { parents: [], children: [], spouses: [], exSpouses: [] }) }
      const bRel = { ...(n[otherId]   || { parents: [], children: [], spouses: [], exSpouses: [] }) }
      if (!aRel.spouses.includes(otherId)) aRel.spouses = [...aRel.spouses, otherId]
      if (!bRel.spouses.includes(personId)) bRel.spouses = [...bRel.spouses, personId]
      n[personId] = aRel
      n[otherId]  = bRel
      return n
    })
  }

  // ── Profile updates ────────────────────────────────────────────────────────
  const handleUpdateProfile = (personId, updated) => {
    setProfiles(p => ({ ...p, [personId]: updated }))
  }

  // ── Derive spouse names and same-gen candidates for the edit panel ─────────
  const editSpouseNames = editPanel
    ? (rels[editPanel.personId]?.spouses || []).map(sid => people[sid]?.name || 'Unknown')
    : []

  const editSameGenPeople = useMemo(() => {
    if (!editPanel) return []
    const pid = editPanel.personId
    const myGen = positions[pid] ? Object.entries(positions).find(([id]) => id === pid) : null
    if (!myGen) return []
    // Find everyone at the same generation who isn't already a spouse or ex-spouse or self
    const myGenNum = Object.entries(layout.gens || {}).find(([id]) => id === pid)?.[1]
    if (myGenNum === undefined) return []
    const currentSpouses = new Set([...(rels[pid]?.spouses || []), ...(rels[pid]?.exSpouses || []), pid])
    return Object.entries(layout.gens || {})
      .filter(([id, g]) => g === myGenNum && !currentSpouses.has(id) && people[id]?.name)
      .map(([id]) => ({ id, name: people[id].name }))
  }, [editPanel, layout, rels, people, positions])

  return (
    <div style={{ minHeight: '100vh', background: '#0f0705', paddingTop: '68px' }}>

      {/* Panels */}
      {addPanel && (
        <AddRelPanel
          personName={people[addPanel.personId]?.name}
          onAdd={type => handleAddType(addPanel.personId, type)}
          onClose={() => setAddPanel(null)}
        />
      )}
      {editPanel && (
        <PersonForm
          personId={editPanel.personId}
          person={editPanel.person}
          isNew={editPanel.isNew}
          relType={editPanel.relType}
          spouseNames={editSpouseNames}
          sameGenPeople={editSameGenPeople}
          onSave={handleSave}
          onDelete={handleDelete}
          onDivorce={(i) => handleDivorce(editPanel.personId, i)}
          onLinkMarried={(otherId) => handleLinkMarried(editPanel.personId, otherId)}
          onClose={() => setEditPanel(null)}
        />
      )}
      {profilePanel && people[profilePanel] && (
        <PersonProfilePanel
          personId={profilePanel}
          person={people[profilePanel]}
          profile={profiles[profilePanel] || {}}
          onUpdate={updated => handleUpdateProfile(profilePanel, updated)}
          onClose={() => setProfilePanel(null)}
        />
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', padding: '22px 24px 14px' }}>
        <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2rem', letterSpacing: '0.08em', marginBottom: '6px' }}>
          Family Tree
        </h1>
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#9c7a5a', fontSize: '0.95rem', marginBottom: '18px' }}>
          Crown &amp; branches: ancestors &nbsp;·&nbsp; Trunk: you &nbsp;·&nbsp; Roots: descendants
        </p>

        {/* Tree style toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid #4a2c1a', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
          {[['oak', 'Oak Tree', 'Wide & spreading'], ['sequoia', 'Sequoia', 'Tall & majestic']].map(([id, label, desc]) => (
            <button key={id} onClick={() => setTreeStyle(id)}
              style={{ padding: '8px 22px', background: treeStyle === id ? '#8b3a2a' : 'transparent', border: 'none', cursor: 'pointer', color: treeStyle === id ? '#f5f0e8' : '#9c7a5a', fontFamily: "'Special Elite', cursive", fontSize: '0.9rem', letterSpacing: '0.05em' }}>
              {label}
              <span style={{ display: 'block', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', fontSize: '0.68rem', color: treeStyle === id ? '#f5f0e8cc' : '#6b4c3b', letterSpacing: 0 }}>{desc}</span>
            </button>
          ))}
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
          <button onClick={() => setZoom(z => Math.max(0.2, +(z - 0.15).toFixed(2)))}
            style={{ background: 'transparent', border: '1px solid #4a2c1a', color: '#c9b89a', width: 32, height: 32, fontSize: '1.1rem', cursor: 'pointer', borderRadius: '2px', lineHeight: 1 }}>
            −
          </button>
          <button onClick={handleFit}
            style={{ background: 'transparent', border: '1px solid #4a2c1a', color: '#c9973a', padding: '0 14px', height: 32, fontFamily: "'Crimson Text', serif", fontSize: '0.85rem', cursor: 'pointer', borderRadius: '2px', letterSpacing: '0.04em' }}>
            Fit
          </button>
          <button onClick={() => setZoom(z => Math.min(2, +(z + 0.15).toFixed(2)))}
            style={{ background: 'transparent', border: '1px solid #4a2c1a', color: '#c9b89a', width: 32, height: 32, fontSize: '1.1rem', cursor: 'pointer', borderRadius: '2px', lineHeight: 1 }}>
            +
          </button>
          <span style={{ fontFamily: "'Crimson Text', serif", color: '#6b4c3b', fontSize: '0.8rem', minWidth: '38px' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {[['#2d6920','Ancestors (Crown)'],['#8b3a2a','You (Trunk)'],['#3d1f06','Descendants (Roots)'],['#c9973a','+ Add relative']].map(([color, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.8rem' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Scrollable tree canvas */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', paddingBottom: '48px' }}>
        <motion.svg
          key={treeStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          width={Math.round(canvasW * zoom)}
          height={Math.round(canvasH * zoom)}
          style={{ display: 'block', margin: '0 auto' }}
        >
          {/* Decorative tree background */}
          <Bg canvasW={canvasW} canvasH={canvasH} ancestorH={ancestorH} descendantH={descendantH} />

          {/* Connection lines */}
          <Lines rels={rels} positions={positions} />

          {/* Generation labels */}
          {genNums.map(g => {
            const label =
              g === 0 ? null :
              g === -1 ? 'Parents' :
              g === -2 ? 'Grandparents' :
              g === -3 ? 'Great-Grandparents' :
              g < -3   ? `${Math.abs(g)}× Great-Grandparents` :
              g === 1  ? 'Children' :
              g === 2  ? 'Grandchildren' :
              g === 3  ? 'Great-Grandchildren' :
                         `${g}× Great-Grandchildren`
            if (!label) return null
            const rowIdx = genNums.indexOf(g)
            const y = PAD + rowIdx * (NH + VG) + NH / 2
            return (
              <text key={g} x={12} y={y}
                style={{ fontFamily: "'Crimson Text', serif", fontStyle: 'italic' }}
                fill="#4a2c1a" fontSize="11" dominantBaseline="middle">
                {label}
              </text>
            )
          })}

          {/* Person nodes */}
          {Object.entries(people).map(([id, person]) => {
            const pos = positions[id]
            if (!pos) return null
            return (
              <NodeCard
                key={id}
                id={id}
                person={person}
                pos={pos}
                isUser={id === 'user'}
                onEdit={(pid, p) => setEditPanel({ personId: pid, person: p, isNew: false, relType: null })}
                onAdd={(pid) => setAddPanel({ personId: pid })}
                onProfile={(pid) => setProfilePanel(pid)}
              />
            )
          })}
        </motion.svg>
      </div>

      <p style={{ textAlign: 'center', fontFamily: "'Crimson Text', serif", fontStyle: 'italic', color: '#3a1c0a', fontSize: '0.8rem', paddingBottom: '32px' }}>
        Click any node to edit · Hover a node and click the gold + to add a relative
      </p>
    </div>
  )
}
