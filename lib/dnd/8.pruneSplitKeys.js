import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const INPUT = "../../app/[map]/topojson/dnd.json";
const MAX_LEN = 20;

// Resolve relative to script location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INPUT_ABS = path.resolve(__dirname, INPUT);

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function prunePeople(root) {
  let removedCount = 0;

  const walk = (node) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (!isObject(node)) return;

    if (
      isObject(node.properties) &&
      typeof node.properties.people === "string"
    ) {
      const original = node.properties.people;

      const cleaned = original
        .split(",")
        .map(s => s.trim())
        .filter(entry => {
          const keep = entry.length <= MAX_LEN && entry.length > 0;
          if (!keep) removedCount++;
          return keep;
        });

      node.properties.people = cleaned.join(",");
    }

    Object.values(node).forEach(walk);
  };

  walk(root);
  return removedCount;
}

async function main() {
  const raw = await readFile(INPUT_ABS, "utf8");
  const topo = JSON.parse(raw);

  const removed = prunePeople(topo);

  await writeFile(INPUT_ABS, JSON.stringify(topo, null, 2), "utf8");

  console.log(`Removed ${removed} over-length people entries.`);
  console.log(`Updated file: ${INPUT_ABS}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
