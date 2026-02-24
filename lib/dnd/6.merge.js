// merge-topojson-location-coords-dup-aware.mjs
import fs from "fs/promises"
import path from "path"
import * as topojsonClient from "topojson-client"
import { topology as topojsonTopology } from "topojson-server"

const INPUT_FILE_1 = "../../app/[map]/topojson/correct_coord.json" // correct coords + names
const INPUT_FILE_2 = "../../app/[map]/topojson/existing_topo.json" // bad coords + correct names + extra props
const OUTPUT_FILE = "../../app/[map]/topojson/dnd.json"

const LAYER = "location"
const NAME_KEY = "name"

// Optional: add secondary keys to help matching (only used for tie-break)
const SECONDARY_KEYS = ["type", "region", "faction"]

// Output topojson precision
const TOPO_QUANTIZATION = 1e6

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n)
}

function isString(x) {
  return typeof x === "string" && x.trim().length > 0
}

function normName(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

async function readJSON(file) {
  const abs = path.resolve(file)
  const raw = await fs.readFile(abs, "utf8")
  try {
    return JSON.parse(raw)
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${abs}\n${e?.message || e}`)
  }
}

function topoToFeatureCollection(topo, layerName) {
  assert(topo?.type === "Topology", "Input is not TopoJSON (missing type: Topology).")
  assert(topo.objects && topo.objects[layerName], `TopoJSON missing layer objects.${layerName}`)

  const obj = topo.objects[layerName]
  const out = topojsonClient.feature(topo, obj)
  if (out.type === "FeatureCollection") return out
  if (out.type === "Feature") return { type: "FeatureCollection", features: [out] }
  throw new Error(`Unexpected output from topojson.feature for layer "${layerName}": ${out?.type}`)
}

function ensurePointFeatures(fc, label) {
  const offenders = fc.features.filter((f) => f?.geometry?.type !== "Point")
  if (offenders.length === 0) return

  const sample = offenders
    .slice(0, 15)
    .map((f) => `- name="${f?.properties?.[NAME_KEY] ?? "(no name)"}" type=${f?.geometry?.type ?? "(no geom)"}`)
    .join("\n")
  throw new Error(`${label}: expected all features to be Point; found ${offenders.length} non-Point features.\n${sample}`)
}

function getPointXY(f, label) {
  const c = f?.geometry?.coordinates
  if (Array.isArray(c) && c.length !== 2) console.log("err", f?.properties?.name, c)
  assert(Array.isArray(c) && c.length >= 2, `${label}: invalid Point coordinates`)
  const x = c[0], y = c[1]
  assert(isFiniteNumber(x) && isFiniteNumber(y), `${label}: non-finite Point coordinates`)
  return [x, y]
}

function sqDist(a, b) {
  const dx = a[0] - b[0]
  const dy = a[1] - b[1]
  return dx * dx + dy * dy
}

function secondarySignature(props) {
  // Only for tie-break (low weight). Missing values become empty strings.
  return SECONDARY_KEYS.map((k) => String(props?.[k] ?? "").trim().toLowerCase()).join("|")
}

function buildMultiMapByName(fc, label) {
  const mm = new Map() // nameKey -> array of {feature, idx, xy, sec}
  for (let i = 0; i < fc.features.length; i++) {
    const f = fc.features[i]
    const name = f?.properties?.[NAME_KEY]
    assert(isString(name), `${label}: feature missing string properties.${NAME_KEY} at index ${i}`)

    const key = normName(name)
    const xy = getPointXY(f, label)
    const sec = secondarySignature(f.properties)

    if (!mm.has(key)) mm.set(key, [])
    mm.get(key).push({ feature: f, idx: i, xy, sec, rawName: name })
  }
  return mm
}

function keySet(m) {
  return new Set([...m.keys()])
}

function setDiff(a, b) {
  const out = []
  for (const k of a) if (!b.has(k)) out.push(k)
  return out
}

/**
 * Match duplicates within each name group:
 * - If counts mismatch: fail (no safe guess)
 * - Else solve assignment by greedy closest-distance, with small tie-break using secondary props.
 */
function matchGroup(nameKey, correctList, existingList) {
  if (correctList.length !== existingList.length) {
    const pretty = correctList[0]?.rawName ?? nameKey
    throw new Error(
      `Duplicate-count mismatch for "${pretty}" (normalized "${nameKey}"):\n` +
        `  correct:  ${correctList.length}\n` +
        `  existing: ${existingList.length}\n` +
        `Fix by renaming one side or removing extras.`
    )
  }

  // Build all candidate pair costs
  const pairs = []
  for (let i = 0; i < existingList.length; i++) {
    for (let j = 0; j < correctList.length; j++) {
      const e = existingList[i]
      const c = correctList[j]

      // Primary: geometric closeness (existing -> correct)
      let cost = sqDist(e.xy, c.xy)

      // Secondary: prefer matching same secondary signature (tiny bonus)
      if (e.sec && c.sec && e.sec === c.sec) cost *= 0.9

      pairs.push({ i, j, cost })
    }
  }

  // Greedy assignment by lowest cost first
  pairs.sort((a, b) => a.cost - b.cost)

  const usedE = new Set()
  const usedC = new Set()
  const assignment = new Map() // existing index i -> correct index j

  for (const p of pairs) {
    if (usedE.has(p.i) || usedC.has(p.j)) continue
    usedE.add(p.i)
    usedC.add(p.j)
    assignment.set(p.i, p.j)
    if (assignment.size === existingList.length) break
  }

  if (assignment.size !== existingList.length) {
    const pretty = correctList[0]?.rawName ?? nameKey
    throw new Error(`Could not fully assign duplicates for "${pretty}" (normalized "${nameKey}").`)
  }

  // Return array of matched pairs: {existingFeature, correctFeature}
  const out = []
  for (const [i, j] of assignment.entries()) {
    out.push({ existing: existingList[i], correct: correctList[j] })
  }
  return out
}

async function main() {
  const topoCorrect = await readJSON(INPUT_FILE_1)
  const topoExisting = await readJSON(INPUT_FILE_2)

  const fcCorrect = topoToFeatureCollection(topoCorrect, LAYER)
  const fcExisting = topoToFeatureCollection(topoExisting, LAYER)

  ensurePointFeatures(fcCorrect, "INPUT_FILE_1 (correct)")
  ensurePointFeatures(fcExisting, "INPUT_FILE_2 (existing)")

  const correctMM = buildMultiMapByName(fcCorrect, "INPUT_FILE_1 (correct)")
  const existingMM = buildMultiMapByName(fcExisting, "INPUT_FILE_2 (existing)")

  // Fail early if any name is missing entirely on either side
  const correctNames = keySet(correctMM)
  const existingNames = keySet(existingMM)

  const missingInExisting = setDiff(correctNames, existingNames)
  const missingInCorrect = setDiff(existingNames, correctNames)

  if (missingInExisting.length || missingInCorrect.length) {
    const lines = []
    if (missingInExisting.length) {
      lines.push(
        `Names present in correct but missing in existing (${missingInExisting.length}):\n` +
          missingInExisting.slice(0, 200).map((k) => `  - ${k}`).join("\n") +
          (missingInExisting.length > 200 ? `\n  ... (+${missingInExisting.length - 200} more)` : "")
      )
    }
    if (missingInCorrect.length) {
      lines.push(
        `Names present in existing but missing in correct (${missingInCorrect.length}):\n` +
          missingInCorrect.slice(0, 200).map((k) => `  - ${k}`).join("\n") +
          (missingInCorrect.length > 200 ? `\n  ... (+${missingInCorrect.length - 200} more)` : "")
      )
    }
    throw new Error("Name mismatch between inputs.\n\n" + lines.join("\n\n"))
  }

  // Build merged features:
  // - iterate over each name group in existing
  // - match to correct group (handles duplicates)
  // - rewrite geometry.coordinates from correct
  // - keep existing properties
  const mergedFeatures = []
  let dupGroups = 0

  for (const [nameKey, existingList] of existingMM.entries()) {
    const correctList = correctMM.get(nameKey)
    assert(correctList, `Internal error: missing correct group for ${nameKey}`)

    if (existingList.length > 1 || correctList.length > 1) dupGroups++

    const matches =
      existingList.length === 1
        ? [{ existing: existingList[0], correct: correctList[0] }]
        : matchGroup(nameKey, correctList, existingList)

    for (const { existing, correct } of matches) {
      const newCoords = correct.feature.geometry.coordinates.slice(0, 2)
      mergedFeatures.push({
        ...existing.feature,
        geometry: { type: "Point", coordinates: newCoords },
      })
    }
  }

  // Optional: stable output order by name (nice for diffs)
  mergedFeatures.sort((a, b) => normName(a?.properties?.[NAME_KEY]).localeCompare(normName(b?.properties?.[NAME_KEY])))

  const mergedFC = { type: "FeatureCollection", features: mergedFeatures }
  const outTopo = topojsonTopology({ [LAYER]: mergedFC }, TOPO_QUANTIZATION)

  const absOut = path.resolve(OUTPUT_FILE)
  await fs.mkdir(path.dirname(absOut), { recursive: true })
  await fs.writeFile(absOut, JSON.stringify(outTopo) + "\n", "utf8")

  console.log("✅ Merge complete (duplicate-aware)")
  console.log("Correct coords from:", path.resolve(INPUT_FILE_1))
  console.log("Extra props preserved from:", path.resolve(INPUT_FILE_2))
  console.log("Output:", absOut)
  console.log("Features:", mergedFeatures.length)
  console.log("Duplicate name groups matched:", dupGroups)
  console.log("Secondary tie-break keys:", SECONDARY_KEYS.join(", ") || "(none)")
}

main().catch((err) => {
  console.error("❌", err?.message || err)
  process.exit(1)
})
