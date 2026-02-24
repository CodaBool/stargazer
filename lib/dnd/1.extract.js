(() => {
  if (!window.L) {
    console.warn("window.L not found (Leaflet not present).");
    return;
  }

  // ---------- helpers ----------
  const clamp = (s, n = 4000) =>
    typeof s === "string" && s.length > n ? s.slice(0, n) + "…(truncated)" : s;

  const htmlToText = (html) => {
    if (!html) return null;
    if (html instanceof HTMLElement) html = html.outerHTML;
    if (typeof html !== "string") return String(html);
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent?.replace(/\s+/g, " ").trim() || null;
  };

  // Extract "name" and "type" from popup HTML/text if the layer doesn't already have properties.
  function extractNameTypeFromPopup(popupContent) {
    if (!popupContent) return {};
    const raw = popupContent instanceof HTMLElement ? popupContent.outerHTML : String(popupContent);
    const text = htmlToText(raw) || "";

    const out = {};

    // Common patterns:
    // - <h3>Arabel</h3>
    // - Name: Arabel
    // - Type: cities
    // - <div class="name">Arabel</div>
    try {
      const div = document.createElement("div");
      div.innerHTML = raw;

      const nameEl =
        div.querySelector(".name, .title, h1, h2, h3, strong") ||
        null;

      const nameGuess = nameEl?.textContent?.trim() || null;
      if (nameGuess && nameGuess.length <= 80) out.name = nameGuess;

      // label: value scan
      const nodes = Array.from(div.querySelectorAll("li, p, div, span"));
      for (const el of nodes) {
        const t = el.textContent?.trim();
        if (!t) continue;

        const m = t.match(/^([A-Za-z0-9 _-]{2,40})\s*:\s*(.+)$/);
        if (!m) continue;

        const key = m[1].trim().toLowerCase();
        const val = m[2].trim();
        if (!val) continue;

        if (!out.name && (key === "name" || key.includes("location"))) out.name = val;
        if (!out.type && (key === "type" || key.includes("category"))) out.type = val;
      }

      // fallback: first short line in the popup text
      if (!out.name) {
        const first = text.split(" • ")[0].split("|")[0].split("\n")[0].trim();
        if (first && first.length <= 80) out.name = first;
      }
    } catch {}

    return out;
  }

  // Pull icon colors from common marker plugins.
  // - Leaflet.AwesomeMarkers: markerColor/iconColor in icon.options
  // - Leaflet-color-markers: iconUrl contains color
  // If none found, omit icon property (matches your example: only include when known).
  function extractIconColors(marker) {
    const icon = marker?.options?.icon;
    const opt = icon?.options || {};

    // AwesomeMarkers style
    const markerColor = opt.markerColor || opt.markercolor || null;
    const iconColor = opt.iconColor || opt.iconcolor || null;

    // Sometimes stored as actual hex in options (custom DivIcon)
    const hexMarker = (typeof markerColor === "string" && markerColor.trim().startsWith("#")) ? markerColor.trim() : null;
    const hexIcon = (typeof iconColor === "string" && iconColor.trim().startsWith("#")) ? iconColor.trim() : null;

    if (hexMarker || hexIcon) {
      return {
        markerColor: hexMarker || "#F7DC6F", // default-ish if only one provided
        iconColor: hexIcon || "#585858",
      };
    }

    // Some plugins store CSS colors, not hex; keep them anyway
    if (markerColor || iconColor) {
      return {
        markerColor: markerColor || "#F7DC6F",
        iconColor: iconColor || "#585858",
      };
    }

    // If iconUrl has a color hint, try to infer
    const iconUrl = opt.iconUrl || opt.iconRetinaUrl || null;
    if (typeof iconUrl === "string") {
      const m = iconUrl.match(/([0-9a-fA-F]{6})/);
      if (m) {
        return { markerColor: `#${m[1]}`, iconColor: "#585858" };
      }
    }

    return null;
  }

  // Try to find Leaflet map instances (works when map is not global).
  function findLeafletMaps() {
    const maps = [];
    const seen = new Set();

    // 1) scan window props for L.Map
    for (const k of Object.getOwnPropertyNames(window)) {
      try {
        const v = window[k];
        if (v && v instanceof L.Map && !seen.has(v)) {
          maps.push(v);
          seen.add(v);
        }
      } catch {}
    }
    if (maps.length) return maps;

    // 2) scan L object graph for L.Map whose container is a leaflet-container
    const containers = new Set(document.querySelectorAll(".leaflet-container"));
    const q = [{ obj: window.L, depth: 0 }];
    const visited = new Set();
    const MAX_DEPTH = 5;

    while (q.length) {
      const { obj, depth } = q.shift();
      if (!obj || typeof obj !== "object") continue;
      if (visited.has(obj)) continue;
      visited.add(obj);

      try {
        if (obj instanceof L.Map && obj._container && containers.has(obj._container)) {
          if (!seen.has(obj)) maps.push(obj), seen.add(obj);
        }
      } catch {}

      if (depth >= MAX_DEPTH) continue;
      for (const key of Object.keys(obj)) {
        try {
          const child = obj[key];
          if (child && typeof child === "object") q.push({ obj: child, depth: depth + 1 });
        } catch {}
      }
    }

    return maps;
  }

  // Collect markers from any layer recursively (LayerGroup/FeatureGroup/GeoJSON).
  function collectMarkersFromLayer(layer, out) {
    if (!layer) return;

    // If it's a marker, collect it
    if (layer instanceof L.Marker) {
      out.push(layer);
      return;
    }

    // GeoJSON layers typically are LayerGroups with internal layers
    if (layer instanceof L.LayerGroup || layer instanceof L.FeatureGroup || layer instanceof L.GeoJSON) {
      const children = layer.getLayers?.() || [];
      for (const child of children) collectMarkersFromLayer(child, out);
      return;
    }

    // Some custom layers still expose eachLayer
    if (typeof layer.eachLayer === "function") {
      try {
        layer.eachLayer((child) => collectMarkersFromLayer(child, out));
      } catch {}
    }
  }

  function markerToFeature(marker) {
    const ll = marker.getLatLng?.();
    if (!ll) return null;

    // Source properties: prefer GeoJSON feature.properties if present
    const baseProps = (marker.feature && marker.feature.properties && typeof marker.feature.properties === "object")
      ? { ...marker.feature.properties }
      : {};

    // popup-derived
    let popupContent = null;
    try {
      popupContent = marker.getPopup?.()?.getContent?.() ?? null;
    } catch {}

    const popupProps = extractNameTypeFromPopup(popupContent);

    // title/alt fallback
    const title = marker.options?.title || marker.options?.alt || null;

    // Normalize final name/type
    const name = baseProps.name || popupProps.name || title || null;
    const type = baseProps.type || baseProps.category || popupProps.type || null;

    // Icon colors if available
    const iconColors = extractIconColors(marker);

    const props = {};
    if (name) props.name = String(name);
    if (type) props.type = String(type).toLowerCase().replace(/\s+/g, "_");

    if (iconColors) props.icon = iconColors;

    // If you want to keep other useful fields, uncomment:
    // for (const [k, v] of Object.entries(baseProps)) {
    //   if (props[k] == null && v != null && typeof v !== "object") props[k] = v;
    // }

    return {
      type: "Feature",
      properties: props,
      geometry: {
        type: "Point",
        coordinates: [ll.lng, ll.lat],
      },
    };
  }

  // ---------- run ----------
  const maps = findLeafletMaps();
  if (!maps.length) {
    console.warn("Leaflet detected (window.L), but no L.Map instance found.");
    console.warn("If the map is created after load, try refreshing then re-running. If needed, hook L.map before reload.");
    return;
  }

  const features = [];
  const seenMarkers = new Set();

  for (const map of maps) {
    // Walk top-level layers
    const topLayers = [];
    try {
      map.eachLayer((l) => topLayers.push(l));
    } catch {}

    const markers = [];
    for (const l of topLayers) collectMarkersFromLayer(l, markers);

    for (const m of markers) {
      if (seenMarkers.has(m)) continue;
      seenMarkers.add(m);
      const f = markerToFeature(m);
      if (f && (f.properties?.name || f.properties?.type || f.properties?.icon)) {
        features.push(f);
      } else if (f) {
        // If you truly want ALL points even without props, push it:
        features.push(f);
      }
    }
  }

  const geojson = { type: "FeatureCollection", features };

  // ---------- output ----------
  console.log("Leaflet maps found:", maps.length);
  console.log("Features extracted:", features.length);

  // Helpful console preview: show name/type + coords
  console.table(
    features.slice(0, 50).map((f) => ({
      name: f.properties?.name || null,
      type: f.properties?.type || null,
      markerColor: f.properties?.icon?.markerColor || null,
      iconColor: f.properties?.icon?.iconColor || null,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }))
  );

  // Put the full GeoJSON on window so you can inspect / copy
  window.__leafletGeoJSON = geojson;

  // Copy to clipboard (works in Chromium devtools)
  try {
    copy(JSON.stringify(geojson, null, 2));
    console.log("GeoJSON copied to clipboard as window.__leafletGeoJSON");
  } catch {
    console.log("Could not copy automatically. Use: JSON.stringify(window.__leafletGeoJSON, null, 2)");
  }

  // Optional: download
  try {
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `leaflet-points-${Date.now()}.geojson`;
    a.click();
  } catch {}
})();
