import Stripe from 'stripe'
import { redirect } from "next/navigation";
import { Skull } from 'lucide-react'
import Link from 'next/link'
import db from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import WaitForPremium from './component';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function Return({ searchParams }) {
  const { session_id } = await searchParams
  if (!session_id) redirect("/")

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/?error=sign%20in%20to%20view%20receipt")

  let res = {}
  try {
    res = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent']
    })
    console.log("checkout results", res)
  } catch (err) {
    console.log("err", err)
    return <ErrorPage text={session_id} title="Invalid checkout session" />
  }

  if (res.status !== 'complete' || res.payment_status !== 'paid') {
    return <ErrorPage title="Payment not completed" text="The payment could not complete. Please try again." />
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } })
  if (!user) return <ErrorPage title="User not found" text="There is an issue with your account or session" />

  if (user.id !== res.client_reference_id) {
    return <ErrorPage title="Session mismatch" text={`Session for ${session?.user?.email} but purchase is for ${res.customer_details?.email}. Please sign into the correct account.`} />
  }

  return <WaitForPremium name={res.customer_details?.name} email={res.customer_details?.email} />
}


function ErrorPage({ title, text }) {
  return (
    <div className="flex items-center justify-center min-h-[80vh] starfield flex-col text-2xl select-text">
      <Skull className="animate-bounce" size={64} />
      <h1 className=" text-white">{title}</h1>
      <p className="text-gray-600 text-sm m-4">{text}</p>
      <Link href="/" className="text-blue-400">Go back</Link>
    </div>
  )
}
