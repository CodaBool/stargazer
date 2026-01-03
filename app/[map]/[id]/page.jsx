export const revalidate = 300 // seconds before a MISS (300 is 5 minutes)
import fs from "fs"
import path from "path"
import Cartographer from "@/components/cartographer"
import GeneratingError from "@/components/generatingError"
import db from "@/lib/db"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { redirect } from "next/navigation"
import { combineAndDownload, getConsts } from "@/lib/utils"
import { Skull } from "lucide-react"
import Link from "next/link"
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CF_ACCESS_ID,
    secretAccessKey: process.env.CF_ACCESS_SECRET,
  },
})

/*
  This route is similar to /app/[map]/page.jsx
  but it combines the remote R2 data with the map for a fully published preview
  it uses caching defined by the revalidate property at the top
*/

// TODO: should do some sort of try catch here
export default async function mapLobby({ params }) {
  const { map, id } = await params
  const isUUID = id.length === 36

  if (!isUUID) {
    // catch bots
    return <GeneratingError map={map} error="bad uuid" mapdId={id} />
  }

  const mapDB = await db.map.findUnique({
    where: { id },
  })

  // 404
  if (isUUID && !mapDB) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] starfield flex-col text-2xl select-text">
        <Skull className="animate-bounce" size={64} />
        <h1 className=" text-white"><span className="text-green-300">{map}</span> map not found</h1>
        <p className="text-gray-600">{id}</p>
        <Link href="/" className="text-blue-400">Go back</Link>
      </div>
    )
  }

  // TODO: should there be a way to see unpublished maps?
  if (!mapDB?.published) {
    return redirect(`/${map}`)
  }

  const command = new GetObjectCommand({
    Bucket: "maps",
    Key: id,
    ResponseContentType: "application/json",
  })
  const response = await s3.send(command)


  // Read stream to buffer
  const r2Obj = await response.Body?.transformToString();
  if (!r2Obj) {
    return <GeneratingError map={map} error="file not found" />
  }
  let obj = JSON.parse(r2Obj)

  // add a userCreated prop for better contribute links
  obj.geojson.features = obj.geojson.features.map(feature => {
    feature.properties.userCreated = true;
    return feature;
  })

  const dataDir = path.join(process.cwd(), "app", "[map]", "topojson");
  const filePath = path.join(dataDir, `${map}.json`)

  // TODO: verify that this is still needed
  fs.readdirSync(dataDir).forEach(file => {
    path.resolve(`app/[map]/topojson/${file}`)
  })

  let geojson
  if (map === "custom") {
    geojson = obj.geojson
  } else {
    const content = await fs.promises.readFile(filePath, 'utf8')
    const topojson = JSON.parse(content)
    const [noIdData, type] = combineAndDownload("geojson", topojson, obj.geojson)
    geojson = JSON.parse(noIdData)
  }

  const { IMPORTANT } = getConsts(map)

  let fid = 0
  geojson.features.forEach(f => {
    if (IMPORTANT.includes(f.properties.type)) {
      f.properties.priority = 1
    } else {
      f.properties.priority = 9
    }
    f.id = fid++
  })

  return <Cartographer data={geojson} remoteConfig={obj.config || {}} name={map} fid={fid} uuid={id} />
}
