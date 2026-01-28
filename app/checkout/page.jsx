import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Checkout from "./component.jsx";

export default async function CheckoutPage() {
  // console.log("env check", {price: process.env.PRICE_ID, secret: process.env.STRIPE_SECRET_KEY, public: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY, wh: process.env.STRIPE_SECRET_WEBHOOK})

  const session = await getServerSession(authOptions)
  // console.log("session", session)
  if (!session?.user?.email) redirect("/login?toast=Please%20sign%20in%20to%20continue&callbackUrl=/checkout")


  const user = await db.user.findUnique({ where: { email: session.user.email } });
  // console.log("user", user)
  if (!user) redirect("/?error=user%20not%20found"); // or a /support page

  // already premium
  if (user.premium) redirect("/?error=you%20have%20already%20purchased%20stargazer");

  return <Checkout userId={user.id} userName={user.name} email={user.email} />
}
