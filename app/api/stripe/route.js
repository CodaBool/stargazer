import Stripe from "stripe";
import { headers } from "next/headers";
import db from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  try {
    const sig = (await headers()).get("stripe-signature");
    if (!sig) throw "missing signature"
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_SECRET_WEBHOOK)

    if (event.type !== "checkout.session.completed") {
      console.log("unhandled stripe event", event.type)
      return Response.json({ ok: true })
    }

    const { id, payment_intent, client_reference_id, customer_details } = event.data.object
    await db.user.update({
      where: { id: client_reference_id },
      data: {
        premium: true,
        premiumGrantedAt: new Date(),
        stripePayment: payment_intent,
        stripeSession: id,
        stripeEmail: customer_details.email,
        stripeName: customer_details.name,
      },
    })

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
