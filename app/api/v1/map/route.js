// export const revalidate = 1200 // seconds before a MISS (1200 is 20 minutes)

import db from "@/lib/db"
// import { getServerSession } from "next-auth/next"
// import { authOptions } from '../../../auth/[...nextauth]/route'

export async function GET(req) {
  try {

    // check that the secret is valid
    const params = req.nextUrl.searchParams
    const secret = params.get('secret')
    if (!secret) return Response.json({ error: 'no secret' })
    const user = await db.user.findUnique({ where: { secret } })
    if (!user) return Response.json({ exists: false })
    return Response.json({ exists: true, alias: user.alias || user.email.split("@")[0] })
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
