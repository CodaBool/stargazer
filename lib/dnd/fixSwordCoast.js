// TODO: I needed to fix the image URLs, remove anything with "/revision" and after for the URL to work

// fix-dnd-types.mjs
import fs from "fs/promises";
import path from "path";

const INPUT_FILE = "../app/[map]/topojson/junk.dnd.bak.json"
const OUTPUT_FILE = "../app/[map]/topojson/dnd.json"

// ------------------ TYPE MAPPING ------------------
const TYPE_MAP = new Map(Object.entries({
  "Abandoned Settlement": "ruin",
  "Abandoned village": "ruin",
  "Abbey": "church",
  "Ancestral mound": "grave",
  "Badlands": "region",
  "Bay": "port",
  "Bog": "marsh",
  "Bridge": "bridge",
  "Bridge / Settlement": "bridge",
  "Burial mound": "grave",
  "Cantrev": "town",
  "Canyon": "region",
  "CanyonOasis": "region",
  "Capital": "city",
  "Capital Fortress": "castle",
  "Castle": "castle",
  "Cathedral": "temple",
  "Cave": "cave",
  "Caverns": "cave",
  "Caves": "cave",
  "City": "city",
  "City-State": "city",
  "City-state": "city",
  "City-stateFormerly: Ruined city": "city",
  "CityFormerly: ruin": "city",
  "CityKeep": "city",
  "Cliffs": "region",
  "Coastline": "region",
  "Collection of Icebergs": "region",
  "Colony": "settlement",
  "Crag": "region",
  "Creek": "river",
  "Crevasse": "region",
  "Crossing": "region",
  "Crypt": "grave",
  "Desert": "desert",
  "Druidic circle": "shrine",
  "Dump": "compound",
  "Dune field": "desert",
  "Dungeon": "dungeon",
  "Family holding": "compound",
  "Floodplains": "region",
  "Ford": "region",
  "Forest": "forest",
  "Forests": "forest",
  "Formerly: settlement": "settlement",
  "Formerly: village": "village",
  "Fort": "fortress",
  "Fortified City": "city",
  "Fortified compound": "compound",
  "Fortified town": "town",
  "Fortified villiage": "village",
  "Fortress": "fortress",
  "FortressRuins": "ruin",
  "Giant Steading": "compound",
  "Glacier": "region",
  "Gold mine": "mine",
  "Gorge": "region",
  "Grassland": "region",
  "Group of lakes": "lake",
  "Grove": "region",
  "Hamlet": "region",
  "Henge": "region",
  "Hill": "region",
  "Hills": "region",
  "Hot springs": "region",
  "Independent town": "town",
  "Inlet": "region",
  "Inn": "inn",
  "Island": "region",
  "Island settlement": "settlement",
  "Keep": "fortress",
  "Kingdom": "town",
  "Lagoon": "region",
  "Lake": "lake",
  "Landmark": "landmark",
  "Large town": "town",
  "Leaf farm": "farm",
  "LighthouseTemple": "temple",
  "Logging village": "village",
  "Manor": "manor",
  "Marsh": "marsh",
  "Marshland": "marsh",
  "Military Keep": "military",
  "Mining settlementCity-State": "mine",
  "Monastery": "church",
  "Monument": "monument",
  "Moor": "region",
  "Mountain": "mountain",
  "Mountain Range": "mountain",
  "Mountain pass": "mountain",
  "Mountain range": "mountain",
  "Mountains": "mountain",
  "Netherese enclave": "region",
  "Oasis": "region",
  "OasisMilitary outpost": "military",
  "OasisSettlement": "settlement",
  "Pass": "region",
  "Pasture": "farm",
  "Peaks": "mountain",
  "Peninsula": "region",
  "Plain": "region",
  "Plains": "region",
  "Range of hills and mountains": "mountain",
  "RavineCave complex": "cave",
  "Region": "region",
  "Rift": "region",
  "River": "river",
  "Roadhouse": "tavern",
  "Ruin": "ruin",
  "Ruined fortress": "ruin",
  "Ruined fortress ": "ruin",
  "Ruined manor": "ruin",
  "Ruined settlement": "ruin",
  "Ruined tomb": "ruin",
  "Ruined villa": "ruin",
  "Ruins": "ruin",
  "RuinsFormerly: Settlement": "ruin",
  "RuinsFormerly:Port city": "ruin",
  "Sea": "region",
  "Semi-extinct volcano": "region",
  "Settlement": "settlement",
  "Settlement / Abbey": "settlement",
  "SettlementFormerly: ruins": "settlement",
  "SettlementRuin": "ruin",
  "Settlment": "settlement",
  "Shelter": "settlement",
  "Shrine": "shrine",
  "Small City": "city",
  "Small city": "city",
  "Small town": "town",
  "Sound": "region",
  "Stone circle": "shrine",
  "Straight": "region",
  "Strait": "region",
  "Stream": "river",
  "Swamp": "marsh",
  "Temple": "temple",
  "Temple-fortress": "temple",
  "TempleFormerly: Fortress": "temple",
  "TempleFortress": "temple",
  "Tent": "camp",
  "Tomb": "grave",
  "Tower": "tower",
  "Town": "town",
  "TownFormerly: City": "town",
  "Tribe": "settlement",
  "Tundra": "region",
  "VIllageFormerly: Town": "village",
  "Valley": "region",
  "Villa": "manor",
  "Village": "village",
  "Village/port": "village",
  "Village/port ": "village",
  "VillageFormerly: Town": "village",
  "VillageFormerly: Town ": "village",
  "Volcanic island": "region",
  "Volcanic island ": "region",
  "Volcanic vents": "region",
  "Volcano": "region",
  "Volcanoes": "region",
  "Wall": "region",
  "Waterfall": "landmark",
  "Well": "region",
  "Wetlands": "marsh",
  "ancestor mound": "grave",
  "bridge2": "bridge",
  "canyon": "region",
  "canyon2": "region",
  "cave": "cave",
  "cities": "city",
  "depot": "depot",
  "desert": "desert",
  "farm": "farm",
  "forest": "forest",
  "fortress": "fortress",
  "fortresses": "fortress",
  "glacier": "region",
  "grass": "region",
  "keep": "city",
  "lake2": "lake",
  "landscape": "region",
  "library": "library",
  "marsh": "marsh",
  "medieval-house-3": "house",
  "mine": "mine",
  "mountains-3": "mountain",
  "oasis": "region",
  "protectorate": "town",
  "region": "region",
  "river": "river",
  "ruins": "ruin",
  "sea-waves": "region",
  "settlement": "settlement",
  "stones": "region",
  "street": "road",
  "swamp": "marsh",
  "taiga": "region",
  "temples": "temple",
  "tower2": "tower",
  "town": "region",
  "tree": "landmark",
  "village": "village",
  "waterfall": "landmark",

  // --------- NEW: exact-string unmapped values you listed ----------
  "Castle, keep": "castle",
  "Temple, fortress": "fortress",
  "Wall, ruins": "ruin",
  "Cathedral, library": "library",
  "Manor, ruins": "ruin",
  "Ruins, keep": "ruin",
  "Ruins, Formerly: settlement": "ruin",
  "Ruins, settlement": "ruin",
  "Bridge, village": "village",
  "Town, ruins": "ruin",
  "Town, Formerly: village": "town",
  "Village, mine": "village",
  "Fortified town, protectorate": "town",
  "Village, town": "village",
  "Roadhouse, depot": "depot",
  "Caverns, ancestor mound": "cave",
  "Druidic circle, forest": "forest",
  "Forest, taiga": "forest",
  "Swamp, marsh, forest": "marsh",
}));

function normalizeType(v) {
  return String(v ?? "").trim();
}

function mapType(oldType) {
  const key = normalizeType(oldType);
  if (!key) return { mapped: null, hit: false, key };
  if (TYPE_MAP.has(key)) return { mapped: TYPE_MAP.get(key), hit: true, key };
  return { mapped: null, hit: false, key };
}

// ------------------ WALKERS ------------------
function isGeoJSONFeatureCollection(json) {
  return json && json.type === "FeatureCollection" && Array.isArray(json.features);
}

function isTopoJSONTopology(json) {
  return json && json.type === "Topology" && json.objects && typeof json.objects === "object";
}

function walkTopoJSONGeometry(geom, onProperties) {
  if (!geom || typeof geom !== "object") return;

  if (geom.type === "GeometryCollection" && Array.isArray(geom.geometries)) {
    for (const g of geom.geometries) walkTopoJSONGeometry(g, onProperties);
    return;
  }

  if (geom.properties && typeof geom.properties === "object") {
    onProperties(geom.properties);
  }
}

function walkGeoJSON(json, onProperties) {
  for (const f of json.features) {
    if (f && f.properties && typeof f.properties === "object") onProperties(f.properties);
  }
}

// ------------------ MAIN ------------------
async function main() {
  const raw = await fs.readFile(INPUT_FILE, "utf8");
  const json = JSON.parse(raw);

  const stats = {
    totalWithType: 0,
    changed: 0,
    unchangedMappedSame: 0,
    missingOrEmpty: 0,
    unmapped: 0,
  };

  const seenOriginalTypes = new Map(); // type -> count
  const seenUnmappedTypes = new Map(); // type -> count
  const seenMappedTypes = new Map();   // mapped -> count

  const applyToProps = (props) => {
    if (!Object.prototype.hasOwnProperty.call(props, "type")) return;

    const original = props.type;
    const norm = normalizeType(original);

    if (!norm) {
      stats.missingOrEmpty++;
      return;
    }

    stats.totalWithType++;
    seenOriginalTypes.set(norm, (seenOriginalTypes.get(norm) ?? 0) + 1);

    const { mapped, hit } = mapType(norm);

    if (!hit) {
      stats.unmapped++;
      seenUnmappedTypes.set(norm, (seenUnmappedTypes.get(norm) ?? 0) + 1);
      return;
    }

    seenMappedTypes.set(mapped, (seenMappedTypes.get(mapped) ?? 0) + 1);

    if (mapped === norm) {
      stats.unchangedMappedSame++;
      return;
    }

    props.type = mapped;
    stats.changed++;
  };

  if (isGeoJSONFeatureCollection(json)) {
    walkGeoJSON(json, applyToProps);
  } else if (isTopoJSONTopology(json)) {
    for (const obj of Object.values(json.objects)) {
      walkTopoJSONGeometry(obj, applyToProps);
    }
  } else {
    throw new Error(
      `Unsupported JSON format. Expected GeoJSON FeatureCollection or TopoJSON Topology. Got: ${json?.type}`
    );
  }

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(json, null, 2), "utf8");

  console.log("✅ Done");
  console.log(`Input:  ${INPUT_FILE}`);
  console.log(`Output: ${OUTPUT_FILE}\n`);

  console.log("Stats:");
  console.log(`- Features/geoms with a non-empty type: ${stats.totalWithType}`);
  console.log(`- Changed:                          ${stats.changed}`);
  console.log(`- Already in mapped value:          ${stats.unchangedMappedSame}`);
  console.log(`- Missing/empty type:               ${stats.missingOrEmpty}`);
  console.log(`- Unmapped type values:             ${stats.unmapped}\n`);

  if (seenUnmappedTypes.size) {
    console.log("⚠️ Unmapped types found (value -> count):");
    for (const [k, v] of [...seenUnmappedTypes.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`- ${k} -> ${v}`);
    }
    console.log("");
  }

  console.log("Mapped output type counts (type -> count):");
  for (const [k, v] of [...seenMappedTypes.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`- ${k} -> ${v}`);
  }
}

main().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
