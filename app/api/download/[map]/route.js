import { readFile } from "fs/promises"
import path from "path"
import { feature } from 'topojson-client'
import { toKML } from '@placemarkio/tokml'

export async function GET(req, { params }) {
  const dataDir = path.join(process.cwd(), "/app", "[map]", "topojson")
  const { map } = await params

  const url = new URL(req.url)
  const urlParams = new URLSearchParams(url.search)
  const format = urlParams.get('format') || "topo"

  const filePath = path.join(dataDir, `${map}.json`)
  let buffer = await readFile(filePath)

  if (format === "geo") {
    buffer = toGeojson(buffer)
  } else if (format === "kml") {
    buffer = toGeojson(buffer)
    buffer = JSON.parse(buffer)
    buffer = toKML(buffer)
  }

  path.resolve(`app/[map]/topojson/fallout.json`)
  path.resolve(`app/[map]/topojson/lancer.json`)
  path.resolve(`app/[map]/topojson/lancer_starwall.json`)

  const headers = new Headers()
  if (format === "kml") {
    headers.append("Content-Disposition", `attachment; filename="${map}.${format}"`)
    headers.append("Content-Type", "application/vnd.google-earth.kml+xml")
  } else {
    headers.append("Content-Disposition", `attachment; filename="${map}.${format}.json"`)
    headers.append("Content-Type", "application/json")
  }
  return new Response(buffer, {
    headers,
  })
}

function toGeojson(topo) {
  const topojson = JSON.parse(topo.toString())

  // Iterate over each layer and convert to GeoJSON
  const combinedFeatures = Object.keys(topojson.objects).reduce((features, key) => {
    const geojsonLayer = feature(topojson, topojson.objects[key]);

    // If it's a FeatureCollection, merge its features; otherwise, push the single feature.
    if (geojsonLayer.type === "FeatureCollection") {
      return features.concat(geojsonLayer.features);
    } else {
      features.push(geojsonLayer);
      return features;
    }
  }, [])

  return JSON.stringify({
    type: "FeatureCollection",
    features: combinedFeatures
  })
}
