const express = require('express')
const { PrismaClient } = require('@prisma/client')
const requireAuth = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/memories — get all memories for authenticated user
router.get('/', requireAuth, async (req, res) => {
  try {
    const memories = await prisma.memory.findMany({
      where: { userId: req.user.userId },
      orderBy: { date: 'desc' },
    })
    res.json(memories)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/memories — create a memory
router.post('/', requireAuth, async (req, res) => {
  const { type, src, caption, text, date, locationCity, locationState, locationCountry, locationLat, locationLng, note, source, milestone } = req.body
  try {
    const memory = await prisma.memory.create({
      data: {
        userId: req.user.userId,
        type,
        src,
        caption,
        text,
        date: date ? new Date(date) : null,
        locationCity,
        locationState,
        locationCountry,
        locationLat,
        locationLng,
        note,
        source: source || 'manual',
        milestone,
      },
    })
    res.status(201).json(memory)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/memories/:id — update note/date/location
router.patch('/:id', requireAuth, async (req, res) => {
  const { note, date, locationCity, locationState, locationCountry, milestone } = req.body
  try {
    const memory = await prisma.memory.updateMany({
      where: { id: req.params.id, userId: req.user.userId },
      data: {
        ...(note !== undefined && { note }),
        ...(date && { date: new Date(date) }),
        ...(locationCity && { locationCity }),
        ...(locationState && { locationState }),
        ...(locationCountry && { locationCountry }),
        ...(milestone !== undefined && { milestone }),
      },
    })
    res.json(memory)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/memories/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.memory.deleteMany({
      where: { id: req.params.id, userId: req.user.userId },
    })
    res.json({ success: true })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
