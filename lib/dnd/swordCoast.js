import fs from "fs/promises"
import path from "path"
import { featureCollection } from "@turf/helpers"
import { toMercator, toWgs84 } from "@turf/projection"

// --------------------
// 🔧 Controls
// --------------------

// IMPORTANT: SCALE = "meters per source unit" (because we map your planar coords into mercator meters)
const SCALE = 50 // try 10..500 depending on how spread your source coords are
const NEW_CENTER = [0, 0] // lon/lat placement target

// + moves right, - moves left
const LONGITUDE_SHIFT = 0.4809
// + moves up, - moves down
const LATITUDE_SHIFT = -0.2882

const INPUT_FILE = "../app/[map]/topojson/junk.dnd.bak.json"
const OUTPUT_FILE = "../app/[map]/topojson/dnd.json"

// --------------------
// helpers
// --------------------
const kindFromGeometryType = (t) => {
  const s = String(t || "").toLowerCase()
  if (s.includes("point")) return "point"
  if (s.includes("line")) return "linestring"
  if (s.includes("polygon")) return "polygon"
  return "unknown"
}

const toCommaList = (items = []) => {
  const clean = items
    .flatMap((x) => (typeof x === "string" ? x.split(",") : []))
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(clean)].join(", ")
}

const geometryKey = (geom) => `${geom?.type}:${JSON.stringify(geom?.coordinates)}`

// Remove null/undefined/empty-string keys (keeps false/0)
function compactProps(obj) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue
    if (typeof v === "string" && v.trim() === "") continue
    out[k] = v
  }
  return out
}

// Collect flat [x, y] pairs from any GeoJSON coordinates structure
function collectCoords(coords, all = []) {
  if (!coords) return all
  if (typeof coords[0] === "number") {
    all.push(coords)
  } else {
    coords.forEach((c) => collectCoords(c, all))
  }
  return all
}

function getCenterXY(features) {
  const all = []
  for (const f of features) collectCoords(f.geometry?.coordinates, all)
  const xs = all.map((c) => c[0])
  const ys = all.map((c) => c[1])
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ]
}

function transformCoords(coords, centerX, centerY, newX, newY, scale) {
  // coords is either [x,y] or nested arrays
  if (typeof coords[0] === "number") {
    const x = (coords[0] - centerX) * scale + newX
    const y = (coords[1] - centerY) * scale + newY
    return [x, y]
  }
  return coords.map((inner) => transformCoords(inner, centerX, centerY, newX, newY, scale))
}

function shiftCoords(coords) {
  if (typeof coords[0] === "number") {
    const [lon, lat] = coords
    return [lon + LONGITUDE_SHIFT, lat + LATITUDE_SHIFT]
  }
  return coords.map(shiftCoords)
}

// Reusable: print unique values (with counts) for quick sanity checks
function printUniqueSummary(label, values) {
  const counts = new Map()
  for (const v of values) {
    const key = v ?? "∅"
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

  console.log(`\n📌 Unique ${label}: ${sorted.length}`)
  for (const [k, c] of sorted) console.log(`  - ${String(k)}: ${c}`)
}

// Required-field error logger
function logMissingRequired({ layerMeta, layerIndex, featureIndex, feature }) {
  const p = feature?.properties || {}
  const geomType = feature?.geometry?.type || "unknown"
  const searchToken = `FIX_SWORDCOAST_REQUIRED layer=${layerIndex} feature=${featureIndex} leafletId=${layerMeta?.id ?? "?"}`

  console.error("❌ Missing required properties (name/type).", searchToken)
  console.error("   Layer meta:", {
    id: layerMeta?.id,
    type: layerMeta?.type,
    name: layerMeta?.name,
    tooltip: layerMeta?.tooltip,
  })
  console.error("   Feature:", {
    geometryType: geomType,
    propertiesKeys: Object.keys(p),
    name: p.name,
    type: p.type,
    search: p.search,
  })
  console.error("   Action: find this in the input JSON and fix the source data:", searchToken)
}

// --------------------
// Extract + Normalize (file-specific)
// --------------------
function normalizeFeature(srcFeature, layerMeta) {
  const p = srcFeature?.properties || {}
  const geom = srcFeature?.geometry
  if (!geom?.type) return null

  // REQUIRED
  const name = p.name || layerMeta?.tooltip || layerMeta?.name || null
  const type = p.type ?? null



  // Optional evidence
  const aliasCandidates = []
  if (typeof p.search === "string" && p.search.trim()) aliasCandidates.push(p.search.trim())
  if (typeof layerMeta?.tooltip === "string") {
    const tip = layerMeta.tooltip.trim()
    if (tip && tip !== name) aliasCandidates.push(tip)
  }
  const alias = aliasCandidates.length ? toCommaList(aliasCandidates) : undefined

  const props = compactProps({
    name, // required (validated later)
    type, // required (validated later)
    kind: kindFromGeometryType(geom.type),
    alias,
  })

  return {
    type: "Feature",
    geometry: geom,
    properties: props,
  }
}

// --------------------
// ✅ Correct projection for planar source coords
// (DO NOT toMercator(features) — your input isn't lon/lat)
// --------------------
function transformPlanarGeoJSONToEarth(fc, scaleMetersPerUnit, newCenterLonLat) {
  // Step 1: center in SOURCE space (planar units)
  const [centerX, centerY] = getCenterXY(fc.features)

  // Step 2: target center in MERCATOR METERS
  const [newX, newY] = toMercator({
    type: "Feature",
    geometry: { type: "Point", coordinates: newCenterLonLat },
    properties: {},
  }).geometry.coordinates

  // Step 3: translate + scale planar coords into mercator meters
  const mercatorish = fc.features.map((f) => ({
    ...f,
    geometry: {
      ...f.geometry,
      coordinates: transformCoords(
        f.geometry.coordinates,
        centerX,
        centerY,
        newX,
        newY,
        scaleMetersPerUnit
      ),
    },
  }))

  // Step 4: convert meter-space geometry back to lon/lat and shift
  const final = mercatorish.map((f) => {
    const reprojectedGeom = toWgs84(f.geometry) // expects mercator meters
    return {
      ...f,
      geometry: {
        ...reprojectedGeom,
        coordinates: shiftCoords(reprojectedGeom.coordinates),
      },
    }
  })

  return featureCollection(final)
}

// --------------------
// Main
// --------------------
async function run() {
  const raw = JSON.parse(await fs.readFile(path.resolve(INPUT_FILE), "utf8"))
  if (!Array.isArray(raw)) throw new Error("Expected top-level array in Leaflet export JSON.")

  const normalized = []
  const missing = []

  for (let layerIndex = 0; layerIndex < raw.length; layerIndex++) {
    const item = raw[layerIndex]
    const features = item?.geojson?.features
    if (!Array.isArray(features) || features.length === 0) continue

    const layerMeta = {
      id: item?.id ?? null,
      type: item?.type ?? null,
      tooltip: item?.tooltip ?? null,
      name: item?.name ?? null,
    }

    for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
      const nf = normalizeFeature(features[featureIndex], layerMeta)
      if (!nf) continue


      const hasName = typeof nf.properties?.name === "string" && nf.properties.name.trim()
      const hasType = typeof nf.properties?.type === "string" && nf.properties.type.trim()

      if (!hasName || !hasType) {
        missing.push({ layerMeta, layerIndex, featureIndex, feature: features[featureIndex] })
        continue
      }

      normalized.push(nf)
    }
  }

  if (missing.length) {
    for (const m of missing) logMissingRequired(m)
    console.error(`\n❌ Aborting: ${missing.length} features missing required name/type.`)
    process.exit(1)
  }

  // Dedupe by (geometry + name); merge alias
  const byKey = new Map()
  for (const f of normalized) {
    const key = `${geometryKey(f.geometry)}|${f.properties.name}`
    if (!byKey.has(key)) {
      byKey.set(key, f)
      continue
    }
    const prev = byKey.get(key)
    const a1 = prev.properties.alias ? prev.properties.alias.split(",").map((s) => s.trim()) : []
    const a2 = f.properties.alias ? f.properties.alias.split(",").map((s) => s.trim()) : []
    const merged = toCommaList([...a1, ...a2])
    if (merged) prev.properties.alias = merged
  }

  const fc = featureCollection([...byKey.values()])

  // ✅ Correct transform for planar input
  const transformed = transformPlanarGeoJSONToEarth(fc, SCALE, NEW_CENTER)

  // ---- post-ETL summaries ----
  // 2) print unique kinds (and counts) to verify if everything is "point"
  printUniqueSummary(
    "geometry kinds",
    transformed.features.map((f) => kindFromGeometryType(f.geometry?.type))
  )

  // 3) print unique feature "type" values (and counts)
  printUniqueSummary(
    "feature types (properties.type)",
    transformed.features.map((f) => f.properties?.type)
  )

  await fs.mkdir(path.dirname(path.resolve(OUTPUT_FILE)), { recursive: true })
  await fs.writeFile(path.resolve(OUTPUT_FILE), JSON.stringify(transformed, null, 2) + "\n", "utf8")

  console.log(`\n✅ Output written to ${OUTPUT_FILE}`)
  console.log(`   Features: ${transformed.features.length}`)
  console.log(
    `   SCALE(meters/unit)=${SCALE} NEW_CENTER=${JSON.stringify(NEW_CENTER)} SHIFT=[${LONGITUDE_SHIFT}, ${LATITUDE_SHIFT}]`
  )
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
