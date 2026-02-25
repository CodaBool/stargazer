export const dynamic = "force-static" // treat as static output
import fs from "fs"
import { unstable_cache } from "next/cache"
import path from "path"


const SVG_FOLDERS = [
  "public/svg/alien",
  "public/svg/custom",
  "public/svg/cyberpunk",
  "public/svg/dnd",
  "public/svg/fallout",
  "public/svg/lancer",
  "public/svg/lancerStarwall",
  "public/svg/mothership",
  "public/svg/starwars",
  "public/svg/warhammer",
]

export async function GET(req, res) {
  try {
    const types = await getTypes()
    return Response.json(
      types,
      {
        // 7 day cache
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=604800",
        },
      },
    )
  } catch (error) {
    console.error("could not get types", error);
    return Response.json({ error }, { status: 500 });
  }
}

function filenameToType(filePath) {
  const base = path.basename(filePath, ".svg").trim()
  if (!base) return null
  return base
}

function walk(dir) {
  const out = []

  if (!fs.existsSync(dir)) return out

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      out.push(...walk(fullPath))
    } else {
      out.push(fullPath)
    }
  }

  return out
}

const getTypes = unstable_cache(
  async () => {
    const root = process.cwd()
    const allTypes = new Set()

    for (const folder of SVG_FOLDERS) {
      const abs = path.join(root, folder)

      const files = walk(abs).filter(f =>
        f.toLowerCase().endsWith(".svg"),
      )

      for (const file of files) {
        const type = filenameToType(file)
        if (type) allTypes.add(type)
      }
    }

    return [...allTypes].sort((a, b) => a.localeCompare(b))
  },
  ["location-types-v1"], // bump this if logic changes
  {
    revalidate: 604800, // 7 day
  },
)
