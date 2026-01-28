'use client'

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { fetchClientSecret } from '@/app/checkout/util.js'

export default function Checkout({userId, userName, email}) {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY)
  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret: () => fetchClientSecret(userId, userName, email) }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
