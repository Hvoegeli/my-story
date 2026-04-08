const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { PrismaClient } = require('@prisma/client')
const requireAuth = require('../middleware/auth')

const router = express.Router()
const prisma = new PrismaClient()

const ONE_TIME_PRICE = 2900 // $29.00 in cents

// POST /api/payment/checkout — create Stripe checkout session
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'My Story — Lifetime Access',
            description: 'One-time purchase. Unlimited memories, exports, and collaborators forever.',
          },
          unit_amount: ONE_TIME_PRICE,
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/scrapbook?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/?payment=cancelled`,
      metadata: { userId: req.user.userId },
    })
    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create checkout session' })
  }
})

// POST /api/payment/webhook — Stripe webhook to mark user as paid
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return res.status(400).send('Webhook signature verification failed')
  }

  if (event.type === 'checkout.session.completed') {
    const { userId } = event.data.object.metadata
    await prisma.user.update({
      where: { id: userId },
      data: { isPaid: true },
    })
  }

  res.json({ received: true })
})

module.exports = router
