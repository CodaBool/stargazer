// export const revalidate = 1200 // seconds before a MISS (1200 is 20 minutes)

import db from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from '../../../auth/[...nextauth]/route'
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})

export async function GET(req) {
  try {
    // const session = await getServerSession(authOptions)
    // if (!session) throw "unauthorized"
    const id = req.nextUrl.pathname.split('/').pop()
    // const params = req.nextUrl.searchParams
    // const id = params.get('id')
    // const user = await db.user.findUnique({ where: { email: session.user.email } })
    // if (!user) throw "there is an issue with your account or session"
    const map = await db.map.findUnique({
      where: { id },
    })
    if (!map) throw "nonexistant"
    if (!map.published) throw "unauthorized"

    // TODO: should allow for anyone to GET if published

    const command = new GetObjectCommand({
      Bucket: "maps",
      Key: id,
      ResponseContentType: "application/json",
    })
    const response = await s3.send(command)


    // Read stream to buffer
    const r2Obj = await response.Body?.transformToString();

    if (!r2Obj) throw 'file not found'
    if (!response.Metadata.map) throw 'map does not have the required metadata'

    const data = JSON.parse(r2Obj)

    return Response.json(data)
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
