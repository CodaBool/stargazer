import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import db from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Checkout from "./component.jsx";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions)
  console.log("session", session)
  if (!session?.user?.email) redirect("/login?toast=Please%20sign%20in%20to%20continue&callbackUrl=/checkout")


  const user = await db.user.findUnique({ where: { email: session.user.email } });
  console.log("user", user)
  if (!user) redirect("/?error=user%20not%20found"); // or a /support page

  // already premium
  if (user.premium) redirect("/?error=you%20have%20already%20purchased%20stargazer");

  return <Checkout />
}
