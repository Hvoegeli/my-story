import { useState, useRef } from 'react'
import HTMLFlipBook from 'react-pageflip'
import { motion } from 'framer-motion'
import MemoryCard from '../components/MemoryCard'
import AddMemoryModal from '../components/AddMemoryModal'
import SocialConnectModal from '../components/SocialConnectModal'
import { sampleMemories } from '../data/sampleData'
import { loadMemoriesFromStorage, saveMemoriesToStorage } from '../utils/storage'
import { compareDates, parseDateString } from '../utils/dates'

function extractYear(dateStr) {
  const ts = parseDateString(dateStr)
  return ts ? new Date(ts).getFullYear() : null
}

// Sort chronologically, chunk into pairs, build yearIndex (year → flip-book page #)
// Pages: 0=cover, 1-2=year index spread, 3+=content pairs
function buildPageData(memories) {
  const sorted = [...memories].sort((a, b) => compareDates(a.date, b.date))
  const pairs = []
  for (let i = 0; i < sorted.length; i += 2) pairs.push(sorted.slice(i, i + 2))

  const yearIndex = {}
  sorted.forEach((mem, i) => {
    const yr = extractYear(mem.date)
    if (yr != null && !(yr in yearIndex)) {
      yearIndex[yr] = Math.floor(i / 2) * 2 + 3 // +1 cover +2 index pages
    }
  })

  return { pairs, yearIndex }
}

function BookPage({ memories, pageNum, side, onEdit }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: side === 'left'
        ? 'linear-gradient(to right, #e8dfc8, #f5f0e8)'
        : 'linear-gradient(to left, #e8dfc8, #f5f0e8)',
      padding: '32px 24px',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Crimson Text', serif",
    }}>
      {/* Spine shadow */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        [side === 'left' ? 'right' : 'left']: 0,
        width: '20px',
        background: side === 'left'
          ? 'linear-gradient(to right, transparent, rgba(44,24,16,0.08))'
          : 'linear-gradient(to left, transparent, rgba(44,24,16,0.08))',
        pointerEvents: 'none',
      }} />

      {/* Corner page number */}
      <div style={{
        position: 'absolute', bottom: '14px',
        [side === 'left' ? 'left' : 'right']: '20px',
        color: '#9c7a5a', fontSize: '0.75rem', fontStyle: 'italic',
      }}>
        {pageNum}
      </div>

      {/* Decorative header rule */}
      <div style={{ borderBottom: '1px solid #c9b89a', marginBottom: '16px', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#c9973a', fontSize: '0.85rem' }}>✦</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#6b4c3b', fontSize: '0.85rem' }}>My Story</span>
        <span style={{ color: '#c9973a', fontSize: '0.85rem' }}>✦</span>
      </div>

      {/* Memory cards */}
      <div style={{ overflowY: 'auto', height: 'calc(100% - 80px)' }}>
        {memories.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#b0966e', fontStyle: 'italic', marginTop: '60px', fontSize: '1rem' }}>
            This page is empty.<br />
            <span style={{ fontSize: '0.85rem' }}>Add a memory to fill it.</span>
          </div>
        ) : (
          memories.map(mem => (
            <MemoryCard key={mem.id} memory={mem} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  )
}

function YearIndexPage({ yearIndex, onYearClick, side }) {
  const years = Object.keys(yearIndex).map(Number).sort((a, b) => a - b)
  return (
    <div style={{
      width: '100%', height: '100%',
      background: side === 'left'
        ? 'linear-gradient(to right, #e8dfc8, #f5f0e8)'
        : 'linear-gradient(to left, #e8dfc8, #f5f0e8)',
      padding: '32px 24px', position: 'relative',
      fontFamily: "'Crimson Text', serif",
    }}>
      <div style={{ borderBottom: '1px solid #c9b89a', marginBottom: '16px', paddingBottom: '8px', textAlign: 'center' }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#6b4c3b', fontSize: '0.9rem' }}>
          Year Index
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px' }}>
        {years.map(yr => (
          <button key={yr} onClick={() => onYearClick(yr)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Crimson Text', serif", fontSize: '1rem',
            color: '#8b3a2a', textDecoration: 'underline', padding: 0,
          }}>
            {yr}
          </button>
        ))}
      </div>
    </div>
  )
}

function CoverPage({ front }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: front
        ? 'linear-gradient(135deg, #2c1810 0%, #4a2c1a 50%, #2c1810 100%)'
        : 'linear-gradient(135deg, #2c1810 0%, #3a2010 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px', position: 'relative',
    }}>
      <div style={{ position: 'absolute', inset: '20px', border: '2px solid #c9973a', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '26px', border: '1px solid rgba(201,151,58,0.3)', pointerEvents: 'none' }} />
      {front ? (
        <>
          <div style={{ color: '#c9973a', fontSize: '2rem', marginBottom: '16px' }}>✦</div>
          <h1 style={{ fontFamily: "'Special Elite', cursive", color: '#f5f0e8', fontSize: '2.8rem', textAlign: 'center', letterSpacing: '0.1em', margin: 0, textShadow: '0 2px 16px rgba(201,151,58,0.4)' }}>
            My Story
          </h1>
          <div style={{ width: '80px', height: '1px', background: '#c9973a', margin: '20px 0' }} />
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#c9b89a', fontSize: '1rem', textAlign: 'center' }}>
            A Life in Pages
          </p>
          <div style={{ color: '#c9973a', fontSize: '2rem', marginTop: '16px' }}>✦</div>
        </>
      ) : (
        <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', color: '#6b4c3b', textAlign: 'center' }}>
          The End — for now.
        </p>
      )}
    </div>
  )
}

export default function Scrapbook() {
  const stored = loadMemoriesFromStorage()
  const initMemories = stored.isReal ? stored.memories : sampleMemories

  const [memories, setMemories] = useState(initMemories)
  const [hasRealMemories, setHasRealMemories] = useState(stored.isReal)
  const [currentPage, setCurrentPage] = useState(0)
  const [showAddMemory, setShowAddMemory] = useState(false)
  const [showSocialConnect, setShowSocialConnect] = useState(false)
  const [editingMemory, setEditingMemory] = useState(null)   // memory being edited
  const [flipBlocked, setFlipBlocked] = useState(false)      // block page turns during edit
  const bookRef = useRef()
  const { pairs, yearIndex } = buildPageData(memories)
  const totalPages = pairs.length + 4 // cover + 2 index pages + back cover

  const jumpToYear  = (year) => {
    const pg = yearIndex[year]
    if (pg != null) bookRef.current?.pageFlip()?.flip(pg)
  }
  const jumpToIndex = () => bookRef.current?.pageFlip()?.flip(1)

  // ── Block / unblock page turns ─────────────────────────────────────────────
  const blockFlip = () => setFlipBlocked(true)
  const unblockFlip = () => setFlipBlocked(false)

  // ── Open Add modal ─────────────────────────────────────────────────────────
  const handleOpenAdd = () => { blockFlip(); setShowAddMemory(true) }
  const handleCloseAdd = () => { setShowAddMemory(false); unblockFlip() }

  // ── Open Edit overlay ──────────────────────────────────────────────────────
  const handleEdit = (memory) => { blockFlip(); setEditingMemory(memory) }
  const handleEditClose = () => { setEditingMemory(null); unblockFlip() }

  // ── Add new memory ─────────────────────────────────────────────────────────
  const handleAddMemory = (newMemory) => {
    setMemories(prev => {
      const base = hasRealMemories ? prev : []
      const next = [newMemory, ...base]
      saveMemoriesToStorage(next)
      return next
    })
    if (!hasRealMemories) setHasRealMemories(true)
  }

  // ── Save edits to existing memory ──────────────────────────────────────────
  const handleSaveEdit = (updated) => {
    setMemories(prev => {
      const next = prev.map(m => m.id === updated.id ? updated : m)
      saveMemoriesToStorage(next)
      return next
    })
    handleEditClose()
  }

  // ── Delete a memory ────────────────────────────────────────────────────────
  const handleDelete = (id) => {
    setMemories(prev => {
      const next = prev.filter(m => m.id !== id)
      saveMemoriesToStorage(next)
      return next
    })
    handleEditClose()
  }

  // ── Social import ──────────────────────────────────────────────────────────
  const handleSocialImport = (imported) => {
    setMemories(prev => {
      const base = hasRealMemories ? prev : []
      const next = [...imported, ...base]
      saveMemoriesToStorage(next)
      return next
    })
    if (!hasRealMemories) setHasRealMemories(true)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a0f0a', paddingTop: '72px', paddingBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Modals */}
      {showAddMemory && (
        <AddMemoryModal
          onClose={handleCloseAdd}
          onAdd={handleAddMemory}
        />
      )}
      {showSocialConnect && (
        <SocialConnectModal
          onClose={() => { setShowSocialConnect(false); unblockFlip() }}
          onImport={handleSocialImport}
        />
      )}
      {editingMemory && (
        <AddMemoryModal
          onClose={handleEditClose}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
          initialMemory={editingMemory}
        />
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div style={{ position: 'relative', boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,151,58,0.1)' }}>
          {/* Transparent flip-blocker overlay — sits over the book during editing */}
          {flipBlocked && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              cursor: 'default',
            }} />
          )}

          <HTMLFlipBook
            key={pairs.length}
            ref={bookRef}
            width={420}
            height={580}
            size="fixed"
            minWidth={300}
            maxWidth={500}
            minHeight={400}
            maxHeight={700}
            drawShadow={true}
            flippingTime={700}
            clickEventForward={false}
            showPagedFlipBtn={false}
            swipeDistance={0}
            className="book"
            onFlip={e => setCurrentPage(e.data)}
            startPage={0}
            usePortrait={false}
            startZIndex={20}
            autoSize={true}
            maxShadowOpacity={0.5}
            disableFlipByClick={true}
          >
            {/* Front cover */}
            <div><CoverPage front={true} /></div>

            {/* Year Index spread */}
            <div><YearIndexPage yearIndex={yearIndex} onYearClick={jumpToYear} side="left" /></div>
            <div><YearIndexPage yearIndex={yearIndex} onYearClick={jumpToYear} side="right" /></div>

            {/* Content pages */}
            {pairs.flatMap((pair, i) => [
              <div key={`left-${i}`}>
                <BookPage memories={[pair[0]].filter(Boolean)} pageNum={i * 2 + 1} side="left" onEdit={handleEdit} />
              </div>,
              <div key={`right-${i}`}>
                <BookPage memories={[pair[1]].filter(Boolean)} pageNum={i * 2 + 2} side="right" onEdit={handleEdit} />
              </div>,
            ])}

            {/* Back cover */}
            <div><CoverPage front={false} /></div>
          </HTMLFlipBook>
        </div>

        {/* Navigation controls — fleur-de-lis */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', marginTop: '28px' }}>
          <button onClick={jumpToIndex} style={{ ...fleurBtnStyle, fontSize: '0.75rem', padding: '6px 12px' }}>
            ↑ Year Index
          </button>
          <button
            onClick={() => bookRef.current?.pageFlip()?.flipPrev()}
            style={fleurBtnStyle}
            title="Previous page"
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1, display: 'block' }}>⚜</span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.06em', display: 'block', marginTop: '2px' }}>PREV</span>
          </button>
          <span style={{ fontFamily: "'Crimson Text', serif", color: '#9c7a5a', fontSize: '0.9rem', minWidth: '100px', textAlign: 'center' }}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => bookRef.current?.pageFlip()?.flipNext()}
            style={fleurBtnStyle}
            title="Next page"
          >
            <span style={{ fontSize: '1.6rem', lineHeight: 1, display: 'block' }}>⚜</span>
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.06em', display: 'block', marginTop: '2px' }}>NEXT</span>
          </button>
        </div>

        {/* Import + Add buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
          <button onClick={() => { blockFlip(); setShowSocialConnect(true) }} style={actionBtnStyle('#1877f2')}>Import from Facebook</button>
          <button onClick={() => { blockFlip(); setShowSocialConnect(true) }} style={actionBtnStyle('#833ab4')}>Import from Instagram</button>
          <button onClick={handleOpenAdd} style={actionBtnStyle('#8b3a2a')}>+ Add Memory</button>
        </div>
      </motion.div>
    </div>
  )
}

const fleurBtnStyle = {
  background: 'transparent', border: '1px solid #4a2c1a', color: '#c9973a',
  padding: '8px 18px', fontFamily: "'Special Elite', cursive",
  cursor: 'pointer', borderRadius: '2px', textAlign: 'center',
  transition: 'border-color 0.2s, color 0.2s',
}

const actionBtnStyle = (bg) => ({
  background: bg, color: '#f5f0e8', border: 'none', padding: '8px 16px',
  fontFamily: "'Crimson Text', serif", fontSize: '0.9rem', cursor: 'pointer',
  borderRadius: '2px', opacity: 0.9,
})
