import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { ArrowLeft, Check, Skull } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import db from "@/lib/db"
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function Return({ searchParams }) {
  const { session_id } = await searchParams
  if (!session_id) return <ErrorPage title="Missing checkout session id" />

  const session = await getServerSession(authOptions)
  if (!session) return <ErrorPage title="Unauthorized" />

  let res
  try {
    res = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent']
    })

    // res.id
    // res.amount_total // Number
    // res.created // Number
    // res.customer_details.email // string
    // res.customer_details.name // string
    // res.line_items.data[0] // obj
    // res.livemode // boolean
    // res.metadata // my metadata
    // res.payment_intent.id // string
    // res.payment_intent.status // ["succeeded"]

    console.log("checkout results", res)
  } catch (err) {
    console.log("err", err)
    return <ErrorPage text={session_id} title="Invalid checkout session" />
  }

  if (res.status === 'open') {
    return redirect('/')
  }


  if (res.status === 'complete') {

    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) return <ErrorPage title="User not found" text="There is an issue with your account or session" />


    console.log("user should have premium, verify that from logs", user)
    console.log("!! verify !!", user, res?.metadata, res.client_reference_id)

    return (
      <div className='starfield'>
        <Card className="mx-auto my-8 max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle><Check className='inline' /> Purchase Complete</CardTitle>
              <Link href="/">
                <Button variant="ghost">
                  <ArrowLeft />
                </Button>
              </Link>
            </div>
            <CardDescription>Your premium account is now active.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-3xl space-y-6">
              <p>Thank you <b>{res?.customer_details?.name || ""}</b> for your purchase!</p>
              <p className="text-gray-200">You can now upload an unlimited number of maps. Without any time limitations.</p>
              <hr />
              <p>
                A confirmation email will be sent to{' '}
                <b>{res?.customer_details?.email || ""}</b>. If you have any questions, please email:{' '}
              </p>
              <p className='text-center'><a href={`mailto:${process.env.NEXT_PUBLIC_EMAIL}`}>{process.env.NEXT_PUBLIC_EMAIL}</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  return <ErrorPage title="could not complete purchase" />
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
