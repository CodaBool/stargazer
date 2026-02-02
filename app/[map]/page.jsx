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
  const iconIndex = generateIconIdList(map)
  if (map === "custom") {
    return <Cartographer name={map} fid={0} data={{ type: "FeatureCollection", features: [] }} iconIndex={iconIndex} />
  }

  // 404
  if (map !== "warhammer" && map !== "fallout" && map !== "lancer" && map !== "lancerStarwall" && map !== "starwars" && map !== "alien" && map !== "cyberpunk" && map !== "mothership" && map !== "dnd") {
    // console.log(`404 map "${map}"`)
    return (
      <div className="flex items-center justify-center min-h-[80vh] starfield flex-col text-2xl select-text">
        <Skull className="animate-bounce" size={64} />
        <h1 className=" text-white"><span className="text-green-300">{map}</span> map not found</h1>
        <Link href="/" className="text-blue-400">Go back</Link>
      </div>
    )
  }

  // see bottom comment
  path.resolve(`app/[map]/topojson/fallout.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancerStarwall.json`)
  path.resolve(`app/[map]/topojson/starwars.json`)
  path.resolve(`app/[map]/topojson/warhammer.json`)
  path.resolve(`app/[map]/topojson/alien.json`)
  path.resolve('app/[map]/topojson/cyberpunk.json')
  path.resolve('app/[map]/topojson/mothership.json')
  path.resolve('app/[map]/topojson/dnd.json')

  let topojson
  try {
    const content = await promises.readFile(`app/[map]/topojson/${map}.json`, 'utf8')
    topojson = JSON.parse(content)
  } catch (error) {
    console.error(`404 map "${map}"`)
    return
  }
  const [noPriority, type] = combineAndDownload("geojson", topojson, {})
  const { IMPORTANT, UNIMPORTANT } = getConsts(map)

  const data = JSON.parse(noPriority)
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
  })


  // add description
  data.features.forEach(f => {
    if ((getDescriptionFromFaction(map, f.properties.faction) && !f.properties.description && f.geometry.type.includes("Poly")) || f.properties.useNameToGetDesc) {
      f.properties.description = getDescriptionFromFaction(map, f.properties.useNameToGetDesc ? f.properties.name : f.properties.faction)
    }
  })

  return <Cartographer data={data} name={map} iconIndex={iconIndex} />
}

export function generateIconIdList(mapName) {
  const root = process.cwd()

  const MAIN_SVG_FOLDERS = [
    "public/svg/fontawesome",
    "public/svg/lucide",
    "public/svg/foundry",
  ]

  const mainIndex = [];
  const mapIndex = [];


  // ---------- main folders ----------
  for (const folder of MAIN_SVG_FOLDERS) {
    const absDir = path.join(root, folder);
    if (!fs.existsSync(absDir)) continue;

    const prefix = path.basename(folder);

    const files = fs.readdirSync(absDir, { withFileTypes: true });
    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".svg")) continue;

      const name = path.basename(file.name, ".svg");
      mainIndex.push(`${prefix}-${name}`);
    }
  }

  // ---------- map-specific folder ----------
  const mapDir = path.join(root, `public/svg/${mapName}`);

  if (fs.existsSync(mapDir)) {
    const files = fs.readdirSync(mapDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".svg")) continue;

      const name = path.basename(file.name, ".svg")
      mapIndex.push(name);
    }
  }

  return [
    mainIndex.sort(),
    mapIndex.sort(),
  ];
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
