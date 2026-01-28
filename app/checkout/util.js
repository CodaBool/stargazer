'use server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function fetchClientSecret(userId, userName, email) {
  const origin = (await headers()).get('origin')
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [{
      price: process.env.PRICE_ID,
      quantity: 1,
    }],
    mode: 'payment',
    return_url: `${origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { userId, userName, email },
    client_reference_id: userId,
  })

  return session.client_secret
}
