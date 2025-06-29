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

  // Handle <PropertyValue> structured blocks (e.g., Climate, Type)
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

  // Prefer structured Type, fallback to fallback scraper
  let type = getSchemaValue('Type') || clean('type', getLabeledValue("Type"));
  if (!type) type = "terrestrial";
  else type = clean('type', type);

  const climate = clean('climate', getSchemaValue('Climate'));

  return {
    name: clean('name', getText('.name')),
    breadcrumb: clean('breadcrumb', getText('.extrainfo')),
    faction: clean('faction', getText('.factioninfo')),
    type,
    climate,
    purpose: clean('purpose', getLabeledValue("Purpose")),
    source: clean('source', getLabeledValue("Source")),
    placement: clean('placement', getLabeledValue("Placement"))
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

    const props = {
      ...extracted,
      ...(extra ? { extra } : {}),
      ...(popupContent ? { html: popupContent } : {})
    };

    // Remove null or empty strings (but keep 'type' and 'html')
    Object.keys(props).forEach(key => {
      if ((props[key] == null || props[key] === "") && key !== "type" && key !== "html") {
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
console.log("GeoJSON copied to clipboard!", geojson);
