// enrich-swordcoast-from-fandom.mjs
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JSDOM } from "jsdom";

// ================== CONFIG ==================
const INPUT_GEOJSON = "../app/[map]/topojson/junk.dnd.bak.json"
const OUTPUT_GEOJSON = "../app/[map]/topojson/dnd.json"

const API_BASE = "https://forgottenrealms.fandom.com/api.php";
const MAP_BASE_URL = "https://forgottenmaps.web.app/map/";
const REQUEST_DELAY_MS = 500;
const MAX_FEATURES = 9999999

// If you want to keep existing values instead of overwriting, set this true
const PRESERVE_EXISTING_PROPERTIES = false;

// Known map slugs (match by feature.properties.name)
const KNOWN_MAP_SLUGS = new Set([
  "Arabel",
  "Athkatla",
  "Baldur's%20Gate",
  "Berdusk",
  "Bremen",
  "Bryn%20Shander",
  "Caer-Dineval",
  "Caer-Konig",
  "Calimport",
  "Candlekeep",
  "Corellon's%20Grove",
  "Daerlun",
  "Daggerford",
  "Dougan's%20Hole",
  "Drelagara",
  "Easthaven",
  "Elion",
  "Evermeet",
  "Faerun",
  "Fort%20Beluarian",
  "Good%20Mead",
  "Icewind%20Dale",
  "Kara-Tur",
  "Leilon",
  "Leuthilspar",
  "Lonelywood",
  "Longsaddle",
  "Luskan",
  "Mulhorand",
  "Neverwinter",
  "Nimlith",
  "Port%20Nyanzaru",
  "Ruith",
  "Saerloon",
  "Scornubel",
  "Selgaunt",
  "Silverymoon",
  "Skuld",
  "Skullport",
  "Stormwreck%20Isle",
  "Suzail",
  "Sword%20Coast",
  "Taltempla",
  "Targos",
  "Termalaine",
  "Teziir",
  "Toril",
  "Ty'athalael",
  "Urmlaspyr",
  "Waterdeep",
  "Westgate",
]);

// ================== UTILS ==================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function logMissingRequired(feature, reason) {
  const hint = feature?.properties?.name
    ? `name="${feature.properties.name}"`
    : `coords=${JSON.stringify(feature?.geometry?.coordinates)}`;
  console.error(`❌ Missing required field (${reason}) for feature: ${hint}`);
}

function setIfValue(obj, key, value) {
  if (value === undefined || value === null) return;
  const v = typeof value === "string" ? value.trim() : value;
  if (typeof v === "string" && !v) return;
  obj[key] = v;
}

// Decode HTML entities by letting DOM parse it
function decodeHtmlEntities(str) {
  if (!str) return "";
  const dom = new JSDOM(`<!doctype html><body>${str}</body>`);
  return dom.window.document.body.textContent ?? "";
}

// Remove citation-ish bracket numbers like [2] and also artifacts that can show up
function stripCitationsText(str) {
  if (!str) return "";
  const decoded = decodeHtmlEntities(str);
  return decoded
    .replace(/\[\s*\d+\s*]/g, "") // [2]
    .replace(/\(\s*\d+\s*\)/g, "") // (2)
    .replace(/\s+/g, " ")
    .trim();
}

// For list items like "Name: blah" OR "Name, blah" OR just "Name"
function extractNameOnly(text) {
  const t = stripCitationsText(text || "");
  if (!t) return "";
  const idxColon = t.indexOf(":");
  const idxComma = t.indexOf(",");
  if (idxColon !== -1) return t.slice(0, idxColon).trim();
  if (idxComma !== -1) return t.slice(0, idxComma).trim();
  return t.trim();
}

function getHeadlineText(headerEl) {
  if (!headerEl) return "";
  const span = headerEl.querySelector(".mw-headline");
  return (span?.textContent || headerEl.textContent || "").trim();
}

function removeUnwantedInlineTags(container, tags) {
  tags.forEach((tag) => {
    container.querySelectorAll(tag).forEach((el) => {
      const text = el.textContent || "";
      el.replaceWith(container.ownerDocument.createTextNode(text));
    });
  });
}

function removeElements(container, selectors) {
  selectors.forEach((sel) => {
    container.querySelectorAll(sel).forEach((el) => el.remove());
  });
}

function minimalDescriptionHtml(document) {
  const aside = document.querySelector("aside");
  let node = aside
    ? aside.parentElement?.nextElementSibling
    : document.body.firstElementChild;

  const ps = [];
  while (node) {
    if (node.tagName === "H2") break;
    if (node.tagName === "P") ps.push(node);
    node = node.nextElementSibling;
  }

  if (!ps.length) return null;

  const wrap = document.createElement("div");
  ps.forEach((p) => wrap.appendChild(p.cloneNode(true)));

  removeElements(wrap, [
    "sup.reference",
    ".reference",
    ".cite-bracket",
    "table",
    "figure",
    "noscript",
    "style",
    "script",
  ]);

  // remove anchors/spans and also remove i/b/strong/small per your request
  removeUnwantedInlineTags(wrap, ["a", "span", "i", "b", "strong", "small"]);

  wrap.querySelectorAll("p").forEach((p) => {
    const txt = stripCitationsText(p.textContent || "");
    p.textContent = txt;
  });

  const html = wrap.innerHTML
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  return html || null;
}

function infoboxValue(document, dataSourceKey) {
  const el = document.querySelector(
    `[data-source="${dataSourceKey}"] .pi-data-value`
  );
  if (!el) return null;
  const text = stripCitationsText(el.textContent || "");
  return text || null;
}

// Some pages use data-source="type" (common) but you specifically want "Type" too.
// We'll treat them as equivalent and also allow a label-based fallback.
function infoboxType(document) {
  // Preferred: data-source="type"
  let t = infoboxValue(document, "type");
  if (t) return t;

  // Fallback: find a pi-item with label "Type" (case-insensitive)
  // const candidates = [...document.querySelectorAll(".pi-item.pi-data")];
  // for (const item of candidates) {
  //   const label = item.querySelector(".pi-data-label")?.textContent || "";
  //   if (label.trim().toLowerCase() === "type") {
  //     const v = item.querySelector(".pi-data-value")?.textContent || "";
  //     console.log("type select", v)
  //     t = stripCitationsText(v);
  //     if (t) return t;
  //   }
  // }
  return null;
}

function infoboxAliases(document) {
  const el = document.querySelector(`[data-source="aliases"] .pi-data-value`);
  if (!el) return null;

  const parts = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map((s) => stripCitationsText(s))
    .map((s) => s.trim())
    .filter(Boolean);

  return parts.length ? parts.join(", ") : null;
}

function infoboxImageAndCaption(document) {
  const fig = document.querySelector("figure.pi-item.pi-image");
  if (!fig) return {};

  const img = fig.querySelector("img");
  const cap = fig.querySelector("figcaption");
  const image = img?.getAttribute("src") || null;
  const caption = cap ? stripCitationsText(cap.textContent || "") : null;

  const out = {};
  if (image) out.image = image;
  if (caption) out.caption = caption;
  return out;
}

// Collect names under a given H2 section until next H2, scanning UL + DL/DT.
function collectBetweenH2(document, startH2Texts) {
  let start = null;
  for (const wanted of startH2Texts) {
    start = [...document.querySelectorAll("h2")].find(
      (h2) =>
        getHeadlineText(h2).toLowerCase() === wanted.toLowerCase()
    );
    if (start) break;
  }
  if (!start) return [];

  const items = [];
  let node = start.nextElementSibling;

  while (node) {
    if (node.tagName === "H2") break;

    if (node.tagName === "UL") {
      node.querySelectorAll("li").forEach((li) => {
        const name = extractNameOnly(li.textContent);
        if (name) items.push(name);
      });
    }

    if (node.tagName === "DL") {
      node.querySelectorAll("dt").forEach((dt) => {
        const name = extractNameOnly(dt.textContent);
        if (name) items.push(name);
      });
    }

    node = node.nextElementSibling;
  }

  return items;
}

// ================== SOURCES (APPEARANCES) ==================
function sectionSources(document) {
  const headline =
    document.querySelector(`.mw-headline#Appearances`) ||
    [...document.querySelectorAll(".mw-headline")].find(
      (s) => (s.textContent || "").trim() === "Appearances"
    );

  if (!headline) return null;

  const startHeader = headline.closest("h2,h3,h4,h5,h6");
  if (!startHeader) return null;

  const seen = new Set();
  let node = startHeader.nextElementSibling;

  while (node) {
    // STOP at next H2
    if (node.tagName === "H2") break;

    // ALSO STOP if we hit a header (any level) named "References"
    if (node.tagName && /^H[1-6]$/.test(node.tagName)) {
      const ht = getHeadlineText(node).toLowerCase();
      if (ht === "references") break;
    }

    node.querySelectorAll?.("a").forEach((a) => {
      const t = stripCitationsText(a.textContent || "");
      if (t) seen.add(t);
    });

    node = node.nextElementSibling;
  }

  return seen.size ? [...seen].join(", ") : null;
}

// ================== MAPS ==================
function mapsLinkForName(name) {
  if (!name) return null;
  const slug = KNOWN_MAP_SLUGS.has(name) ? name : encodeURIComponent(name);
  if (!KNOWN_MAP_SLUGS.has(slug)) return null;
  return `${MAP_BASE_URL}${slug}`;
}

// ================== API FETCH ==================
async function fetchParseHtml(pageTitle) {
  const url = new URL(API_BASE);
  url.searchParams.set("page", pageTitle);
  url.searchParams.set("action", "parse");
  url.searchParams.set("prop", "text");
  url.searchParams.set("redirects", "true");
  url.searchParams.set("format", "json");
  url.searchParams.set("origin", "*");
  url.searchParams.set("disablelimitreport", "true");
  url.searchParams.set("disableeditsection", "true");
  url.searchParams.set("disabletoc", "true");
  url.searchParams.set("disablestylededuplication", "true");

  const res = await fetch(url.toString(), {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${pageTitle}`);
  const json = await res.json();
  const html = json?.parse?.text?.["*"];
  return [html, json?.parse?.title] || [null, null];
}

// ================== EXTRACTION ==================
function extractFieldsFromHtml(html, locationName) {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const out = {};

  const infoboxName = infoboxValue(document, "name");
  if (infoboxName) setIfValue(out, "name", infoboxName);

  // ✅ TYPE: gather from infobox "Type" (data-source="type" / label fallback)
  // This will be used to override geojson properties.type if present.
  const type = infoboxType(document);
  if (type) setIfValue(out, "type", type);

  const alias = infoboxAliases(document);
  if (alias) setIfValue(out, "alias", alias);

  const region = infoboxValue(document, "region");
  if (region) setIfValue(out, "region", region);

  const img = infoboxImageAndCaption(document);
  if (img.image) setIfValue(out, "image", img.image);
  if (img.caption) setIfValue(out, "caption", img.caption);

  const description = minimalDescriptionHtml(document);
  if (description) setIfValue(out, "description", description);

  const source = sectionSources(document);
  if (source) setIfValue(out, "source", source);

  // LOCATIONS
  const locationCandidates = [
    "Locations",
    "Notable Locations",
    "Notable locations",
    "Notable Places",
    "Notable places",
    "Landmarks",
    "Places of Interest",
    "Places of interest",
    "Places",
  ];

  const locSet = new Set();
  for (const title of locationCandidates) {
    const items = collectBetweenH2(document, [title]);
    items.forEach((n) => {
      const cleaned = extractNameOnly(n);
      if (cleaned) locSet.add(cleaned);
    });
  }
  if (locSet.size) setIfValue(out, "locations", [...locSet].join(", "));

  // PEOPLE
  const peopleCandidates = [
    "Notable Inhabitants",
    "Notable inhabitants",
    "Important Figures",
    "Important figures",
  ];
  const peopleSet = new Set();
  for (const title of peopleCandidates) {
    const items = collectBetweenH2(document, [title]);
    items.forEach((n) => {
      const cleaned = extractNameOnly(n);
      if (cleaned) peopleSet.add(cleaned);
    });
  }

  const chief = infoboxValue(document, "chief");
  if (chief) {
    chief
      .split(/[,•]/g)
      .map((s) => extractNameOnly(s))
      .filter(Boolean)
      .forEach((n) => peopleSet.add(n));
  }

  if (peopleSet.size) setIfValue(out, "people", [...peopleSet].join(", "));

  // MAPS (based on your list)
  const nm = out.name || infoboxName || locationName;
  const maps = mapsLinkForName(nm);
  if (maps) setIfValue(out, "maps", maps);

  return out;
}

// ================== MERGE HELPERS ==================
function mergeProperties(oldProps, newProps) {
  const merged = { ...(oldProps || {}) };

  for (const [k, v] of Object.entries(newProps || {})) {
    if (
      PRESERVE_EXISTING_PROPERTIES &&
      merged[k] !== undefined &&
      merged[k] !== null &&
      String(merged[k]).trim() !== ""
    ) {
      continue;
    }
    merged[k] = v;
  }

  for (const [k, v] of Object.entries(merged)) {
    if (v === null || v === undefined) delete merged[k];
    else if (typeof v === "string" && !v.trim()) delete merged[k];
  }

  return merged;
}

// ================== MAIN ==================
async function main() {
  const inputPath = path.resolve(__dirname, INPUT_GEOJSON);
  const outputPath = path.resolve(__dirname, OUTPUT_GEOJSON);

  const raw = await fs.readFile(inputPath, "utf8");
  const geo = JSON.parse(raw);

  if (!geo?.features?.length) {
    console.error("❌ No features found in INPUT_GEOJSON:", INPUT_GEOJSON);
    process.exit(1);
  }

  let processed = 0;

  for (const feature of geo.features) {
    if (processed >= MAX_FEATURES) break;

    const props = feature.properties || {};
    const pageTitle = props?.name;

    if (!pageTitle) {
      logMissingRequired(feature, "name (properties.name)");
      continue;
    }

    try {
      console.log(`🌐 Fetching: ${pageTitle}`);
      const [html, title] = await fetchParseHtml(pageTitle);
      if (!html) {
        console.warn(`⚠️ No HTML returned for "${pageTitle}"`);
        processed++;
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      const extracted = extractFieldsFromHtml(html, title);

      const requiredName = extracted.name || pageTitle;

      // ✅ Type from HTML ("Type" infobox) replaces geojson type if present
      const htmlType = extracted.type || null;

      if (!requiredName) logMissingRequired(feature, "extracted.name");

      const finalProps = {};

      // Required outputs
      finalProps.name = requiredName;

      // If we got a type from HTML, always set it; otherwise keep existing
      if (htmlType) finalProps.type = htmlType;
      else if (props.type) finalProps.type = props.type;

      // Optional outputs (no nulls)
      for (const k of [
        "faction",
        "locations",
        "description",
        "alias",
        "image",
        "caption",
        "people",
        "source",
        "unofficial",
        "region",
        "maps",
      ]) {
        if (
          extracted[k] !== undefined &&
          extracted[k] !== null &&
          String(extracted[k]).trim() !== ""
        ) {
          finalProps[k] = extracted[k];
        }
      }

      feature.properties = mergeProperties(feature.properties, finalProps);

      processed++;
      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.error(`❌ Failed for "${pageTitle}":`, err?.message || err);
      processed++;
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(geo, null, 2), "utf8");
  console.log("✅ Wrote:", OUTPUT_GEOJSON);
}

main().catch((e) => {
  console.error("❌ Fatal:", e?.message || e);
  process.exit(1);
});
