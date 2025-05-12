export const revalidate = 300 // seconds before a MISS (300 is 5 minutes)
import fs from "fs"
import path from "path"
import Cartographer from "@/components/cartographer"
import GeneratingError from "@/components/generatingError"
import CustomForm from "@/components/forms/custom"
import db from "@/lib/db"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { redirect } from "next/navigation"
import { combineAndDownload, important } from "@/lib/utils"
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

  if (map === "custom" && id === "form") {
    return <CustomForm />
  }

  const isUUID = id.length === 36

  if (!isUUID) {
    // catch bots
    return <GeneratingError map={map} error="bad uuid" mapdId={id} />
  }

  const mapDB = await db.map.findUnique({
    where: { id },
  })
  if (isUUID && !mapDB) {
    // probably a new map that's not in the cache yet

  }
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
  const clientGeojson = await response.Body?.transformToString();
  if (!clientGeojson) {
    return <GeneratingError map={map} error="file not found" />
  }
  let geojson = JSON.parse(clientGeojson)

  // add a userCreated prop for better contribute links
  geojson.features = geojson.features.map(feature => {
    feature.properties.userCreated = true;
    return feature;
  })

  const dataDir = path.join(process.cwd(), "/app", "[map]", "topojson");
  const filePath = path.join(dataDir, `${map}.json`)

  // WARN: for some reason a path.resolve is needed here otherwise it cannot find the file
  path.resolve(`app/[map]/topojson/mousewars.json`)
  path.resolve(`app/[map]/topojson/postwar.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancer_starwall.json`)
  const content = await fs.promises.readFile(filePath, 'utf8')

  const topojson = JSON.parse(content)

  const [noIdData, type] = combineAndDownload("geojson", topojson, geojson)

  let fid = 0
  const data = JSON.parse(noIdData)
  data.features.forEach(f => {
    if (important(map, f.properties)) {
      f.properties.priority = 1
    } else {
      f.properties.priority = 9
    }
    f.id = fid++
  })

  return <Cartographer data={data} name={map} fid={fid} stargazer />
}
