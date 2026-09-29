import db from "@/lib/db";

export default async function RedeemPage({ searchParams }) {
  const params = await searchParams
  const { secret, world, salt } = params

  if (!secret || salt !== process.env.FOUNDRY_LINK_SECRET) return <p className="text-center mt-20"><Client msg="unauthorized" />unauthorized</p>
  const user = await db.user.findUnique({ where: { secret } })
  if (!user) return <p className="text-center mt-20"><Client msg="unauthorized" />unauthorized</p>
  if (user.premium) return <p className="text-center mt-20"><Client msg="Your account is already premium" />Your account is already premium</p>

  return (
    <div className="flex items-center justify-center min-h-[80vh] starfield flex-col text-2xl select-text">
      <h1 className=" text-white">Premium redemption no longer supported</h1>
      <p className=" text-white">Due to switching to a FOSS (free and open source) model, free Stargazer premium can no longer be awarded from the module</p>
    </div>
  )
}
