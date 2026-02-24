// warp-to-image-tps-to-topojson.mjs
import fs from "fs/promises"
import path from "path"
import * as topojsonClient from "topojson-client"
import { topology as topojsonTopology } from "topojson-server"

/**
 * INPUTS
 */
const INPUT_FILE = "../../app/[map]/topojson/junk.backupl.dnd.json"
const OUTPUT_FILE = "../../app/[map]/topojson/dnd.json"

/**
 * Your known map bounds (no padding)
 * format: [[left, bottom], [right, top]]
 */
const MAP_BOUNDS = [[-1.3734, -0.8696], [1.37315, 0.86925]]

/**
 * Stitched image size in pixels (set these to your *actual* image size)
 * If left null, inferred from max px in CONTROL_POINTS (+1).
 */
const IMAGE_WIDTH = 5872
const IMAGE_HEIGHT = 3718

/**
 * Control points:
 * - map: [x,y] in your current map coordinate space
 * - px:  [px,py] in image pixel space (x right, y down)
 */
const CONTROL_POINTS = [
  { name: "Uttersea", map: [-1.2288672363228765, 0.803404403653177], px: [553, 152] },
  { name: "Wyngate", map: [-0.7025106245340946, -0.4090107039348694], px: [1678, 2742] },
  { name: "Truvia", map: [-0.2640204764732531, -0.7396859440452876], px: [2615, 3450] },
  { name: "Mosstone", map: [0.016141602761522652, -0.8542100442872176], px: [3214, 3695] },
  { name: "Hlondeth", map: [1.0952428378100978, -0.8185619555321315], px: [5520, 3619] },
  { name: "Ilinvur", map: [1.1735647016442687, 0.2748272783690652], px: [5689, 1281] },
  { name: "Castle Hartwick", map: [0.31763866999413704, 0.8050885788804095], px: [3858, 148] },
  { name: "Bryn Shander", map: [-0.49196797981858165, 0.8067727534119913], px: [2127, 143] },
]

/**
 * TPS settings:
 * 0 = interpolate exactly; tiny >0 can reduce “wild bends”
 */
const TPS_LAMBDA = 0 // try 1e-6 or 1e-5 if needed

/**
 * TopoJSON output settings
 */
const TOPO_QUANTIZATION = 1e6 // higher = more precision, bigger file
const TOPO_LAYER_NAME = "location"

/* ----------------------------- */

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n)
}

function detectAndToFeatureCollection(obj) {
  if (!obj || typeof obj !== "object") throw new Error("Invalid JSON input")

  // TopoJSON -> GeoJSON FeatureCollection
  if (obj.type === "Topology") {
    const features = Object.values(obj.objects).flatMap((o) => {
      const f = topojsonClient.feature(obj, o)
      return f.type === "FeatureCollection" ? f.features : [f]
    })
    return { type: "FeatureCollection", features }
  }

  // GeoJSON passthrough / wrap
  if (obj.type === "FeatureCollection") return obj
  if (obj.type === "Feature") return { type: "FeatureCollection", features: [obj] }
  if (obj.coordinates || obj.geometries) {
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: obj }] }
  }

  throw new Error("Unsupported input type (expected Topology / FeatureCollection / Feature / Geometry).")
}

/**
 * Pixel -> map coordinate conversion
 * Image: origin top-left, y down.
 * Map: y up; bounds are [[left,bottom],[right,top]]
 */
function pxToMap([px, py], imgW, imgH, [[left, bottom], [right, top]]) {
  const x = left + (px / imgW) * (right - left)
  const y = top - (py / imgH) * (top - bottom)
  return [x, y]
}

/* -----------------------------
 * TPS implementation
 * ----------------------------- */

function U(r2) {
  if (r2 === 0) return 0
  return r2 * Math.log(r2)
}

function solveLinearSystem(A, b) {
  const n = A.length
  const M = A.map((row) => row.slice())
  const x = b.slice()

  for (let col = 0; col < n; col++) {
    let pivot = col
    let maxAbs = Math.abs(M[col][col])
    for (let row = col + 1; row < n; row++) {
      const v = Math.abs(M[row][col])
      if (v > maxAbs) {
        maxAbs = v
        pivot = row
      }
    }
    if (maxAbs === 0) {
      throw new Error("Singular matrix while solving TPS. Add TPS_LAMBDA or use better-spread control points.")
    }

    if (pivot !== col) {
      ;[M[col], M[pivot]] = [M[pivot], M[col]]
      ;[x[col], x[pivot]] = [x[pivot], x[col]]
    }

    const diag = M[col][col]
    for (let k = col; k < n; k++) M[col][k] /= diag
    x[col] /= diag

    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = M[row][col]
      if (factor === 0) continue
      for (let k = col; k < n; k++) M[row][k] -= factor * M[col][k]
      x[row] -= factor * x[col]
    }
  }

  return x
}

function buildTPS(srcPts, dstVals, lambda = 0) {
  const n = srcPts.length
  if (n < 3) throw new Error(`TPS needs at least 3 control points; got ${n}.`)

  const m = n + 3
  const L = Array.from({ length: m }, () => Array(m).fill(0))
  const Y = Array(m).fill(0)

  for (let i = 0; i < n; i++) {
    const [xi, yi] = srcPts[i]
    Y[i] = dstVals[i]

    L[i][n + 0] = 1
    L[i][n + 1] = xi
    L[i][n + 2] = yi

    for (let j = 0; j < n; j++) {
      const [xj, yj] = srcPts[j]
      const dx = xi - xj
      const dy = yi - yj
      const r2 = dx * dx + dy * dy
      L[i][j] = U(r2)
    }

    L[i][i] += lambda
  }

  for (let j = 0; j < n; j++) {
    const [xj, yj] = srcPts[j]
    L[n + 0][j] = 1
    L[n + 1][j] = xj
    L[n + 2][j] = yj
  }

  const coeff = solveLinearSystem(L, Y)
  const w = coeff.slice(0, n)
  const a0 = coeff[n + 0]
  const a1 = coeff[n + 1]
  const a2 = coeff[n + 2]

  return (x, y) => {
    let v = a0 + a1 * x + a2 * y
    for (let i = 0; i < n; i++) {
      const [xi, yi] = srcPts[i]
      const dx = x - xi
      const dy = y - yi
      const r2 = dx * dx + dy * dy
      v += w[i] * U(r2)
    }
    return v
  }
}

/* -----------------------------
 * Apply warp to GeoJSON coordinates
 * ----------------------------- */

function transformCoords(coords, fn) {
  if (!coords) return coords
  if (
    Array.isArray(coords) &&
    coords.length >= 2 &&
    isFiniteNumber(coords[0]) &&
    isFiniteNumber(coords[1])
  ) {
    const [x, y] = coords
    const [nx, ny] = fn(x, y)
    return coords.length > 2 ? [nx, ny, coords[2]] : [nx, ny]
  }
  if (Array.isArray(coords)) return coords.map((c) => transformCoords(c, fn))
  return coords
}

function applyWarpToFeatureCollection(fc, warpFn) {
  return {
    ...fc,
    features: fc.features.map((f) => ({
      ...f,
      geometry: f.geometry
        ? {
            ...f.geometry,
            coordinates: transformCoords(f.geometry.coordinates, (x, y) => warpFn(x, y)),
          }
        : f.geometry,
    })),
  }
}

/* -----------------------------
 * Main
 * ----------------------------- */

function fmt([a, b]) {
  return `[${a.toFixed(6)}, ${b.toFixed(6)}]`
}

async function main() {
  // deps hint
  // npm i topojson-client topojson-server

  const absIn = path.resolve(INPUT_FILE)
  const raw = JSON.parse(await fs.readFile(absIn, "utf8"))
  const fc = detectAndToFeatureCollection(raw)

  // Infer image size if not provided
  const maxPxX = Math.max(...CONTROL_POINTS.map((p) => p.px[0]))
  const maxPxY = Math.max(...CONTROL_POINTS.map((p) => p.px[1]))
  const imgW = IMAGE_WIDTH ?? (maxPxX + 1)
  const imgH = IMAGE_HEIGHT ?? (maxPxY + 1)

  // Build TPS mapping: current map -> "target map" (derived from pixels + bounds)
  const srcPts = CONTROL_POINTS.map((p) => p.map)
  const dstPts = CONTROL_POINTS.map((p) => pxToMap(p.px, imgW, imgH, MAP_BOUNDS))
  const fx = buildTPS(srcPts, dstPts.map((p) => p[0]), TPS_LAMBDA)
  const fy = buildTPS(srcPts, dstPts.map((p) => p[1]), TPS_LAMBDA)
  const warpFn = (x, y) => [fx(x, y), fy(x, y)]

  // Fit report
  let sum2 = 0
  console.log("\nControl point fit (map -> corrected map):")
  for (let i = 0; i < CONTROL_POINTS.length; i++) {
    const p = CONTROL_POINTS[i]
    const [tx, ty] = dstPts[i]
    const [wx, wy] = warpFn(p.map[0], p.map[1])
    const err = Math.hypot(wx - tx, wy - ty)
    sum2 += err * err
    console.log(`- ${p.name}: err=${err.toExponential(3)} target=${fmt([tx, ty])} got=${fmt([wx, wy])}`)
  }
  console.log(`RMSE: ${Math.sqrt(sum2 / CONTROL_POINTS.length)}\n`)

  // Warp all features
  const warpedGeoJSON = applyWarpToFeatureCollection(fc, warpFn)

  // Wrap into a single TopoJSON layer named "location"
  // topojson-server expects an object map: {name: GeoJSON}
  const topo = topojsonTopology(
    { [TOPO_LAYER_NAME]: warpedGeoJSON },
    TOPO_QUANTIZATION
  )

  await fs.mkdir(path.dirname(path.resolve(OUTPUT_FILE)), { recursive: true })
  await fs.writeFile(path.resolve(OUTPUT_FILE), JSON.stringify(topo) + "\n", "utf8")

  console.log("Input: ", absIn)
  console.log("Output:", path.resolve(OUTPUT_FILE))
  console.log("Image size used:", { width: imgW, height: imgH })
  console.log("Bounds:", MAP_BOUNDS)
  console.log("TPS_LAMBDA:", TPS_LAMBDA)
  console.log("Topo layer:", TOPO_LAYER_NAME)
  console.log("Topo quantization:", TOPO_QUANTIZATION)
  console.log("")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
