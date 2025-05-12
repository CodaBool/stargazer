export const dynamic = 'force-static'
import fs from "fs"
import path from "path"
import Cartographer from "@/components/cartographer"
import { combineAndDownload, important } from "@/lib/utils"

export default async function mapLobby({ params }) {
  const dataDir = path.join(process.cwd(), "/app", "[map]", "topojson");

  const { map } = await params
  const filePath = path.join(dataDir, `${map}.json`)
  if (map === "favicon.ico") return
  const content = await fs.promises.readFile(filePath, 'utf8')

  // WARN: for some reason a path.resolve is needed here otherwise it cannot find the file
  // even if its just in a console log
  path.resolve(`app/[map]/topojson/mousewars.json`)
  path.resolve(`app/[map]/topojson/postwar.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancer_starwall.json`)
  const topojson = JSON.parse(content)

  const [noIdData, type] = combineAndDownload("geojson", topojson, {})

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

  return <Cartographer data={data} name={map} fid={fid} />
}

export async function generateStaticParams() {
  const dataDir = path.join(process.cwd(), "/app", "[map]", "topojson")
  const files = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)))
  return files.map(file => ({ slug: file }))
}


// follow this https://vercel.com/guides/loading-static-file-nextjs-api-route
//
// but there is this issue when trying static content
// google "nextjs static build process.cwd Error: ENOENT: no such file or directory, open /var/task"
