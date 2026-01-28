import Stripe from "stripe";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  try {

    const sig = (await headers()).get("stripe-signature");
    if (!sig) throw "missing signature"


    const body = await req.text();

    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_SECRET_WEBHOOK)

    if (event.type !== "checkout.session.completed") throw "unhandled event type " + event.type
    const session = event.data.object
    const userId = (session.metadata?.userId) ?? (session.client_reference_id)

    if (!userId) return NextResponse.json({ ok: true });

    const checkoutSessionId = session.id;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    const paid = (session.payment_status === "paid");
    if (!paid) return NextResponse.json({ ok: true })


    console.log("success let's update user with", {
      premium: true,
      premiumGrantedAt: new Date(),
      stripeCheckoutSessionId: checkoutSessionId,
      stripePaymentIntentId: paymentIntentId ?? undefined,
      stripeCustomerId: customerId ?? undefined,
    })

    await db.user.update({
      where: { id: userId },
      data: {
        premium: true,
        premiumGrantedAt: new Date(),
        stripeCheckoutSessionId: checkoutSessionId,
        stripePaymentIntentId: paymentIntentId ?? undefined,
        stripeCustomerId: customerId ?? undefined,
      },
    });



    // const session = await getServerSession(authOptions)
    // if (!session) throw "unauthorized"
    // const body = await req.json()
    // const user = await db.user.findUnique({ where: { email: session.user.email } })
    // if (!user) throw "there is an issue with your account or session"
    return Response.json({ msg: "success" })
  } catch (error) {
    console.error(error)
    if (typeof error === 'string') {
      return Response.json({ error }, { status: 400 })
    } else if (typeof error?.message === "string") {
      return Response.json({ error: error.message }, { status: 500 })
    } else {
      return Response.json(error, { status: 500 })
    }
  }
}
