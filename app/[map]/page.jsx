export const dynamic = 'force-static'
import fs, { promises } from "fs"
import path from "path"
import Cartographer from "@/components/cartographer"
import { combineAndDownload, getConsts } from "@/lib/utils"

export default async function mapLobby({ params }) {
  const { map } = await params
  if (map === "favicon.ico") return
  if (map === "custom") {
    return <Cartographer name={map} fid={0} data={{ type: "FeatureCollection", features: [] }} />
  }

  // see bottom comments
  path.resolve(`app/[map]/topojson/fallout.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancer_starwall.json`)
  path.resolve(`app/[map]/topojson/starwars.json`)
  path.resolve(`app/[map]/topojson/warhammer.json`)

  let topojson
  try {
    const content = await promises.readFile(`app/[map]/topojson/${map}.json`, 'utf8')
    topojson = JSON.parse(content)
  } catch (error) {
    console.error(`404 map "${map}"`)
    return
  }
  const [noIdData, type] = combineAndDownload("geojson", topojson, {})
  const { IMPORTANT } = getConsts(map)

  let fid = 0
  const data = JSON.parse(noIdData)
  data.features.forEach(f => {
    if (IMPORTANT.includes(f.properties.type)) {
      f.properties.priority = 1
    } else {
      f.properties.priority = 9
    }
    f.id = fid++
  })

  return <Cartographer data={data} name={map} fid={fid} />
}

export function generateStaticParams() {
  const dataDir = path.join(process.cwd(), "/app", "[map]", "topojson")
  const files = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)))
  return files.map(file => ({ slug: file }))
}


// follow this https://vercel.com/guides/loading-static-file-nextjs-api-route
//
// but there is this issue when trying static content
// google "nextjs static build process.cwd Error: ENOENT: no such file or directory, open /var/task"
