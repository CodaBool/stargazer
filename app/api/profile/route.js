import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]/route'
import { v7 as uuidv7 } from 'uuid'

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const body = await req.json()
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"

    if (body.refreshSecret) {
      const secret = uuidv7()
      await db.user.update({
        where: { id: user.id },
        data: { secret }
      })
      return Response.json({ secret })
    }

    await db.user.update({
      where: { id: user.id },
      data: { alias: body.alias }
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
