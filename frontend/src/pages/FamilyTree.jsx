import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import PersonProfilePanel from '../components/PersonProfilePanel'
import ParchmentOverlay from '../components/ParchmentOverlay'

// ── Constants ─────────────────────────────────────────────────────────────────
const USER_R   = 68    // user center radius
const R_STEP   = 150   // ring height per generation
const FAN_L    = Math.PI * 0.02
const FAN_R    = Math.PI * 0.98
const TREE_KEY = 'my-story-family-tree'
const TREE_VER = 'voegeli-v3'
const uid      = () => `p${Date.now()}${Math.random().toString(36).slice(2,6)}`

// Slice fill [0=paternal branch, 1=maternal branch] by generation depth index
const BASE_FILL = [
  ['#3e1c08','#301408'], ['#2b1305','#220f06'],
  ['#1e0d04','#180b04'], ['#150903','#110703'], ['#0e0602','#0b0502'],
]
const HOV_FILL = [
  ['#724020','#5c3218'], ['#502a14','#3e2010'],
  ['#3a1e0c','#2e160a'], ['#2a1608','#201006'], ['#1e1006','#180c06'],
]
const GENDER_COL = { m:'#3a6090', f:'#904060', u:'#605040' }

// ── Voegeli seed data ─────────────────────────────────────────────────────────
const VOEGELI_PEOPLE = {
  user:        {id:'user',        name:'Harrison Voegeli',         gender:'m', birthYear:'1989', deathYear:'',    birthPlace:'Northampton, MS',                note:'',isUser:true},
  dad:         {id:'dad',         name:'Nicholas Voegeli',          gender:'m', birthYear:'',    deathYear:'',    birthPlace:'',                               note:''},
  mom:         {id:'mom',         name:'Ana Maria Tolentino',       gender:'f', birthYear:'',    deathYear:'',    birthPlace:'',                               note:''},
  mgf:         {id:'mgf',         name:'Mario Tolentino',           gender:'m', birthYear:'',    deathYear:'',    birthPlace:'',                               note:''},
  mgm:         {id:'mgm',         name:'Mary Finn',                 gender:'f', birthYear:'',    deathYear:'',    birthPlace:'',                               note:''},
  pgf:         {id:'pgf',         name:'Kenneth Henry Voegeli',     gender:'m', birthYear:'1939',deathYear:'',    birthPlace:'Milwaukee, WI',                  note:'Born 09/03/1939'},
  pgm:         {id:'pgm',         name:'Sue Harrison',              gender:'f', birthYear:'',    deathYear:'',    birthPlace:'',                               note:''},
  doris:       {id:'doris',       name:'Doris Ann Voegeli',         gender:'f', birthYear:'1938',deathYear:'',    birthPlace:'Milwaukee, WI',                  note:'Married Michael Senglaub 1958. Children: Jill, Joseph, Julia, Jeffrey, James.'},
  janet:       {id:'janet',       name:'Janet Theresa Voegeli',     gender:'f', birthYear:'1944',deathYear:'',    birthPlace:'Milwaukee, WI',                  note:''},
  mark_v:      {id:'mark_v',      name:'Mark Wendelin Voegeli',     gender:'m', birthYear:'1947',deathYear:'',    birthPlace:'Milwaukee, WI',                  note:'Married Marsha Eichoff. Children: Mark and Matthew.'},
  ggf:         {id:'ggf',         name:'Wendelin Leo Voegeli',      gender:'m', birthYear:'1914',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Born 04/17/1914. Married Cecilia Rose Bogacz 11/18/1936.'},
  ggm:         {id:'ggm',         name:'Cecilia Rose Bogacz',       gender:'f', birthYear:'1918',deathYear:'',    birthPlace:'Omaha, NE',                      note:'Born 07/07/1918'},
  agnes:       {id:'agnes',       name:'Agnes Catherine Voegeli',   gender:'f', birthYear:'1909',deathYear:'2009',birthPlace:'Colwich, KS',                    note:''},
  leo_v:       {id:'leo_v',       name:'Leo Adam Voegeli',          gender:'m', birthYear:'',    deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Marie Meyer. Children: Janice, Judith, Romald, Robert, Richard, Mary Ann, Randall.'},
  josephine:   {id:'josephine',   name:'Josephine C. Voegeli',      gender:'f', birthYear:'1915',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Aloysius Schauf. Children: Frederick, Martha, William, Jerome, Donald, Cetus, Joseph, Paul.'},
  maryann_v:   {id:'maryann_v',   name:'Mary Ann Voegeli',          gender:'f', birthYear:'1917',deathYear:'',    birthPlace:'Colwich, KS',                    note:''},
  dorothy_v:   {id:'dorothy_v',   name:'Dorothy Marie Voegeli',     gender:'f', birthYear:'1919',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Urban Eck. Children: John, Joan, Dennis, Carl, Gregory, Theresa, Doris, Urban, Christina.'},
  bernadine:   {id:'bernadine',   name:'Bernadine E. Voegeli',      gender:'f', birthYear:'1921',deathYear:'',    birthPlace:'Colwich, KS',                    note:''},
  john_jr:     {id:'john_jr',     name:'John Voegeli Jr.',           gender:'m', birthYear:'1923',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Elizabeth Palsmeir. Children: Constance, Michael, Mary, Patricia, Kathleen, Daniel, John, Timothy, Thomas, Philip, Margaret.'},
  wilfred:     {id:'wilfred',     name:'Wilfred Voegeli',            gender:'m', birthYear:'1925',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Alice Majerus. Children: James, Lois, George, Mary, Nadine, Theodore, Rose, Rita.'},
  francis_v:   {id:'francis_v',   name:'Francis Voegeli',            gender:'m', birthYear:'1928',deathYear:'',    birthPlace:'Colwich, KS',                    note:'Married Marieda Schmidt. Children: Diane, Charles, Gerard, Kathryn, Stephen, Caroline, Gilbert, Joseph, Elizabeth.'},
  creighton:   {id:'creighton',   name:'Creighton Bogacz',           gender:'m', birthYear:'1906',deathYear:'1963',birthPlace:'Omaha, NE',                      note:'Married Theresa Schlinger. No children.'},
  theodore_b:  {id:'theodore_b',  name:'Theodore Bogacz',            gender:'m', birthYear:'1909',deathYear:'1950',birthPlace:'Omaha, NE',                      note:''},
  elizabeth_b: {id:'elizabeth_b', name:'Elizabeth Bogacz',           gender:'f', birthYear:'1911',deathYear:'1930',birthPlace:'Omaha, NE',                      note:''},
  margaret_b:  {id:'margaret_b',  name:'Margaret Bogacz',            gender:'f', birthYear:'1913',deathYear:'2003',birthPlace:'Omaha, NE',                      note:'Married Adrian Jaworski. Children: Marjorie, Janice, Adrian.'},
  dorothy_b:   {id:'dorothy_b',   name:'Dorothy Bogacz',             gender:'f', birthYear:'1916',deathYear:'1992',birthPlace:'Omaha, NE',                      note:'Married Joseph Hogya. Children: Theodore, Jeremiah, Lawrence, Diane.'},
  bernice_b:   {id:'bernice_b',   name:'Bernice Bogacz',             gender:'f', birthYear:'1921',deathYear:'2000',birthPlace:'Omaha, NE',                      note:'Married Frank Popelka. Children: Sandra, James, Patricia.'},
  catherine_b: {id:'catherine_b', name:'Catherine Bogacz',           gender:'f', birthYear:'1924',deathYear:'',    birthPlace:'Omaha, NE',                      note:'Married Charles Weiss. 11 children.'},
  gggf_v:      {id:'gggf_v',      name:'John Joseph Voegeli Sr.',    gender:'m', birthYear:'1885',deathYear:'',    birthPlace:'St. Marks, KS',                  note:'Born 12/22/1885'},
  gggm_v:      {id:'gggm_v',      name:'Elizabeth K. Spexarth',      gender:'f', birthYear:'1885',deathYear:'',    birthPlace:'St. Marks, KS',                  note:'Born 04/04/1885'},
  gggf_b:      {id:'gggf_b',      name:'George Bogacz',              gender:'m', birthYear:'1881',deathYear:'1940',birthPlace:'Omaha, NE',                      note:''},
  gggm_b:      {id:'gggm_b',      name:'Anna Elizabeth Armatis',     gender:'f', birthYear:'1885',deathYear:'1985',birthPlace:'Omaha, NE',                      note:''},
  ggggf_v:     {id:'ggggf_v',     name:'Joseph Voegeli Sr.',          gender:'m', birthYear:'1847',deathYear:'1903',birthPlace:'Bootzheim, Alsace, Germany',     note:''},
  ggggm_v:     {id:'ggggm_v',     name:'Caroline Schmitt',            gender:'f', birthYear:'1847',deathYear:'1903',birthPlace:'Bootzheim, Alsace, Germany',     note:''},
  ggggf_s:     {id:'ggggf_s',     name:'Adam Spexarth',               gender:'m', birthYear:'1847',deathYear:'1936',birthPlace:'Westphalia, Germany',            note:''},
  ggggm_s:     {id:'ggggm_s',     name:'Katherine Holtkamp',          gender:'f', birthYear:'1858',deathYear:'1940',birthPlace:'St. Paul, Iowa',                 note:''},
  ggggf_bg:    {id:'ggggf_bg',    name:'George Bogacz Sr.',           gender:'m', birthYear:'1849',deathYear:'',    birthPlace:'Galicia, Poland',                note:''},
  ggggm_bg:    {id:'ggggm_bg',    name:'Sophie Sroka',                gender:'f', birthYear:'1860',deathYear:'1951',birthPlace:'Galicia, Poland',                note:''},
  ggggf_a:     {id:'ggggf_a',     name:'Jacob Armatis',               gender:'m', birthYear:'1850',deathYear:'1913',birthPlace:'Austria',                       note:''},
  ggggm_a:     {id:'ggggm_a',     name:'Sophia Cich',                 gender:'f', birthYear:'1854',deathYear:'1928',birthPlace:'Austria',                       note:''},
}

const VOEGELI_RELS = {
  user:        {parents:['dad','mom'],           children:[],                                                                                                                spouses:[],          exSpouses:[]},
  dad:         {parents:['pgf','pgm'],            children:['user'],                                                                                                          spouses:['mom'],     exSpouses:[]},
  mom:         {parents:['mgf','mgm'],           children:['user'],                                                                                                          spouses:['dad'],     exSpouses:[]},
  mgf:         {parents:[],                      children:['mom'],                                                                                                           spouses:['mgm'],     exSpouses:[]},
  mgm:         {parents:[],                      children:['mom'],                                                                                                           spouses:['mgf'],     exSpouses:[]},
  pgf:         {parents:['ggf','ggm'],           children:['dad'],                                                                                                           spouses:['pgm'],     exSpouses:[]},
  pgm:         {parents:[],                      children:['dad'],                                                                                                           spouses:['pgf'],     exSpouses:[]},
  doris:       {parents:['ggf','ggm'],           children:[],                                                                                                                spouses:[],          exSpouses:[]},
  janet:       {parents:['ggf','ggm'],           children:[],                                                                                                                spouses:[],          exSpouses:[]},
  mark_v:      {parents:['ggf','ggm'],           children:[],                                                                                                                spouses:[],          exSpouses:[]},
  ggf:         {parents:['gggf_v','gggm_v'],    children:['pgf','doris','janet','mark_v'],                                                                                  spouses:['ggm'],     exSpouses:[]},
  ggm:         {parents:['gggf_b','gggm_b'],    children:['pgf','doris','janet','mark_v'],                                                                                  spouses:['ggf'],     exSpouses:[]},
  agnes:       {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  leo_v:       {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  josephine:   {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  maryann_v:   {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  dorothy_v:   {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  bernadine:   {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  john_jr:     {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  wilfred:     {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  francis_v:   {parents:['gggf_v','gggm_v'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  creighton:   {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  theodore_b:  {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  elizabeth_b: {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  margaret_b:  {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  dorothy_b:   {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  bernice_b:   {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  catherine_b: {parents:['gggf_b','gggm_b'],    children:[],                                                                                                                spouses:[],          exSpouses:[]},
  gggf_v:      {parents:['ggggf_v','ggggm_v'],  children:['ggf','agnes','leo_v','josephine','maryann_v','dorothy_v','bernadine','john_jr','wilfred','francis_v'],            spouses:['gggm_v'],  exSpouses:[]},
  gggm_v:      {parents:['ggggf_s','ggggm_s'],  children:['ggf','agnes','leo_v','josephine','maryann_v','dorothy_v','bernadine','john_jr','wilfred','francis_v'],            spouses:['gggf_v'],  exSpouses:[]},
  gggf_b:      {parents:['ggggf_bg','ggggm_bg'],children:['ggm','creighton','theodore_b','elizabeth_b','margaret_b','dorothy_b','bernice_b','catherine_b'],                  spouses:['gggm_b'],  exSpouses:[]},
  gggm_b:      {parents:['ggggf_a','ggggm_a'],  children:['ggm','creighton','theodore_b','elizabeth_b','margaret_b','dorothy_b','bernice_b','catherine_b'],                  spouses:['gggf_b'],  exSpouses:[]},
  ggggf_v:     {parents:[],                      children:['gggf_v'],                                                                                                        spouses:['ggggm_v'], exSpouses:[]},
  ggggm_v:     {parents:[],                      children:['gggf_v'],                                                                                                        spouses:['ggggf_v'], exSpouses:[]},
  ggggf_s:     {parents:[],                      children:['gggm_v'],                                                                                                        spouses:['ggggm_s'], exSpouses:[]},
  ggggm_s:     {parents:[],                      children:['gggm_v'],                                                                                                        spouses:['ggggf_s'], exSpouses:[]},
  ggggf_bg:    {parents:[],                      children:['gggf_b'],                                                                                                        spouses:['ggggm_bg'],exSpouses:[]},
  ggggm_bg:    {parents:[],                      children:['gggf_b'],                                                                                                        spouses:['ggggf_bg'],exSpouses:[]},
  ggggf_a:     {parents:[],                      children:['gggm_b'],                                                                                                        spouses:['ggggm_a'], exSpouses:[]},
  ggggm_a:     {parents:[],                      children:['gggm_b'],                                                                                                        spouses:['ggggf_a'], exSpouses:[]},
}

// ── Persistence ───────────────────────────────────────────────────────────────
function loadTree() {
  try {
    const s = localStorage.getItem(TREE_KEY)
    if (s) { const p = JSON.parse(s); if (p._version === TREE_VER) return p }
  } catch {}
  return {people:VOEGELI_PEOPLE, rels:VOEGELI_RELS, profiles:{}, _version:TREE_VER}
}

// ── Fan layout — binary slot system ──────────────────────────────────────────
function computeFanLayout(rels) {
  // BFS from user following parents only; assign binary slot to each ancestor
  const slots = {user:{gen:0, slot:0}}
  const q = ['user']
  while (q.length) {
    const id = q.shift()
    const {gen, slot} = slots[id]
    ;(rels[id]?.parents || []).forEach((pid, i) => {
      if (pid && !slots[pid]) { slots[pid] = {gen:gen-1, slot:slot*2+i}; q.push(pid) }
    })
  }

  const maxDepth = Object.values(slots).reduce((m,s) => Math.max(m,-s.gen), 0)
  const maxR = USER_R + maxDepth * R_STEP
  const W = Math.max(960, maxR * 2 + 200)
  const H = Math.max(700, maxR + 200)
  const cx = W / 2
  const cy = H - 100

  const geom = {}
  for (const [id, {gen, slot}] of Object.entries(slots)) {
    if (gen === 0) {
      geom[id] = {r1:0, r2:USER_R, a1:FAN_L, a2:FAN_R, midA:Math.PI/2, midR:USER_R*0.6, gen:0, slot:0, branch:0, aW:FAN_R-FAN_L}
      continue
    }
    const absG  = -gen
    const total = Math.pow(2, absG)
    const aW    = (FAN_R - FAN_L) / total
    const a1    = FAN_L + slot * aW
    const a2    = a1 + aW
    const midA  = (a1 + a2) / 2
    const r1    = USER_R + (absG - 1) * R_STEP
    const r2    = USER_R + absG * R_STEP
    const midR  = (r1 + r2) / 2
    // Which top-level branch (0=paternal/dad, 1=maternal/mom)?
    const branch = Math.floor(slot / Math.pow(2, absG - 1))
    geom[id] = {r1, r2, a1, a2, midA, midR, gen, slot, branch, aW}
  }

  return {geom, maxDepth, W, H, cx, cy}
}

// ── SVG wedge path ────────────────────────────────────────────────────────────
function wedgePath(cx, cy, r1, r2, a1, a2) {
  const c = Math.cos, s = Math.sin
  const ox1=cx-r2*c(a1), oy1=cy-r2*s(a1)
  const ox2=cx-r2*c(a2), oy2=cy-r2*s(a2)
  const ix1=cx-r1*c(a1), iy1=cy-r1*s(a1)
  const ix2=cx-r1*c(a2), iy2=cy-r1*s(a2)
  const lg = (a2-a1) > Math.PI ? 1 : 0
  if (r1 < 1) {
    return `M ${cx} ${cy} L ${ox1} ${oy1} A ${r2} ${r2} 0 ${lg} 0 ${ox2} ${oy2} Z`
  }
  return `M ${ix1} ${iy1} L ${ox1} ${oy1} A ${r2} ${r2} 0 ${lg} 0 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r1} ${r1} 0 ${lg} 1 ${ix1} ${iy1} Z`
}

// ── Siblings helper ───────────────────────────────────────────────────────────
function getSiblings(id, rels, people) {
  const s = new Set()
  for (const pid of rels[id]?.parents || [])
    for (const cid of rels[pid]?.children || [])
      if (cid !== id) s.add(cid)
  return [...s].map(sid => people[sid]).filter(Boolean)
}

// ── Fan background rings ──────────────────────────────────────────────────────
const GEN_LABELS = ['Parents','Grandparents','Great-Grandparents',
  '2× Great-Grandparents','3× Great-Grandparents']

function FanBackground({cx, cy, maxDepth}) {
  const els = []
  const maxR = USER_R + maxDepth * R_STEP

  // Baseline
  els.push(<line key="base" x1={cx-maxR-10} y1={cy} x2={cx+maxR+10} y2={cy}
    stroke="#3a1808" strokeWidth="1.5" opacity="0.8"/>)

  // Ring arcs and labels
  for (let i=0; i<=maxDepth; i++) {
    const r = USER_R + i * R_STEP
    const x1=cx-r*Math.cos(FAN_L), y1=cy-r*Math.sin(FAN_L)
    const x2=cx-r*Math.cos(FAN_R), y2=cy-r*Math.sin(FAN_R)
    els.push(
      <path key={`ring-${i}`}
        d={`M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}`}
        fill="none" stroke="#3a1808" strokeWidth="1" opacity="0.55"/>
    )
    if (i > 0 && i <= maxDepth) {
      const labelR = USER_R + (i - 0.5) * R_STEP
      const label  = GEN_LABELS[i-1] || `${i-1}× Great-Grandparents`
      els.push(
        <text key={`lbl-${i}`}
          x={cx} y={cy - labelR}
          textAnchor="middle" dominantBaseline="central"
          fill="#2e1206" fontSize="9" fontFamily="'Crimson Text', serif"
          fontStyle="italic" style={{pointerEvents:'none'}}>
          {label}
        </text>
      )
    }
  }
  return <g>{els}</g>
}

// ── Single fan slice ──────────────────────────────────────────────────────────
function FanSlice({id, person, g, cx, cy, scale, onNodeClick, isDragging}) {
  const [hov, setHov] = useState(false)
  const {r1, r2, a1, a2, midA, midR, gen, branch, aW} = g
  const isUser = gen === 0
  const absG   = Math.abs(gen)

  // Fill
  let fill
  if (isUser)         fill = hov ? '#9a6010' : '#5a3008'
  else {
    const di   = Math.min(absG-1, BASE_FILL.length-1)
    const bi   = branch % 2
    fill = hov ? HOV_FILL[di][bi] : BASE_FILL[di][bi]
  }

  // Apparent dimensions in screen pixels
  const arcPx = midR * aW * scale
  const radPx = R_STEP * scale

  // Text/dot mode
  let mode = 'full'
  if (!isUser) {
    if      (arcPx < 15 || radPx < 14) mode = 'dot'
    else if (arcPx < 30 || radPx < 22) mode = 'initial'
    else if (arcPx < 55 || radPx < 30) mode = 'short'
  }

  const name  = person?.name || ''
  const parts = name.split(' ')

  let line1 = '', line2 = ''
  if (isUser) {
    line1 = name
    line2 = person?.birthYear ? `b. ${person.birthYear}` : ''
  } else if (mode === 'initial') {
    line1 = parts[0]?.charAt(0) || '?'
  } else if (mode === 'short') {
    line1 = parts.length > 1 ? `${parts[0].charAt(0)}. ${parts[parts.length-1]}` : name
  } else if (mode === 'full') {
    line1 = name
    if (arcPx > 75 && radPx > 38) {
      const b = person?.birthYear ? `b.${person.birthYear}` : ''
      const d = person?.deathYear ? `d.${person.deathYear}` : ''
      line2 = [b,d].filter(Boolean).join(' ')
    }
  }

  // Text position and rotation
  const tx     = cx - midR * Math.cos(midA)
  const ty     = cy - midR * Math.sin(midA)
  const rotDeg = 90 - midA * 180 / Math.PI

  // Font sizes that scale with available arc space
  const fs1 = isUser ? 12 : Math.min(10, Math.max(6, arcPx * 0.14))
  const fs2 = Math.min(8,  Math.max(5,  arcPx * 0.10))

  const path = wedgePath(cx, cy, r1, r2, a1, a2)

  return (
    <g
      onClick={() => { if (!isDragging.current) onNodeClick(id) }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{cursor:'pointer'}}
    >
      {/* Wedge shape */}
      <path d={path}
        fill={mode === 'dot' ? GENDER_COL[person?.gender||'u'] : fill}
        stroke="#2a1005" strokeWidth="0.6"
        opacity={mode === 'dot' ? 0.55 : 1}
      />
      {/* Hover highlight ring */}
      {hov && !isUser && (
        <path d={path} fill="none" stroke="#c9973a" strokeWidth="1.2" opacity="0.5"/>
      )}

      {/* Text */}
      {mode !== 'dot' && line1 && (
        <text
          x={tx} y={ty}
          textAnchor="middle" dominantBaseline="central"
          transform={`rotate(${rotDeg},${tx},${ty})`}
          style={{pointerEvents:'none', userSelect:'none'}}
        >
          <tspan
            fill={isUser ? '#f5e0a0' : '#c9973a'}
            fontSize={fs1}
            fontFamily={isUser ? "'Special Elite', cursive" : "'Crimson Text', serif"}
            fontWeight={isUser ? 'normal' : '600'}
          >
            {line1}
          </tspan>
          {line2 && (
            <tspan x={tx} dy={`${fs1 * 1.35}px`} fill="#9c7a5a" fontSize={fs2}
              fontFamily="'Crimson Text', serif">
              {line2}
            </tspan>
          )}
        </text>
      )}
    </g>
  )
}

// ── Info / sibling panel ──────────────────────────────────────────────────────
const REL_OPTIONS = [
  {type:'father', label:'Father',  icon:'↑'}, {type:'mother',  label:'Mother',  icon:'↑'},
  {type:'spouse', label:'Spouse',  icon:'♥'}, {type:'child',   label:'Child',   icon:'↓'},
]

function InfoPanel({id, person, siblings, onClose, onEdit, onProfile, onAddRelative}) {
  const [addingRel, setAddingRel] = useState(false)
  const dates = [
    person.birthYear && `Born ${person.birthYear}`,
    person.deathYear && `Died ${person.deathYear}`,
  ].filter(Boolean).join(' · ')

  return (
    <AnimatePresence>
      <motion.div key="bd" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose}
        style={{position:'fixed',inset:0,zIndex:200,background:'rgba(8,4,2,0.75)',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
        <motion.div key="pn" initial={{opacity:0,y:20,scale:0.97}} animate={{opacity:1,y:0,scale:1}}
          onClick={e=>e.stopPropagation()}
          style={{background:'#f5f0e8',maxWidth:420,width:'90%',border:'1px solid #c9b89a',
            borderRadius:3,boxShadow:'0 24px 64px rgba(0,0,0,0.8)',overflow:'hidden'}}>
          {/* Header */}
          <div style={{background:'#2c1810',padding:'16px 18px',display:'flex',
            justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div style={{fontFamily:"'Special Elite', cursive",color:'#f5f0e8',
                fontSize:'1.05rem',lineHeight:1.35}}>{person.name||'—'}</div>
              {dates && <div style={{fontFamily:"'Crimson Text', serif",color:'#9c7a5a',
                fontSize:'0.88rem',marginTop:2}}>{dates}</div>}
              {person.birthPlace && <div style={{fontFamily:"'Crimson Text', serif",color:'#7a5a4a',
                fontSize:'0.82rem',marginTop:1}}>{person.birthPlace}</div>}
            </div>
            <button onClick={onClose} style={{background:'none',border:'none',color:'#9c7a5a',
              fontSize:'1.5rem',cursor:'pointer',lineHeight:1,paddingLeft:12,flexShrink:0}}>×</button>
          </div>

          {/* Body */}
          <div style={{padding:'16px 18px',maxHeight:'55vh',overflowY:'auto'}}>
            {person.note && (
              <p style={{fontFamily:"'Crimson Text', serif",color:'#4a2c1a',fontSize:'0.9rem',
                lineHeight:1.55,margin:'0 0 14px'}}>{person.note}</p>
            )}
            {siblings.length > 0 && (
              <div>
                <p style={{fontFamily:"'Crimson Text', serif",color:'#8b3a2a',fontSize:'0.74rem',
                  letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,margin:'0 0 9px'}}>
                  Siblings ({siblings.length})
                </p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {siblings.map(sib=>(
                    <div key={sib.id} style={{background:'#faf7f2',border:'1px solid #d4c4a8',
                      borderRadius:2,padding:'7px 10px'}}>
                      <div style={{fontFamily:"'Special Elite', cursive",color:'#2c1810',
                        fontSize:'0.82rem',lineHeight:1.3}}>{sib.name}</div>
                      {(sib.birthYear||sib.deathYear) && (
                        <div style={{fontFamily:"'Crimson Text', serif",color:'#8b6a4a',fontSize:'0.76rem',marginTop:2}}>
                          {sib.birthYear&&`b. ${sib.birthYear}`}{sib.deathYear&&` · d. ${sib.deathYear}`}
                        </div>
                      )}
                      {sib.note && (
                        <div style={{fontFamily:"'Crimson Text', serif",color:'#6b4c3b',
                          fontSize:'0.73rem',marginTop:3,lineHeight:1.4}}>{sib.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!person.note && siblings.length===0 && (
              <p style={{fontFamily:"'Crimson Text', serif",color:'#8b6a4a',fontSize:'0.9rem'}}>
                No additional information recorded.
              </p>
            )}
          </div>

          {/* Add relative */}
          {addingRel ? (
            <div style={{padding:'12px 18px',borderTop:'1px solid #d4c4a8',background:'#faf7f2'}}>
              <p style={{fontFamily:"'Crimson Text', serif",color:'#6b4c3b',fontSize:'0.78rem',
                letterSpacing:'0.07em',textTransform:'uppercase',margin:'0 0 8px'}}>
                Add relative to {person.name?.split(' ')[0]}
              </p>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
                {REL_OPTIONS.map(r=>(
                  <button key={r.type} onClick={()=>{onAddRelative(id,r.type);onClose()}}
                    style={{background:'#2c1810',color:'#e8dfc8',border:'1px solid #4a2c1a',
                      padding:'6px 12px',fontFamily:"'Crimson Text', serif",fontSize:'0.85rem',
                      cursor:'pointer',borderRadius:2}}>
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
              <button onClick={()=>setAddingRel(false)}
                style={{background:'transparent',border:'none',color:'#9c7a5a',
                  fontFamily:"'Crimson Text', serif",fontSize:'0.8rem',cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          ) : null}

          {/* Footer */}
          <div style={{padding:'12px 18px',borderTop:'1px solid #d4c4a8',display:'flex',gap:8}}>
            <button onClick={()=>{onProfile(id);onClose()}}
              style={{flex:1,background:'transparent',border:'1px solid #c9b89a',color:'#4a2c1a',
                padding:'9px 0',fontFamily:"'Crimson Text', serif",fontSize:'0.88rem',cursor:'pointer',borderRadius:2}}>
              Stories
            </button>
            <button onClick={()=>setAddingRel(a=>!a)}
              style={{flex:1,background:'transparent',border:'1px solid #c9b89a',color:'#4a6c3a',
                padding:'9px 0',fontFamily:"'Crimson Text', serif",fontSize:'0.88rem',cursor:'pointer',borderRadius:2}}>
              + Add Relative
            </button>
            {id!=='user' && (
              <button onClick={()=>{onEdit(id,person);onClose()}}
                style={{flex:1,background:'#2c1810',border:'none',color:'#e8dfc8',padding:'9px 0',
                  fontFamily:"'Crimson Text', serif",fontSize:'0.88rem',cursor:'pointer',borderRadius:2}}>
                Edit
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Edit person form ──────────────────────────────────────────────────────────
function PersonForm({personId, person, isNew, relType, onSave, onDelete, onClose}) {
  const [form, setForm] = useState({
    name:person?.name||'', birthYear:person?.birthYear||'',
    deathYear:person?.deathYear||'', birthPlace:person?.birthPlace||'', note:person?.note||'',
  })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  return (
    <ParchmentOverlay title={isNew?'Add Person':'Edit Person'} onClose={onClose} maxWidth={400} zIndex={300}>
      <div>
        {[['name','Full Name','text','e.g. Margaret Anne Smith'],
          ['birthYear','Birth Year','number','e.g. 1942'],
          ['deathYear','Year of Passing (optional)','number','e.g. 2018'],
          ['birthPlace','Birthplace (optional)','text','e.g. Dublin, Ireland'],
        ].map(([k,label,type,ph])=>(
          <div key={k} style={{marginBottom:11}}>
            <label style={{display:'block',fontFamily:"'Crimson Text', serif",color:'#6b4c3b',
              fontSize:'0.82rem',marginBottom:4}}>{label}</label>
            <input type={type} placeholder={ph} value={form[k]} onChange={e=>set(k,e.target.value)}
              style={{width:'100%',background:'#fff',border:'1px solid #c9b89a',borderRadius:2,
                padding:'7px 10px',fontFamily:"'Crimson Text', serif",fontSize:'0.92rem',
                color:'#2c1810',outline:'none',boxSizing:'border-box'}}/>
          </div>
        ))}
        <div style={{marginBottom:16}}>
          <label style={{display:'block',fontFamily:"'Crimson Text', serif",color:'#6b4c3b',
            fontSize:'0.82rem',marginBottom:4}}>Notes (optional)</label>
          <textarea rows={2} value={form.note} onChange={e=>set('note',e.target.value)}
            placeholder="Anything worth remembering…"
            style={{width:'100%',background:'#fff',border:'1px solid #c9b89a',borderRadius:2,
              padding:'7px 10px',fontFamily:"'Crimson Text', serif",fontSize:'0.92rem',
              color:'#2c1810',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          {!isNew && personId!=='user' && (
            <button onClick={()=>onDelete(personId)}
              style={{background:'transparent',border:'1px solid #c9b89a',color:'#9c7a5a',
                padding:'9px 12px',fontFamily:"'Crimson Text', serif",fontSize:'0.85rem',
                cursor:'pointer',borderRadius:2}}>Remove</button>
          )}
          <button onClick={onClose}
            style={{background:'transparent',border:'1px solid #c9b89a',color:'#6b4c3b',
              padding:'9px 16px',fontFamily:"'Crimson Text', serif",fontSize:'0.9rem',
              cursor:'pointer',borderRadius:2}}>Cancel</button>
          <button onClick={()=>{onSave(personId,form,isNew);onClose()}}
            style={{flex:1,background:'#8b3a2a',color:'#f5f0e8',border:'none',padding:9,
              fontFamily:"'Special Elite', cursive",fontSize:'0.95rem',letterSpacing:'0.04em',
              cursor:'pointer',borderRadius:2}}>{isNew?'Add to Tree':'Save'}</button>
        </div>
      </div>
    </ParchmentOverlay>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FamilyTree() {
  const init = useMemo(()=>loadTree(),[])
  const [people,   setPeople]   = useState(init.people)
  const [rels,     setRels]     = useState(init.rels)
  const [profiles, setProfiles] = useState(init.profiles||{})
  const [infoPanel,    setInfoPanel]    = useState(null)
  const [editPanel,    setEditPanel]    = useState(null)
  const [profilePanel, setProfilePanel] = useState(null)

  // Viewport
  const [vp, setVp]       = useState({x:0,y:0,scale:1})
  const vpRef             = useRef({x:0,y:0,scale:1})
  vpRef.current           = vp
  const dragRef           = useRef(null)
  const isDragging        = useRef(false)
  const mouseStartRef     = useRef(null)

  useEffect(()=>{
    localStorage.setItem(TREE_KEY, JSON.stringify({people,rels,profiles,_version:TREE_VER}))
  },[people,rels,profiles])

  const layout = useMemo(()=>computeFanLayout(rels),[rels])
  const {geom, maxDepth, W, H, cx, cy} = layout

  // Initial viewport: fit tree into screen, user node near bottom-center
  useEffect(()=>{
    const vpW = window.innerWidth
    const vpH = window.innerHeight - 64
    const s   = Math.min(1, Math.max(0.2, (vpW - 60) / W))
    setVp({x:(vpW - W*s)/2, y:vpH - cy*s - 60, scale:s})
  },[W,H,cx,cy])

  // ── Drag / click discrimination ────────────────────────────────────────────
  const onMouseDown = useCallback((e)=>{
    isDragging.current  = false
    mouseStartRef.current = {x:e.clientX, y:e.clientY}
    dragRef.current = {ox:e.clientX - vpRef.current.x, oy:e.clientY - vpRef.current.y}
    e.preventDefault()
  },[])

  const onMouseMove = useCallback((e)=>{
    if (!dragRef.current) return
    const dx = e.clientX - mouseStartRef.current.x
    const dy = e.clientY - mouseStartRef.current.y
    if (Math.sqrt(dx*dx+dy*dy) > 4) isDragging.current = true
    setVp(v=>({...v, x:e.clientX-dragRef.current.ox, y:e.clientY-dragRef.current.oy}))
  },[])

  const onMouseUp = useCallback(()=>{ dragRef.current = null },[])

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoomBy = (factor) => setVp(v=>{
    const ns  = Math.max(0.1, Math.min(4, v.scale*factor))
    const pcx = window.innerWidth/2
    const pcy = (window.innerHeight-64)/2
    return {scale:ns, x:pcx-(pcx-v.x)*(ns/v.scale), y:pcy-(pcy-v.y)*(ns/v.scale)}
  })

  const fitTree = () => {
    const vpW=window.innerWidth, vpH=window.innerHeight-64
    const s=Math.min(1,Math.max(0.1,(vpW-60)/W))
    setVp({x:(vpW-W*s)/2, y:vpH-cy*s-60, scale:s})
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleAddRelative = (fromId, relType) => {
    const newId  = uid()
    const newPerson = {id:newId, name:'', gender:'u', birthYear:'', deathYear:'', birthPlace:'', note:''}
    const fromRel   = rels[fromId] || {parents:[],children:[],spouses:[],exSpouses:[]}
    let updFrom = {...fromRel}
    let updNew  = {parents:[],children:[],spouses:[],exSpouses:[]}
    const extra = {}

    if (relType==='father'||relType==='mother') {
      updFrom = {...updFrom, parents:[...updFrom.parents, newId]}
      updNew  = {...updNew,  children:[fromId]}
      if (relType==='father') newPerson.gender='m'
      if (relType==='mother') newPerson.gender='f'
    } else if (relType==='spouse') {
      updFrom = {...updFrom, spouses:[...updFrom.spouses, newId]}
      updNew  = {...updNew,  spouses:[fromId]}
    } else if (relType==='child') {
      updFrom = {...updFrom, children:[...updFrom.children, newId]}
      const spouseId = fromRel.spouses?.[0]
      updNew = {...updNew, parents: spouseId ? [fromId, spouseId] : [fromId]}
      if (spouseId && rels[spouseId])
        extra[spouseId] = {...rels[spouseId], children:[...(rels[spouseId].children||[]), newId]}
    }

    setPeople(p=>({...p, [newId]:newPerson}))
    setRels(r=>({...r, [fromId]:updFrom, [newId]:updNew, ...extra}))
    setEditPanel({personId:newId, person:newPerson, isNew:true, relType})
  }

  const handleSave = (personId, form) =>
    setPeople(p=>({...p,[personId]:{...p[personId],...form}}))

  const handleDelete = (personId) => {
    setEditPanel(null)
    setPeople(p=>{const n={...p};delete n[personId];return n})
    setRels(r=>{
      const n={...r};delete n[personId]
      for (const [id,rel] of Object.entries(n))
        n[id]={parents:(rel.parents||[]).filter(x=>x!==personId),
               children:(rel.children||[]).filter(x=>x!==personId),
               spouses:(rel.spouses||[]).filter(x=>x!==personId),
               exSpouses:(rel.exSpouses||[]).filter(x=>x!==personId)}
      return n
    })
  }

  return (
    <div style={{position:'fixed',inset:0,top:56,background:'#080402',overflow:'hidden'}}>

      {/* Full-screen SVG — everything inside transforms together */}
      <svg width="100%" height="100%" style={{display:'block',cursor:dragRef.current?'grabbing':'grab'}}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove}
        onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>

        <g transform={`translate(${vp.x},${vp.y}) scale(${vp.scale})`}>
          <FanBackground cx={cx} cy={cy} maxDepth={maxDepth}/>

          {/* Slices — render background (non-hovered) first, then user on top */}
          {Object.entries(geom)
            .filter(([id])=>id!=='user')
            .map(([id,g])=>(
              <FanSlice key={id} id={id} person={people[id]||{name:id}} g={g}
                cx={cx} cy={cy} scale={vp.scale}
                onNodeClick={id=>setInfoPanel({id})} isDragging={isDragging}/>
            ))}
          {/* User center on top */}
          {geom['user'] && (
            <FanSlice key="user" id="user" person={people['user']} g={geom['user']}
              cx={cx} cy={cy} scale={vp.scale}
              onNodeClick={id=>setInfoPanel({id})} isDragging={isDragging}/>
          )}
        </g>
      </svg>

      {/* Zoom controls */}
      <div style={{position:'absolute',bottom:28,right:24,display:'flex',flexDirection:'column',
        gap:6,zIndex:10}}>
        {[{l:'+',a:()=>zoomBy(1.2)},{l:'−',a:()=>zoomBy(0.833)},{l:'Fit',a:fitTree}]
          .map(({l,a})=>(
            <button key={l} onClick={a}
              style={{width:42,height:38,background:'rgba(16,8,4,0.92)',border:'1px solid #4a2c1a',
                color:'#c9973a',fontSize:l==='Fit'?'0.78rem':'1.3rem',fontFamily:"'Crimson Text', serif",
                cursor:'pointer',borderRadius:3,display:'flex',alignItems:'center',
                justifyContent:'center'}}>
              {l}
            </button>
          ))}
      </div>

      {/* Hint */}
      <div style={{position:'absolute',top:12,left:16,fontFamily:"'Crimson Text', serif",
        color:'#3a1808',fontSize:'0.75rem',fontStyle:'italic',pointerEvents:'none',lineHeight:1.7}}>
        <span style={{color:'#c9973a',fontStyle:'normal',fontFamily:"'Special Elite', cursive",
          fontSize:'0.9rem',display:'block',marginBottom:2}}>Family Tree</span>
        Drag to pan · +/− to zoom · click to explore
      </div>

      {/* Legend */}
      <div style={{position:'absolute',bottom:28,left:16,display:'flex',flexDirection:'column',
        gap:5,pointerEvents:'none'}}>
        {[['#3a6090','Male'],['#904060','Female']].map(([c,l])=>(
          <div key={l} style={{display:'flex',alignItems:'center',gap:7}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:c,opacity:0.7}}/>
            <span style={{fontFamily:"'Crimson Text', serif",color:'#3a1808',fontSize:'0.73rem',
              fontStyle:'italic'}}>{l} (far zoom)</span>
          </div>
        ))}
      </div>

      {/* Panels */}
      {infoPanel && people[infoPanel.id] && (
        <InfoPanel id={infoPanel.id} person={people[infoPanel.id]}
          siblings={getSiblings(infoPanel.id, rels, people)}
          onClose={()=>setInfoPanel(null)}
          onEdit={(id,person)=>{setEditPanel({personId:id,person,isNew:false});setInfoPanel(null)}}
          onProfile={id=>{setProfilePanel(id);setInfoPanel(null)}}
          onAddRelative={handleAddRelative}/>
      )}
      {editPanel && (
        <PersonForm personId={editPanel.personId} person={editPanel.person}
          isNew={editPanel.isNew} relType={editPanel.relType}
          onSave={handleSave} onDelete={handleDelete} onClose={()=>setEditPanel(null)}/>
      )}
      {profilePanel && people[profilePanel] && (
        <PersonProfilePanel personId={profilePanel} person={people[profilePanel]}
          profile={profiles[profilePanel]||{}}
          onUpdate={u=>setProfiles(p=>({...p,[profilePanel]:u}))}
          onClose={()=>setProfilePanel(null)}/>
      )}
    </div>
  )
}
