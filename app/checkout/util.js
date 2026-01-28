'use server'
import { headers } from 'next/headers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function fetchClientSecret() {
  const origin = (await headers()).get('origin')

  // Create Checkout Sessions from body params.
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    line_items: [
      {
        // Provide the exact Price ID (for example, price_1234) of
        // the product you want to sell
        price: process.env.PRICE_ID,
        quantity: 1



      }
    ],
    mode: 'payment',
    return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
    metadata: { userId: user.id },
    client_reference_id: user.id,
  })

  return session.client_secret
}
