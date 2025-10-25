export const dynamic = 'force-static'
import fs, { promises } from "fs"
import path from "path"
import Cartographer from "@/components/cartographer"
import { combineAndDownload, getConsts, getDescriptionFromFaction } from "@/lib/utils"
import { Skull } from "lucide-react"
import Link from "next/link"

export default async function mapLobby({ params }) {
  const { map } = await params
  if (map === "favicon.ico") return
  if (map === "custom") {
    return <Cartographer name={map} fid={0} data={{ type: "FeatureCollection", features: [] }} />
  }

  if (map !== "warhammer" && map !== "fallout" && map !== "lancer" && map !== "lancer_starwall" && map !== "starwars" && map !== "alien" && map !== "cyberpunk") {
    console.log(`404 map "${map}"`)
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Skull className="animate-bounce mr-1" />
        <h1 className=" text-white">map "{map}" not found.</h1>
        <hr />
        <Link href="/" className="text-blue-400 ml-1">Go back.</Link>
      </div>
    )
  }

  // see bottom comment
  path.resolve(`app/[map]/topojson/fallout.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancer_starwall.json`)
  path.resolve(`app/[map]/topojson/starwars.json`)
  path.resolve(`app/[map]/topojson/warhammer.json`)
  path.resolve(`app/[map]/topojson/alien.json`)
  path.resolve('app/[map]/topojson/cyberpunk.json')

  let topojson
  try {
    const content = await promises.readFile(`app/[map]/topojson/${map}.json`, 'utf8')
    topojson = JSON.parse(content)
  } catch (error) {
    console.error(`404 map "${map}"`)
    return
  }
  const [noIdData, type] = combineAndDownload("geojson", topojson, {})
  const { IMPORTANT, UNIMPORTANT } = getConsts(map)

  let fid = 0
  const data = JSON.parse(noIdData)
  data.features.forEach(f => {
    if (IMPORTANT.includes(f.properties.type)) {
      if (f.geometry.type === "Point") {
        // symbol layer will show the lower key on top
        f.properties["symbol-sort-key"] = 10 - 8
      }
      f.properties.priority = 8
    } else if (UNIMPORTANT.includes(f.properties.type) && !f.properties.faction && !f.properties.description) {
      if (f.geometry.type === "Point") {
        // symbol layer will show the lower key on top
        f.properties["symbol-sort-key"] = 10 - 3
      }
      f.properties.priority = 3
    } else if (f.properties.type === "bg") {
      f.properties.priority = 2
    } else if (f.properties.type === "grid") {
      f.properties.priority = 2
    } else {
      f.properties.priority = 5
    }

    f.id = fid++
  })


  // add description
  data.features.forEach(f => {
    if ((getDescriptionFromFaction(map, f.properties.faction) && !f.properties.description && f.geometry.type.includes("Poly")) || f.properties.useNameToGetDesc) {
      f.properties.description = getDescriptionFromFaction(map, f.properties.useNameToGetDesc ? f.properties.name : f.properties.faction)
    }
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
