import { compareDates, parseDateString, normalizeCountry } from './dates'

export function generateTimelineData(entries, birthInfo = null) {
  const all = [...(entries || [])]

  // Inject birth event if birthInfo present and not already in entries
  if (birthInfo?.birthDate) {
    const birthId = '__birth__'
    const alreadyPresent = all.some(e => e.id === birthId)
    if (!alreadyPresent) {
      const loc = [birthInfo.city, birthInfo.state, birthInfo.country ? normalizeCountry(birthInfo.country) : null]
        .filter(Boolean).join(', ')
      all.push({
        id: birthId,
        date: birthInfo.birthDate,
        caption: `Born${loc ? ` in ${loc}` : ''}`,
        type: 'birth',
        location: {
          city: birthInfo.city ?? null,
          state: birthInfo.state ?? null,
          country: birthInfo.country ? normalizeCountry(birthInfo.country) : null,
        },
        isBirth: true,
      })
    }
  }

  const sorted = all.sort((a, b) => compareDates(a.date, b.date))

  return sorted.map((entry, i) => ({
    ...entry,
    position: i % 2 === 0 ? 'above' : 'below',
    timestamp: parseDateString(entry.date),
  }))
}
