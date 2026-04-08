// ─── Storage keys ─────────────────────────────────────────────────────────────
export const MEMORIES_KEY  = 'my-story-memories'
export const BIRTH_KEY     = 'my-story-birth'
export const TREE_KEY      = 'my-story-family-tree'

// ─── Image → base64 ──────────────────────────────────────────────────────────
// Converts a File to a compressed base64 JPEG string (max 900px, ~78% quality).
// Returns a Promise<string>.
export function imageToBase64(file, maxPx = 900, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blobUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(blobUrl)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width  * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = blobUrl
  })
}

// ─── Memories ─────────────────────────────────────────────────────────────────
export function loadMemoriesFromStorage() {
  try {
    const raw = localStorage.getItem(MEMORIES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip any surviving blob: URLs (safety net — shouldn't happen after fix)
        const clean = parsed.map(m => ({
          ...m,
          src: m.src?.startsWith('blob:') ? null : m.src,
        }))
        return { memories: clean, isReal: true }
      }
    }
  } catch {}
  return { memories: null, isReal: false }
}

export function saveMemoriesToStorage(list) {
  const safe = list.map(m => ({
    ...m,
    src: m.src?.startsWith('blob:') ? null : m.src,
  }))
  localStorage.setItem(MEMORIES_KEY, JSON.stringify(safe))
}

// ─── Birth info ───────────────────────────────────────────────────────────────
export function loadBirthInfo() {
  try {
    return JSON.parse(localStorage.getItem(BIRTH_KEY) || 'null')
  } catch {
    return null
  }
}

export function saveBirthInfo(info) {
  localStorage.setItem(BIRTH_KEY, JSON.stringify(info))
}

// ─── Family tree ──────────────────────────────────────────────────────────────
export function loadTreeFromStorage() {
  try {
    const raw = localStorage.getItem(TREE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function saveTreeToStorage(data) {
  localStorage.setItem(TREE_KEY, JSON.stringify(data))
}
