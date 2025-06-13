import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import SettingsForm from "@/components/forms/settings"
import CloudSettingsForm from "@/components/forms/settingsCloud"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getServerSession } from "next-auth"
import db from "@/lib/db"
import { getConsts } from "@/lib/utils"
import { redirect } from "next/navigation"

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})

export default async function mapLobby({ params }) {
  const { map, id } = await params
  if (id.length === 36) {
    const session = await getServerSession(authOptions)
    const user = session ? await db.user.findUnique({ where: { email: session.user.email } }) : null
    if (!user) redirect('/')
    const cloud = await db.map.findUnique({
      where: {
        userId: user.id,
        id,
      },
    })
    if (!cloud) redirect('/')
    const command = new GetObjectCommand({
      Bucket: "maps",
      Key: id,
      ResponseContentType: "application/json",
    })
    const response = await s3.send(command)
    // Read stream to buffer
    const r2Obj = await response.Body?.transformToString();
    if (!r2Obj) redirect('/')
    const data = JSON.parse(r2Obj)
    const config = data.config
    const DEFAULTS = getConsts(map)
    // TODO: verify this works the way I think it does
    if (config.STYLE && config.STYLE !== DEFAULTS.STYLE) {
      console.log("found unique", Object.keys(config.STYLE).length)
      // style can be large, don't pass the full STYLE
      config.STYLE = true
    }
    return <CloudSettingsForm map={map} id={id} data={cloud} config={config} />
  }
  return <SettingsForm map={map} id={id} />
}
