// Parse MMDDYYYY, MMYYYY, YYYY, or ISO to a sortable timestamp (or null)
export function parseDateString(str) {
  if (!str) return null
  // ISO / standard formats first (contain dashes or slashes)
  if (/\D/.test(str)) {
    const ts = Date.parse(str)
    return isNaN(ts) ? null : ts
  }
  const s = str.trim()
  if (s.length === 8) {
    // MMDDYYYY
    const y = s.slice(4), m = s.slice(0, 2), d = s.slice(2, 4)
    const ts = Date.parse(`${y}-${m}-${d}`)
    return isNaN(ts) ? null : ts
  }
  if (s.length === 6) {
    // MMYYYY
    const y = s.slice(2), m = s.slice(0, 2)
    const ts = Date.parse(`${y}-${m}-01`)
    return isNaN(ts) ? null : ts
  }
  if (s.length === 4) {
    const ts = Date.parse(`${s}-01-01`)
    return isNaN(ts) ? null : ts
  }
  const ts = Date.parse(str)
  return isNaN(ts) ? null : ts
}

const COUNTRY_ALIASES = {
  'usa': 'United States', 'u.s.a.': 'United States', 'u.s.': 'United States',
  'us': 'United States', 'united states of america': 'United States',
  'uk': 'United Kingdom', 'great britain': 'United Kingdom',
}

export function normalizeCountry(name) {
  if (!name) return name
  return COUNTRY_ALIASES[name.toLowerCase().trim()] ?? name.trim()
}

export function compareDates(a, b) {
  const ta = parseDateString(a) ?? Infinity
  const tb = parseDateString(b) ?? Infinity
  return ta - tb
}
