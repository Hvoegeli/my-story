require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const memoriesRoutes = require('./routes/memories')
const paymentRoutes = require('./routes/payment')
const socialRoutes = require('./routes/social')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/memories', memoriesRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/social', socialRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`My Story API running on port ${PORT}`)
})
