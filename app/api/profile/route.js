import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../auth/[...nextauth]/route'
import { v7 as uuidv7 } from 'uuid'
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})


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
      data: { name: body.name }
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) throw "unauthorized"
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) throw "there is an issue with your account or session"
    return Response.json({ user })
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

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) throw "unauthorized"
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) throw "user not found"
    if (user.id === "anonymous") throw "no Guy"

    const maps = await db.map.findMany({
      where: { userId: user.id },
      select: { id: true },
    })
    const mapKeys = maps.map(m => m.id)

    await db.$transaction(async tx => {
      // Reassign comments authored by this user OR on their locations
      await tx.comment.updateMany({
        where: { userId: user.id },
        data: {
          userId: "anonymous",
        },
      })

      // Reassign locations owned by this user
      await tx.location.updateMany({
        where: { userId: user.id },
        data: {
          userId: "anonymous",
        },
      })

      // Delete the user
      await tx.user.delete({
        where: { id: user.id },
      })

      // R2 cleanup
      if (mapKeys.length > 0) {
        await s3.send(new DeleteObjectsCommand({
          Bucket: "maps",
          Delete: {
            Objects: mapKeys.map(Key => ({ Key })),
          },
        }))
      }
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
