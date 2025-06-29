const testing = false; // Toggle this to false for production-size GeoJSON

function extractFromPopup(html) {
  const div = document.createElement('div');
  div.innerHTML = html;

  const getText = (selector) => {
    const el = div.querySelector(selector);
    return el ? el.textContent.trim() : null;
  };

  const clean = (label, value) => {
    if (!value || typeof value !== 'string') return null;
    value = value.trim();

    if (label === 'breadcrumb') {
      return value.replace(/^location:\s*/i, '');
    }
    if (label === 'faction') {
      return value.replace(/^factions:\s*/i, '');
    }
    if (label === 'type' && value.toLowerCase() === 'planet') {
      return 'terrestrial';
    }
    return value || null;
  };

  const getLabeledValue = (label) => {
    const all = div.querySelectorAll('li, div, span, p');
    for (let el of all) {
      const text = el.textContent.trim();
      if (text.toLowerCase().startsWith(label.toLowerCase() + ":")) {
        return text.replace(new RegExp(label + ":", "i"), "").trim();
      }
    }
    return null;
  };

  const getSchemaValue = (schemaLabel) => {
    const pairs = div.querySelectorAll('[itemscope][itemtype*="PropertyValue"]');
    for (const pair of pairs) {
      const name = pair.querySelector('[itemprop="name"]')?.textContent?.trim();
      if (name?.toLowerCase().includes(schemaLabel.toLowerCase())) {
        const val = pair.querySelector('[itemprop="value"]')?.textContent?.trim();
        return val || null;
      }
    }
    return null;
  };

  let type = getSchemaValue('Type') || clean('type', getLabeledValue("Type"));
  if (!type) type = "terrestrial";
  else type = clean('type', type);

  const climate = clean('climate', getSchemaValue('Climate'));
  const purpose = clean('purpose', getSchemaValue('Purpose'));
  const source = clean('source', getLabeledValue("Source"));
  const confidence = clean('placement', getLabeledValue("Placement"));
  const development = clean('development', getSchemaValue('Development'));
  const dangers = clean('dangers', getSchemaValue('Dangers'));

  return {
    name: clean('name', getText('.name')),
    breadcrumb: clean('breadcrumb', getText('.extrainfo')),
    faction: clean('faction', getText('.factioninfo')),
    type,
    climate,
    purpose,
    source,
    confidence,
    development,
    dangers
  };
}

const features = [];

myMap.eachLayer(layer => {
  if (layer instanceof L.Marker) {
    const latlng = layer.getLatLng();
    const popup = layer.getPopup && layer.getPopup();
    const popupContent = popup ? popup.getContent() : null;

    let extracted = {};
    if (popupContent) {
      extracted = extractFromPopup(popupContent);
    }

    const extra = layer.options?.icon?.options?.className || null;

    if (extra) {
      const [clsType, ...clsFactionParts] = extra.trim().split(/\s+/);
      const clsFaction = clsFactionParts.join(" ");

      let type = clsType.toLowerCase();
      switch (type) {
        case "comet":
        case "comet/asteroid":
          type = "asteroid"; break;
        case "space":
        case "space hulk":
          type = "hulk"; break;
        case "space station":
          type = "station"; break;
        case "space ship":
        case "space fleet":
          type = "ship"; break;
        case "webway/warp gate/warp rift":
          type = "gate"; break;
      }
      type = type.replace(/\s+/g, "_");

      extracted.type = type;

      // Use faction from HTML if available; fallback to className
      if (!extracted.faction && clsFaction) {
        extracted.faction = clsFaction;
      }
    }

    if (extracted.type) {
      extracted.type = extracted.type.toLowerCase().replace(/\s+/g, "_");
      if (extracted.type === "planet") extracted.type = "terrestrial";
    }

    if (extracted.confidence) {
      const p = extracted.confidence.toLowerCase();
      if (p.includes("igh")) extracted.confidence = "high";
      else if (p.includes("edium")) extracted.confidence = "medium";
      else if (p.includes("ow")) extracted.confidence = "low";
      else if (p.includes("ero")) extracted.confidence = "zero";
    }

    const props = {
      ...extracted,
      ...(extra ? { extra } : {}),
      ...(testing && popupContent ? { html: popupContent } : {})
    };

    if (props.source && props.source.toLowerCase().includes("unofficial")) {
      props.unofficial = true;
    }

    Object.keys(props).forEach(key => {
      if ((props[key] == null || props[key] === "") && !["type", "html", "unofficial"].includes(key)) {
        delete props[key];
      }
    });

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [latlng.lng, latlng.lat]
      },
      properties: props
    });
  }
});

const geojson = {
  type: "FeatureCollection",
  features
};

copy(JSON.stringify(geojson, null, 2));
console.log(`GeoJSON copied to clipboard with ${features.length} features.`, geojson);
