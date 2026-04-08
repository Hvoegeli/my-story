const express = require('express')
const requireAuth = require('../middleware/auth')

const router = express.Router()

// POST /api/social/connect/facebook
// Handles OAuth callback from Facebook — exchanges code for access token,
// then fetches photos/posts and imports them as memories.
router.post('/connect/facebook', requireAuth, async (req, res) => {
  // TODO: implement Facebook OAuth + Graph API import
  res.json({ message: 'Facebook import coming soon' })
})

// POST /api/social/connect/instagram
router.post('/connect/instagram', requireAuth, async (req, res) => {
  // TODO: implement Instagram Basic Display API import
  res.json({ message: 'Instagram import coming soon' })
})

module.exports = router
