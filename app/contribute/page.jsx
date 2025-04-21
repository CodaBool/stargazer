import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route.js"
import { redirect } from "next/navigation"
import db from "@/lib/db"

export default async function Page({ searchParams }) {
  const session = await getServerSession(authOptions)
  const p = await searchParams
  if (session && !p.map) redirect('/')

  if (p.map && p.x && p.y && p.name) {
    const location = await db.location.findMany({
      where: {
        coordinates: `${p.x},${p.y}`,
        map: p.map,
        name: p.name,
      },
    })
    // console.log("params", p, "locations", location)
    if (location.length === 1) {
      redirect(`/contribute/${p.map}/${location[0].id}`)
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
        </div>
      )
    }
  }

  return (
    <div className="flex items-center flex-col mt-[30vh]">
      <p className="max-w-xl my-8 text-center p-2">To contribute, we'll have to authenticate you. This is done through magic links. All you need to provide is your email.</p>
      <Link href="/api/auth/signin">
        <Button className="cursor-pointer">Enter Email</Button >
      </Link >
    </div>
  )
}
