// bounds-topojson.mjs
import fs from "fs/promises"
import path from "path"
import * as topojson from "topojson-client"

const INPUT_FILE = "../../app/[map]/topojson/dnd.json"

// 🔧 Adjust this (0.03 = 3%)
const PADDING_PERCENT = 0.02

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n)
}

function updateBounds(bounds, lng, lat) {
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return
  if (lng < bounds.left) bounds.left = lng
  if (lng > bounds.right) bounds.right = lng
  if (lat < bounds.bottom) bounds.bottom = lat
  if (lat > bounds.top) bounds.top = lat
}

function walkCoords(coords, bounds) {
  if (!coords) return

  if (
    Array.isArray(coords) &&
    coords.length >= 2 &&
    isFiniteNumber(coords[0]) &&
    isFiniteNumber(coords[1])
  ) {
    updateBounds(bounds, coords[0], coords[1])
    return
  }

  if (Array.isArray(coords)) {
    for (const c of coords) walkCoords(c, bounds)
  }
}

function boundsForGeoJSON(geojson) {
  const bounds = {
    left: Infinity,
    bottom: Infinity,
    right: -Infinity,
    top: -Infinity,
  }

  function walkGeometry(geom) {
    if (!geom) return
    if (geom.type === "GeometryCollection") {
      for (const g of geom.geometries || []) walkGeometry(g)
      return
    }
    walkCoords(geom.coordinates, bounds)
  }

  function walkAny(node) {
    if (!node || typeof node !== "object") return
    switch (node.type) {
      case "FeatureCollection":
        for (const f of node.features || []) walkAny(f)
        break
      case "Feature":
        walkGeometry(node.geometry)
        break
      default:
        if (node.coordinates || node.geometries) walkGeometry(node)
        break
    }
  }

  walkAny(geojson)

  if (bounds.left === Infinity) {
    throw new Error("No valid coordinates found in TopoJSON.")
  }

  return bounds
}

function applyPadding(bounds, percent) {
  const width = bounds.right - bounds.left
  const height = bounds.top - bounds.bottom

  const padX = width * percent
  const padY = height * percent

  return {
    left: bounds.left - padX,
    bottom: bounds.bottom - padY,
    right: bounds.right + padX,
    top: bounds.top + padY,
  }
}

async function main() {
  const abs = path.resolve(INPUT_FILE)
  const raw = JSON.parse(await fs.readFile(abs, "utf8"))

  if (raw.type !== "Topology") {
    throw new Error("Input file is not TopoJSON (missing type: Topology).")
  }

  // Convert ALL objects in the topology to one FeatureCollection
  const geoFeatures = Object.values(raw.objects).flatMap((obj) => {
    const fc = topojson.feature(raw, obj)
    return fc.type === "FeatureCollection" ? fc.features : [fc]
  })

  const geojson = {
    type: "FeatureCollection",
    features: geoFeatures,
  }

  const baseBounds = boundsForGeoJSON(geojson)
  const padded = applyPadding(baseBounds, PADDING_PERCENT)

  const mapLibreBounds = [
    [padded.left, padded.bottom],
    [padded.right, padded.top],
  ]

  console.log("\nCopy into MapLibre config:\n")
  console.log(JSON.stringify(mapLibreBounds, null, 2))
  console.log("")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
