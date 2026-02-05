import db from "@/lib/db";
import { Check } from "lucide-react"
import Client from "./component.jsx"

export default async function RedeemPage({ searchParams }) {
  const params = await searchParams
  const { secret, world, salt } = params

  if (!secret || salt !== process.env.FOUNDRY_LINK_SECRET) return <p className="text-center mt-20"><Client msg="unauthorized" />unauthorized</p>
  const user = await db.user.findUnique({ where: { secret } })
  if (!user) return <p className="text-center mt-20"><Client msg="unauthorized" />unauthorized</p>
  if (user.premium) return <p className="text-center mt-20"><Client msg="Your account is already premium" />Your account is already premium</p>

  await db.user.update({
    where: { id: user.id },
    data: {
      premium: true,
      premiumGrantedAt: new Date(),
      foundryWorld: world,
    },
  })

  return (
    <div className="flex items-center justify-center min-h-[80vh] starfield flex-col text-2xl select-text">
      <Check className="animate-bounce" size={64} />
      <h1 className=" text-white">Premium Redeemed</h1>
      <Client msg="Premium Redeemed" />
    </div>
  )
}
