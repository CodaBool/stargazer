// prune-long-property.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const INPUT = "../../app/[map]/topojson/dnd.json";

// ====== CONFIG: change these two lines for any property ======
const PROPERTY_KEY = "alias"; // e.g. "source", "locations", "foo"
const MAX_LEN = 140;              // max allowed string length
// Optional: if you only want to prune when it's a string (default true)
const STRINGS_ONLY = true;
// =============================================================

// Resolve relative to this script file (so it works no matter where you run it from)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_ABS = path.resolve(__dirname, INPUT);

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

/**
 * Decide whether a property value should be deleted.
 * - If STRINGS_ONLY: deletes only when value is a string > MAX_LEN
 * - Else: coerces to string and compares length (useful if sometimes numbers/arrays)
 */
function shouldDeleteValue(val) {
  if (STRINGS_ONLY) {
    return typeof val === "string" && val.length > MAX_LEN;
  }
  if (val == null) return false;
  return String(val).length > MAX_LEN;
}

/**
 * TopoJSON geometries commonly have `properties` directly on each geometry.
 * This walks the whole structure and prunes `properties[PROPERTY_KEY]` when it matches.
 */
function pruneInPlace(root) {
  let prunedCount = 0;

  const walk = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (!isObject(node)) return;

    if (isObject(node.properties) && Object.prototype.hasOwnProperty.call(node.properties, PROPERTY_KEY)) {
      const val = node.properties[PROPERTY_KEY];
      if (shouldDeleteValue(val)) {
        delete node.properties[PROPERTY_KEY];
        prunedCount += 1;
      }
    }

    for (const key of Object.keys(node)) walk(node[key]);
  };

  walk(root);
  return prunedCount;
}

async function main() {
  const raw = await readFile(INPUT_ABS, "utf8");
  const topo = JSON.parse(raw);

  const pruned = pruneInPlace(topo);

  // pretty print so diffs are readable; change to JSON.stringify(topo) if you prefer compact
  await writeFile(INPUT_ABS, JSON.stringify(topo, null, 2), "utf8");

  console.log(
    `Done. Pruned properties.${PROPERTY_KEY} (>${MAX_LEN} chars) from ${pruned} feature(s).`
  );
  console.log(`Wrote: ${INPUT_ABS}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
