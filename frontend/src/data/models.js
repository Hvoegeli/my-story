/**
 * models.js — Canonical data model definitions for My Story
 *
 * These are the authoritative shapes used throughout the frontend.
 * localStorage stores JSON matching these structures.
 * When the backend is connected, API responses will be normalized
 * to these same shapes before being stored in React state.
 *
 * No UI code. No side effects. Pure structure definitions + helpers.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PERSON
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} Person
 * @property {string}  id               — unique (cuid in DB, uid() in localStorage)
 * @property {string}  name
 * @property {string}  [birthDate]      — MMDDYYYY | MMYYYY | YYYY  (string, not Date)
 * @property {string}  [birthCity]
 * @property {string}  [birthState]
 * @property {string}  [birthCountry]
 * @property {string}  [deathYear]      — YYYY
 * @property {number}  generationIndex  — integer relative to user (0 = user, -1 = parents, +1 = children …)
 * @property {boolean} isUser           — true for exactly one Person per account
 * @property {boolean} [isAdopted]
 * @property {string}  [note]
 */

/** @returns {Person} */
export function createPerson(overrides = {}) {
  return {
    id:              overrides.id              ?? uid(),
    name:            overrides.name            ?? '',
    birthDate:       overrides.birthDate       ?? null,
    birthCity:       overrides.birthCity       ?? null,
    birthState:      overrides.birthState      ?? null,
    birthCountry:    overrides.birthCountry    ?? null,
    deathYear:       overrides.deathYear       ?? null,
    generationIndex: overrides.generationIndex ?? 0,
    isUser:          overrides.isUser          ?? false,
    isAdopted:       overrides.isAdopted       ?? false,
    note:            overrides.note            ?? null,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid relationship types.
 * "child" is always the mirror of "parent" and is stored explicitly
 * so lookups in either direction require no extra traversal.
 *
 * @readonly
 * @enum {string}
 */
export const RelationshipType = Object.freeze({
  SPOUSE:   'spouse',
  DIVORCED: 'divorced',
  PARENT:   'parent',   // fromPersonId IS A PARENT OF toPersonId
  CHILD:    'child',    // fromPersonId IS A CHILD OF toPersonId  (mirror of parent)
  SIBLING:  'sibling',
})

/**
 * Which relationship types are symmetric (mirror must always exist).
 * Application layer is responsible for creating both directions.
 */
export const SYMMETRIC_TYPES = new Set([
  RelationshipType.SPOUSE,
  RelationshipType.DIVORCED,
  RelationshipType.SIBLING,
])

/**
 * Mirror map: adding rel A→B of type X also requires adding B→A of type mirrorOf[X].
 */
export const MIRROR_TYPE = {
  [RelationshipType.SPOUSE]:   RelationshipType.SPOUSE,
  [RelationshipType.DIVORCED]: RelationshipType.DIVORCED,
  [RelationshipType.PARENT]:   RelationshipType.CHILD,
  [RelationshipType.CHILD]:    RelationshipType.PARENT,
  [RelationshipType.SIBLING]:  RelationshipType.SIBLING,
}

/**
 * @typedef {Object} Relationship
 * @property {string}           id
 * @property {string}           fromPersonId
 * @property {string}           toPersonId
 * @property {RelationshipType} relationshipType
 */

/** @returns {Relationship} */
export function createRelationship(fromPersonId, toPersonId, relationshipType) {
  return { id: uid(), fromPersonId, toPersonId, relationshipType }
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP STORE
// The full tree is a flat list of Relationship objects.
// All lookups go through these helpers — never iterate the raw list directly.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a relationship (and its required mirror) to a list.
 * Silently deduplicates: will not add if an identical edge already exists.
 *
 * @param {Relationship[]} rels  — existing list (not mutated)
 * @param {string} fromId
 * @param {string} toId
 * @param {RelationshipType} type
 * @returns {Relationship[]} new list
 */
export function addRelationship(rels, fromId, toId, type) {
  const next = [...rels]

  const has = (a, b, t) => next.some(r => r.fromPersonId === a && r.toPersonId === b && r.relationshipType === t)

  if (!has(fromId, toId, type)) {
    next.push(createRelationship(fromId, toId, type))
  }

  const mirror = MIRROR_TYPE[type]
  if (mirror && !has(toId, fromId, mirror)) {
    next.push(createRelationship(toId, fromId, mirror))
  }

  return next
}

/**
 * Remove a relationship (and its mirror) from the list.
 *
 * @param {Relationship[]} rels
 * @param {string} fromId
 * @param {string} toId
 * @param {RelationshipType} type
 * @returns {Relationship[]} new list
 */
export function removeRelationship(rels, fromId, toId, type) {
  const mirror = MIRROR_TYPE[type]
  return rels.filter(r => {
    const isFwd = r.fromPersonId === fromId && r.toPersonId === toId && r.relationshipType === type
    const isRev = mirror && r.fromPersonId === toId && r.toPersonId === fromId && r.relationshipType === mirror
    return !isFwd && !isRev
  })
}

/**
 * Divorce: replace spouse↔spouse edges with divorced↔divorced edges.
 *
 * @param {Relationship[]} rels
 * @param {string} personAId
 * @param {string} personBId
 * @returns {Relationship[]} new list
 */
export function divorceCouple(rels, personAId, personBId) {
  let next = removeRelationship(rels, personAId, personBId, RelationshipType.SPOUSE)
  next = addRelationship(next, personAId, personBId, RelationshipType.DIVORCED)
  return next
}

/**
 * Remove a person and all their edges from both collections.
 *
 * @param {Person[]} people
 * @param {Relationship[]} rels
 * @param {string} personId
 * @returns {{ people: Person[], rels: Relationship[] }}
 */
export function removePerson(people, rels, personId) {
  return {
    people: people.filter(p => p.id !== personId),
    rels:   rels.filter(r => r.fromPersonId !== personId && r.toPersonId !== personId),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP HELPERS
// All return arrays of Person objects (not IDs) for convenience.
// ─────────────────────────────────────────────────────────────────────────────

const byId = (people, id) => people.find(p => p.id === id) ?? null

/** All people related to personId by a given type (following fromPersonId direction) */
function relatedIds(rels, personId, type) {
  return rels
    .filter(r => r.fromPersonId === personId && r.relationshipType === type)
    .map(r => r.toPersonId)
}

/** @returns {Person[]} */
export const getParents    = (people, rels, id) => relatedIds(rels, id, RelationshipType.PARENT).map(i => byId(people, i)).filter(Boolean)
/** @returns {Person[]} */
export const getChildren   = (people, rels, id) => relatedIds(rels, id, RelationshipType.CHILD).map(i => byId(people, i)).filter(Boolean)
/** @returns {Person[]} */
export const getSpouses    = (people, rels, id) => relatedIds(rels, id, RelationshipType.SPOUSE).map(i => byId(people, i)).filter(Boolean)
/** @returns {Person[]} */
export const getExSpouses  = (people, rels, id) => relatedIds(rels, id, RelationshipType.DIVORCED).map(i => byId(people, i)).filter(Boolean)
/** @returns {Person[]} */
export const getSiblings   = (people, rels, id) => relatedIds(rels, id, RelationshipType.SIBLING).map(i => byId(people, i)).filter(Boolean)

// ─────────────────────────────────────────────────────────────────────────────
// PERSON PROFILE CONTENT
// Stories, photos, places attached to a Person (stored inside `profiles` map).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} PersonStory
 * @property {string} id
 * @property {string} text
 * @property {string} [date]  — MMDDYYYY | MMYYYY | YYYY  (for chronological sort)
 */

/**
 * @typedef {Object} PersonPhoto
 * @property {string} id
 * @property {string} src     — base64 data URI
 * @property {string} [caption]
 * @property {string} [date]
 */

/**
 * @typedef {Object} PersonPlace
 * @property {string} id
 * @property {string} name
 * @property {string} [city]
 * @property {string} [state]
 * @property {string} [country]
 * @property {string} [yearFrom]
 * @property {string} [yearTo]
 * @property {string} [note]
 */

/**
 * @typedef {Object} PersonProfile
 * @property {PersonStory[]} stories  — sorted ascending by date at read time
 * @property {PersonPhoto[]} photos
 * @property {PersonPlace[]} places
 */

/** Sort stories chronologically. Undated stories go last. */
export function sortStoriesChronological(stories = []) {
  return [...stories].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return parseDateString(a.date) - parseDateString(b.date)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// TREE STORE SHAPE (what gets written to localStorage / returned by API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} TreeStore
 * @property {Person[]}       people    — flat array, no duplicates
 * @property {Relationship[]} rels      — flat array, includes mirror edges
 * @property {Object.<string, PersonProfile>} profiles  — keyed by person id
 */

/** Empty tree seeded with the user's own Person record */
export function createEmptyTree() {
  const userPerson = createPerson({ isUser: true, generationIndex: 0 })
  return {
    people:   [userPerson],
    rels:     [],
    profiles: {},
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a flexible date string into a sortable timestamp.
 * Accepts: MMDDYYYY | MMYYYY | YYYY | YYYY-MM-DD (ISO)
 * Returns: ms since epoch (or 0 if unparseable)
 */
export function parseDateString(str) {
  if (!str) return 0
  // ISO format — Date can handle directly
  if (str.includes('-')) return new Date(str).getTime() || 0
  if (str.length === 8) {  // MMDDYYYY
    const mm = str.slice(0, 2), dd = str.slice(2, 4), yyyy = str.slice(4)
    return new Date(`${yyyy}-${mm}-${dd}`).getTime() || 0
  }
  if (str.length === 6) {  // MMYYYY
    const mm = str.slice(0, 2), yyyy = str.slice(2)
    return new Date(`${yyyy}-${mm}-01`).getTime() || 0
  }
  if (str.length === 4) {  // YYYY
    return new Date(`${str}-01-01`).getTime() || 0
  }
  return 0
}

/**
 * Format a date string for display.
 * MMDDYYYY → "January 15, 1942"
 * MMYYYY   → "March 1942"
 * YYYY     → "1942"
 */
export function formatDateString(str) {
  if (!str) return ''
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  if (str.includes('-')) {
    const d = new Date(str)
    return isNaN(d) ? str : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  if (str.length === 8) {
    const mm = parseInt(str.slice(0, 2), 10) - 1
    const dd = parseInt(str.slice(2, 4), 10)
    const yyyy = str.slice(4)
    return `${months[mm]} ${dd}, ${yyyy}`
  }
  if (str.length === 6) {
    const mm = parseInt(str.slice(0, 2), 10) - 1
    const yyyy = str.slice(2)
    return `${months[mm]} ${yyyy}`
  }
  return str // YYYY or unknown
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function uid() {
  return `p${Date.now()}${Math.random().toString(36).slice(2, 6)}`
}
