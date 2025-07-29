import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import POSTWAR_GREEN from '@/lib/style.json'
import { toKML } from "@placemarkio/tokml"
import { feature } from "topojson-client"
import { topology } from "topojson-server"
import { create } from "zustand"
import { distance, point, centroid } from '@turf/turf'

export const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/"
export const MENU_HEIGHT_PX = 40
export const CENTER = [-78, 26]

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}

const TOOLTIP_WIDTH_PX = 150
const TOOLTIP_HEIGHT_PX = 160
const TOOLTIP_Y_OFFSET = 50
export const TITLE = process.env.NEXT_PUBLIC_TITLE
export const REPO = process.env.NEXT_PUBLIC_REPO
export const USER = process.env.NEXT_PUBLIC_USER
export const AVAILABLE_PROPERTIES = {
  "type": "dual purpose, a category for the feature but will also be used as an SVG<br/> if matching the name of <a style='color: rgb(133, 163, 255);' target='_blank' href='https://github.com/CodaBool/stargazer/wiki/Sci%E2%80%90Fi-maps-for-all#icon'>available icons</a> and no icon key is present|required|type=text",
  "name": "name for this feature|required|type=text",
  "icon": "an SVG icon, can be one of the preset icons or a remote URL (<a href='https://gist.githubusercontent.com/CodaBool/8c4ae1b4cc000c1b96d4f881175adbdd/raw/ea260e9614b4c91dcff4b6511f5b53793dd043ec/farmer.svg' target='_blank' style='color: rgb(133, 163, 255);'>e.g.</a>).<br/>This takes priority over the type key, which comes with a default icon.<br/>Using one from the thousands of preset icons <b>is recommended</b>.<br/>Since color results are not guaranteed if using the remote URL method.|type=text",
  "description": "text which describes the feature and its significance|type=text",
  "faction": "the faction this feature aligns with, typically used with territories to change the color|type=text",
  "link": "Foundry uuid, can be for a journal, page, or macro|type=text",
  "unofficial": "shows a tag marking the feature as unofficial|type=true/false",
  "capital": "shows a tag marking the feature as a capital|type=true/false",
  "destroyed": "shows a tag marking the feature as destroyed|type=true/false",
  "city": "comma separated list of cities present at the location|type=comma list",
  "alias": "comma separated list of alternative names|type=comma list",
  "fill": "interior color for polygons. Also works as the color for point locations. Lines don't use fill.|type=rgba",
  "stroke": "border color for polygons and lines. Point locations do not use stroke.|type=rgba",
}

export function getLocationGroups(features, maxDistance = 20) {
  const unvisited = new Set(features.map(f => f.id))
  const groups = []

  while (unvisited.size > 0) {
    const startId = unvisited.values().next().value
    const startFeature = features.find(f => f.id === startId)

    const cluster = []
    const queue = [startFeature]
    unvisited.delete(startId)

    while (queue.length > 0) {
      const current = queue.pop()
      cluster.push(current)
      unvisited.delete(current.id)

      for (const f of features) {
        if (!unvisited.has(f.id)) continue
        const dist = distance(current.geometry.coordinates, point(f.geometry.coordinates))
        if (dist <= maxDistance) {
          queue.push(f)
          unvisited.delete(f.id)
        }
      }
    }

    const c = centroid({
      type: "FeatureCollection",
      features: cluster,
    });

    groups.push({
      id: `group-${groups.length}`,
      center: c.geometry.coordinates,
      members: cluster.map(f => f.id)
    });
  }
  return groups;
}

export function positionTooltip(e) {
  if (isMobile()) return
  const tt = document.querySelector(".map-tooltip")
  if (e.pageX + TOOLTIP_WIDTH_PX / 2 > window.innerWidth) {
    // left view, since it's too far right
    tt.style.left = (e.pageX - TOOLTIP_WIDTH_PX - TOOLTIP_Y_OFFSET) + "px"
  } else if (e.pageX - TOOLTIP_WIDTH_PX / 2 < 0) {
    // right view, since it's too far left
    tt.style.left = (e.pageX + TOOLTIP_Y_OFFSET) + "px"
  } else {
    // clear space, use center view
    tt.style.left = (e.pageX - tt.offsetWidth / 2) + "px"
  }
  if (e.pageY + TOOLTIP_HEIGHT_PX + TOOLTIP_Y_OFFSET > window.innerHeight) {
    // top view, since it's too low
    tt.style.top = (e.pageY - TOOLTIP_Y_OFFSET - TOOLTIP_HEIGHT_PX) + "px"
  } else {
    // clear space, use bottom view
    tt.style.top = (e.pageY + TOOLTIP_Y_OFFSET) + "px"
  }
  tt.style.visibility = "visible"
}

export function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16); // Convert to unsigned hex
}

export function createPopupHTML(e, isGalaxy, map) {
  const type = e.features[0].properties.type
  const description = e.features[0].properties.description
    ? e.features[0].properties.description.slice(0, 150) + (e.features[0].properties.description.length > 150 ? '...' : '')
    : 'No description available'

  const badges = [
    e.features[0].properties.unofficial && '<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-red-500 text-slate-50 hover:bg-red-500/80 dark:bg-red-900 dark:text-slate-50 dark:hover:bg-red-900/80 mx-auto my-1">unofficial</div>',
    e.features[0].properties.faction && `<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-blue-600 text-slate-50 hover:bg-blue-600/80 dark:bg-slate-50 dark:text-blue-600 dark:hover:bg-slate-50/80 mx-auto my-1">${e.features[0].properties.faction}</div>`,
    e.features[0].properties.destroyed && '<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80 mx-auto my-1">destroyed</div>',
    e.features[0].properties.capital && '<div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/80 mx-auto my-1">capital</div>'
  ].filter(Boolean).join('');

  let url = svgBase
  if (map === "custom" && isGalaxy) {
    url += "lancer/"
  } else if (map === "custom" && !isGalaxy) {
    url += "fallout/"
  } else {
    url += `${map}/`
  }

  // console.log("popup", svgBase)

  return `
    <div class="min-w-64 p-2">
      <div class="w-full">
        <p><b>${e.features[0].properties.name}</b> <b class="text-center text-gray-400 ml-4">${type}</b></p>
      </div>
      <div style="width:70px;height:70px;float:right;padding-left:10px">
        <img src="${url + type + '.svg'}" alt="${type}" width="70px" height="70px" align="left">
      </div>
      <hr class="my-3"/>
      <p>${description}</p>
      <div class="flex flex-col items-center">${badges}</div>
    </div>
  `
}

export const SVG_BASE = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/"
// Apply to all <path>, <circle>, <rect>, etc.
const forceAttrs = (svg, fill, stroke) => {
  if (fill) {
    svg = svg.replace(/(<(path|circle|rect|polygon|g)[^>]*?)\s*(fill=".*?")?/gi, (match, before) => {
      return `${before} fill="${fill}" `;
    });
  }
  if (stroke) {
    svg = svg.replace(/(<(path|circle|rect|polygon|g)[^>]*?)\s*(stroke=".*?")?/gi, (match, before) => {
      return `${before} stroke="${stroke}" `;
    });
  }
  return svg;
};
export function getIcon(d, type, map) {
  // const fileName = type.replaceAll(" ", "_")
  if (d?.properties?.icon) {
    // remote
    if (d.properties.icon.startsWith("http")) {
      try {
        return d.properties.icon
      } catch (e) {
        console.log(`WARN: failed to fetch icon: ${d.properties.icon}`, e);
        return null;
      }
    } else {
      // relative
      if (type) {
        return `/svg/${map}/${type}.svg`
      } else {
        console.log(`WARN: failed to create relative icon path: ${d.properties}. Type ${type}`)
        return null
      }
    }
  }
  return `${SVG_BASE}${map}/${type}.svg`
}

export async function getIconHTML(d, map) {
  console.log("called for HTML")
  const url = d.properties.icon || getIcon(d, d.properties.type, map)
  // console.log("fetch", url)
  const res = await fetch(url).then(r => {
    if (r.status >= 400) {
      console.log(`WARN: failed to fetch icon: ${url}`)
      return "<span>?</span>"
    }
    return r.text()
  }).catch(e => {
    console.log(`WARN: failed to fetch icon: ${url}`, e)
    return "<span>?</span>"
  })
  if (!res) return "<span>?</span>"
  // console.log("finally", res)
  return forceAttrs(res, d.properties.fill, d.properties.stroke)
}

export function getConsts(map) {
  const DEFAULTS = {
    CENTER: [0, 0],
    UNIT: "ly",
    IS_GALAXY: true,
    IMPORTANT: [], // used for maplibre symbol sort priority
    MIN_ZOOM: 1,
    MAX_ZOOM: 15,
    SEARCH_SIZE: 2,
    DISTANCE_CONVERTER: 1,
    GENERATE_LOCATIONS: true,
    BG: "#010f45 0%, #000000 100%",
    IGNORE_POLY: ["line", "grid"],
    VIEW: {
      longitude: 0,
      latitude: 0,
      zoom: 1,
      // [[left, bottom], [right, top]]
      // maxBounds: [[0, 0], [0, 0]],
    },
    TYPES: {
      "polygon": ["sector", "cluster", "nebulae"],
      "point": ["station", "jovian", "moon", "terrestrial", "desert_planet", "ocean_planet", "barren_planet", "ice_planet", "asteroid", "lava_planet", "ringed_planet", "gate", "black_hole", "wormhole", "exoplanet", "star", "neutron_star", "comet", "unknown"],
      "linestring": ["guide", "hyperspace"],
    },
    STYLE: {
      version: 8,
      sources: {},
      sprite: "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/spritesheet",
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      layers: [{
        "id": "background",
        "type": "background",
        "paint": { "background-opacity": 0 },
      }],
    },
    STYLES: {
      // searchbarBackground: "rgb(2 6 15)",
      // searchbarBorder: "rgb(30 41 59)",
      MAIN_COLOR: "#0d126e",
      HIGHLIGHT_COLOR: "#3d9661",
    }
  }
  if (map === "fallout") {
    return {
      ...DEFAULTS,
      STYLES: {
        // searchbarBackground: "#020e03",
        // searchbarBorder: "#0a400d",
        // HIGHLIGHT_COLOR: "255,215,120",

        // MAIN_COLOR: "#2932d1",
        // HIGHLIGHT_COLOR: "#3d9661",

        MAIN_COLOR: "#0d6e25",
        // MAIN_COLOR: "#0d126e",
        HIGHLIGHT_COLOR: "#3d9661",
      },
      IMPORTANT: ["vault"], // used for maplibre symbol sort priority
      IS_GALAXY: false,
      SEARCH_SIZE: 0.5,
      GENERATE_LOCATIONS: false,
      CENTER: [-100, 40],
      STYLE: POSTWAR_GREEN,
      DISTANCE_CONVERTER: 0.621371, // to mile
      LAYOUT_OVERRIDE: {
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        // "icon-size": .8,
      },
      QUOTE: "I survived because the fire inside me burned brighter than the fire around me",
      UNIT: "miles",
      CLICK_ZOOM: 8,
      TYPES: {
        "polygon": ["territory", "region"],
        "point": ["base", "settlement", "town", "city", "vault", "building", "cave", "compound"],
        "linestring": ["guide"],
      },
      BG: "#06402B 0%, #000000 100%",
      // NO_PAN: [],
      VIEW: {
        longitude: -100,
        latitude: 40,
        zoom: 3.5,
        // [[left, bottom], [right, top]]
        maxBounds: [[-170, 10], [-40, 72]],
      },
      MAX_ZOOM: 16,
      MIN_ZOOM: 4,
    }
  } else if (map.includes("lancer")) {
    return {
      ...DEFAULTS,
      CENTER: [-78, 26],
      IMPORTANT: ["gate"], // used for maplibre symbol sort priority
      // Janederscore's map is 135ly across. Convert km so they match up
      DISTANCE_CONVERTER: 0.006202904, // km to ly and scaled
      LAYOUT_OVERRIDE: {
        "icon-allow-overlap": true,
        "text-offset": [0, 1.6],
        // "icon-overlap": "always",
        "icon-ignore-placement": true,
        "text-optional": true,
        "symbol-sort-key": ["get", "priority"],
        "icon-size": [
          "case",
          ["in", ["get", "type"], ["literal", ["star"]]], 0.6,
          1.4
        ]
      },
      UNIT: "ly",
      QUOTE: "...along ancient charted paths and out toward new worlds. Union could not bring their dead back home. But they would choke the stars with the living",
      CLICK_ZOOM: 5,
      // LAYER_PRIO: ["cluster", "sector"],
      // NO_PAN: ["line"],
      VIEW: {
        longitude: -77,
        latitude: 42,
        zoom: 2.3,
        // [[left, bottom], [right, top]]
        maxBounds: [[-200, -50], [50, 82]],
      },
      MAX_ZOOM: 15,
      MIN_ZOOM: 2.3,
    }
  } else if (map === "starwars") {
    return {
      ...DEFAULTS,
      CENTER: [-78, 26],
      LAYOUT_OVERRIDE: {
        "icon-size": .7,
      },
      // Starwas map is 90000ly in width, convert km to match this width
      // source https://www.starwars.com/star-wars-galaxy-map
      DISTANCE_CONVERTER: 3.193754436, // km to ly and scaled
      QUOTE: "...punch it",
      CLICK_ZOOM: 5,
      // LAYER_PRIO: ["cluster", "sector"],
      // NO_PAN: ["line"],
      SEARCH_SIZE: 0.05,
      VIEW: {
        longitude: 2,
        latitude: 2,
        zoom: 6.5,
        // [[left, bottom], [right, top]]
        maxBounds: [[-8.5, -10], [12, 12]],
      },
      MAX_ZOOM: 13,
      MIN_ZOOM: 6,
    }
  } else if (map === "alien") {
    return {
      ...DEFAULTS,
      // LAYOUT_OVERRIDE: {
      //   "icon-size": .7,
      // },
      // Stars of the Middle Heavens is 47 parsec x 30 parsec
      DISTANCE_CONVERTER: 0.047496521, // arbitrary number to convert km to parsec
      QUOTE: "building better worlds",
      UNIT: "parsec",
      SEARCH_SIZE: 0.05,
      VIEW: {
        longitude: 0,
        latitude: 1.4,
        zoom: 7.2,
        // [[left, bottom], [right, top]]
        maxBounds: [[-5.5, -3], [4.5, 10]],
      },
      // MAX_ZOOM: 13,
      // MIN_ZOOM: .2,
    }
  } else if (map === "cyberpunk") {
    return {
      ...DEFAULTS,
      // LAYOUT_OVERRIDE: {
      //   "icon-size": .7,
      // },
      DISTANCE_CONVERTER: 0.512540651, // km to ly and scaled
      // QUOTE: "building better worlds",
      UNIT: "mi",
      SEARCH_SIZE: 0.05,
      VIEW: {
        longitude: 0,
        latitude: 1.4,
        zoom: 7.2,
        // [[left, bottom], [right, top]]
        maxBounds: [[-7, -4], [9, 6.5]],
      },
      MAX_ZOOM: 10,
      // MIN_ZOOM: .2,
    }
  } else if (map === "warhammer") {
    return {
      ...DEFAULTS,
      // CENTER: [-78, 26],
      // LAYOUT_OVERRIDE: {
      //   "icon-size": .7,
      // },
      // DISTANCE_CONVERTER: 3.193754436, // km to ly and scaled
      UNIT: "ly",
      QUOTE: "Blessed is the mind too small for doubt",
      SEARCH_SIZE: 0.015,
      // QUOTE: "...punch it",
      // CLICK_ZOOM: 5,
      // // LAYER_PRIO: ["cluster", "sector"],
      // // NO_PAN: ["line"],
      VIEW: {
        longitude: 0.2,
        latitude: 0,
        zoom: 7.6,
        // [[left, bottom], [right, top]]
        maxBounds: [[-4, -3], [5, 2.5]],
      },
      // MAX_ZOOM: 13,
      // MIN_ZOOM: .2,
    }
  }
  return DEFAULTS
}

export function isMobile() {
  if (typeof navigator === 'undefined' || typeof window === "undefined") return false
  let check = false;
  (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);

  // add ipads to mobile
  if ('ontouchstart' in window) return true
  return check;
}
export function normalizeFeatures(features, allKeys) {
  if (!features) return [];
  return features.map(feature => {
    allKeys.forEach(propKey => {
      if (!feature.properties.hasOwnProperty(propKey)) {
        feature.properties[propKey] = null; // Ensure missing fields are included
      }
    });
    feature.properties.FID = String(feature.properties.FID); // Ensure FID is always a string
    return feature;
  });
}
export function combineLayers(geojsons) {
  const allKeys = new Set();

  // Collect all unique property keys
  geojsons.forEach(geojson => {
    if (geojson?.features) {
      geojson.features.forEach(f => Object.keys(f.properties).forEach(key => allKeys.add(key)));
    }
  });

  // Normalize features and merge into a single list
  let combinedFeatures = [];
  geojsons.forEach(geojson => {
    if (geojson?.features) {
      const normalized = normalizeFeatures(geojson.features, allKeys);
      combinedFeatures = combinedFeatures.concat(normalized);
    }
  });

  return {
    type: "FeatureCollection",
    features: combinedFeatures
  };
}

// Function to normalize properties and ensure FID is a string
export function combineLayersForTopoJSON(geojsons) {
  const allKeys = new Set();

  let categorizedFeatures = {
    location: [],
    territory: [],
    guide: []
  };

  geojsons.forEach(geojson => {
    if (geojson?.features) {
      geojson.features.forEach(f => Object.keys(f.properties).forEach(key => allKeys.add(key)));
      const normalized = normalizeFeatures(geojson.features, allKeys);
      normalized.forEach(feature => {
        const geomType = feature.geometry.type;
        if (geomType === "Point") {
          categorizedFeatures.location.push(feature);
        } else if (geomType.includes("Poly")) { // Polygon & MultiPolygon
          categorizedFeatures.territory.push(feature);
        } else if (geomType === "LineString") {
          categorizedFeatures.guide.push(feature);
        }
      });
    }
  });

  return {
    location: { type: "FeatureCollection", features: categorizedFeatures.location },
    territory: { type: "FeatureCollection", features: categorizedFeatures.territory },
    guide: { type: "FeatureCollection", features: categorizedFeatures.guide }
  };
}

// combine a geojson and a topojson into a single geojson
export function combineAndDownload(type, serverTopojson, clientGeojson) {
  try {
    // Convert TopoJSON to GeoJSON for server layers
    const serverGeojsonLocation = feature(serverTopojson, serverTopojson.objects?.["location"] || { type: "GeometryCollection", geometries: [] });
    const serverGeojsonTerritory = feature(serverTopojson, serverTopojson.objects?.["territory"] || { type: "GeometryCollection", geometries: [] });
    const serverGeojsonGuide = feature(serverTopojson, serverTopojson.objects?.["guide"] || { type: "GeometryCollection", geometries: [] });
    const serverGeojsonLabel = feature(serverTopojson, serverTopojson.objects?.["label"] || { type: "GeometryCollection", geometries: [] });

    let finalData
    let fileType = "application/json";
    if (type === "kml") {
      // Combine all layers and export as KML
      const combinedGeojson = combineLayers([
        clientGeojson,
        serverGeojsonLocation,
        serverGeojsonTerritory,
        serverGeojsonLabel,
        serverGeojsonGuide,
      ]);
      finalData = toKML(combinedGeojson)
      fileType = "application/vnd.google-earth.kml+xml";

    } else if (type === "topojson") {
      // Use separate layers for TopoJSON
      const combinedTopoJSON = combineLayersForTopoJSON([
        clientGeojson,
        serverGeojsonLocation,
        serverGeojsonTerritory,
        serverGeojsonLabel,
        serverGeojsonGuide,
      ]);
      finalData = JSON.stringify(topology(combinedTopoJSON));
    } else if (type === "simpleGeojson") {
    } else {
      // GeoJSON behavior remains the same: single FeatureCollection
      finalData = JSON.stringify(
        combineLayers([
          clientGeojson,
          serverGeojsonLocation,
          serverGeojsonTerritory,
          serverGeojsonLabel,
          serverGeojsonGuide,
        ]),
        null,
        2
      );
    }

    // Create and trigger file download
    return [finalData, fileType]
  } catch (error) {
    console.error("Error downloading map:", error);
  }
}

export function genLink(d, map, type) {
  if (!d) {
    console.log("this is likely a generated planet")
    return ""
  }
  // both cartographer and [id] map append a userCreated prop
  if (d.properties.userCreated) {
    return type === "href" ? `#` : ""
  }
  let x, y
  if (d.geometry.type === "Point") {
    x = d.geometry.coordinates[0]
    y = d.geometry.coordinates[1]
  } else {
    // const coordinates = geoPath().centroid(d)
    // TODO: implement centroid calculation
    x = 0
    y = 0
  }
  if (map.includes("lancer")) {
    // TODO: find a good id system
    const name = encodeURIComponent(d.properties.name)
    return type === "href" ? `/contribute?map=${map}&x=${x}&y=${y}&name=${name}` : ""
  } else if (map === "fallout") {
    const theWord = "f" + "a" + "l" + "l" + "o" + "u" + "t"
    return type === "href" ? `https://${theWord}.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "starwars") {
    const theWord = "s" + "t" + "a" + "r" + "w" + "a" + "r" + "s"
    return type === "href" ? `http://${theWord}.wikia.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "warhammer") {
    return type === "href" ? `https://warhammer40k.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "alien") {
    return type === "href" ? `https://avp.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "cyberpunk") {
    return type === "href" ? `https://cyberpunk.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  }
}

export function getColorExpression(map, style, geo) {
  if (map === "fallout") {
    if (style === "stroke") {
      if (geo === "Point") {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ["==", ["get", "type"], "base"], "rgb(229, 218, 172)",
            ["==", ["get", "type"], "city"], "rgb(115, 142, 131)",
            ["==", ["get", "type"], "settlement"], "rgb(290, 19, 38)",
            ["==", ["get", "type"], "vault"], "#6ea7ff",
            ["==", ["get", "type"], "building"], "rgb(11, 89, 75)",
            ["==", ["get", "type"], "cave"], "rgb(71, 39, 61)",
            ["==", ["get", "type"], "region"], "rgb(142, 232, 237)",
            ["==", ["get", "type"], "compound"], "rgb(200, 100, 130)",
            "rgb(96, 0, 148)" // default color
          ]
        ];
      } else if (geo === "LineString") {
        return [
          'coalesce',
          ['get', style],
          "rgb(139, 178, 141)"
        ];
      } else {
        return [
          'coalesce',
          ['get', style],
          [
            "case",
            ["==", ["get", "faction"], "Brotherhood of Steel"], "rgba(39, 122, 245, 0.1)",
            ["==", ["get", "faction"], "Ceasar's Legion"], "rgba(245, 81, 39, 0.2)",
            ["==", ["get", "faction"], "NCR"], "rgba(133, 92, 0, .5)",
            ["==", ["get", "type"], "region"], "rgba(142, 232, 237, .1)",
            ["==", ["get", "destroyed"], true], "rgba(0, 0, 0, .2)",
            "rgba(60, 150, 60, .5)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      if (geo === "Point") {
        return [
          'coalesce',
          ['get', "fill"],
          [
            "case",
            ["==", ["get", "type"], "base"], "rgb(229, 218, 172)",
            ["==", ["get", "type"], "city"], "rgb(115, 142, 131)",
            ["==", ["get", "type"], "settlement"], "rgb(50, 90, 38)",
            ["==", ["get", "type"], "vault"], "#6ea7ff",
            ["==", ["get", "type"], "building"], "rgb(11, 89, 75)",
            ["==", ["get", "type"], "cave"], "rgb(71, 39, 61)",
            ["==", ["get", "type"], "region"], "rgb(142, 232, 237)",
            ["==", ["get", "type"], "compound"], "rgb(20, 40, 115)",
            "rgb(96, 0, 48)" // default color
          ]
        ];
      } else if (geo === "LineString") {
        return [
          'coalesce',
          ['get', style],
          "rgb(139, 178, 141)"
        ];
      } else {
        return [
          'coalesce',
          ['get', style],
          [
            "case",
            ["==", ["get", "faction"], "Brotherhood of Steel"], "rgba(39, 122, 245, 0.04)",
            ["==", ["get", "faction"], "Ceasar's Legion"], "rgba(245, 81, 39, 0.08)",
            ["==", ["get", "faction"], "NCR"], "rgba(133, 92, 0, .1)",
            ["==", ["get", "destroyed"], true], "rgba(0, 0, 0, .2)",
            ["==", ["get", "type"], "region"], "rgba(142, 232, 237, .05)",
            ["==", ["get", "type"], "state"], "rgb(39, 39, 40)",
            ["==", ["get", "type"], "country"], "rgb(39, 39, 40)",
            ["==", ["get", "type"], "province"], "rgb(39, 39, 40)",
            ["==", ["get", "type"], "territory"], "rgb(39, 39, 40, 0.04)",
            "rgba(142, 232, 237, .04)" // default color
          ]
        ];
      }
    }
  } else if (map.includes("lancer")) {
    if (style === "stroke") {
      return [
        'coalesce',
        ['get', "stroke"],
        [
          'case',
          ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.3)',
          ['==', ['get', 'type'], 'cluster'], 'rgba(39, 83, 245, 0.6)',
          ['==', ['get', 'name'], 'Karrakis Trade Baronies'], 'rgba(247, 173, 77, 1)',
          ['==', ['get', 'name'], 'Harrison Armory'], 'rgba(99, 0, 128, 1)',
          ['==', ['get', 'name'], 'IPS-N'], 'rgba(158, 0, 0, 1)',
          ['==', ['get', 'faction'], 'interest'], 'rgba(84, 153, 199, .6)',
          ['==', ['get', 'name'], 'Union Coreworlds'], 'rgba(245, 39, 39, 0.6)',
          ['==', ['get', 'type'], 'territory'], 'rgba(255, 255, 255, 0.4)',
          'black' // default fallback
        ]
      ];
    } else if (style === "fill") {
      return [
        'coalesce',
        ['get', "fill"],
        [
          'case',
          ['==', ['get', 'type'], 'station'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'jovian'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'terrestrial'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'moon'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'cluster'], 'rgba(39, 122, 245, 0.2)',
          ['==', ['get', 'faction'], 'KTB'], 'rgba(168, 103, 17, .7)',
          ['==', ['get', 'faction'], 'HA'], 'rgba(99, 0, 128, .9)',
          ['==', ['get', 'faction'], 'IPS-N'], 'rgba(158, 0, 0, .8)',
          ['==', ['get', 'faction'], 'union'], 'rgba(227, 49, 5, 0.45)',
          ['==', ['get', 'name'], 'The Interest'], 'rgba(84, 153, 199, .6)',
          ['==', ['get', 'name'], 'The Long Rim'], 'rgba(84, 153, 199, .6)',
          ['==', ['get', 'type'], 'gate'], 'teal',
          ['==', ['get', 'type'], 'star'], 'lightgray',
          ['==', ['get', 'type'], 'line'], 'rgba(0, 0, 0, 0)',
          'rgba(255, 255, 255, 0.2)' // default color
        ]
      ];
    }
  } else if (map === "alien") {
    if (style === "stroke") {
      if (geo === "LineString") {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.3)',
            ["==", ["get", "name"], "filler"], "rgba(117, 186, 143, 0.1)", // green
            "rgba(117, 186, 143, 0.08)" // default green
          ]

        ];
      } else {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            // polygon/territory
            ["==", ["get", "name"], "Frontier"], "#73108e", // purple
            ["==", ["get", "faction"], "ICSC"], "#128a03", // green
            ["==", ["get", "faction"], "TWE"], "rgba(232, 179, 46, 0)", // orange
            ["==", ["get", "faction"], "UPP"], "#e82e2e", // red
            ["==", ["get", "faction"], "UA"], "#2e2ee8", // blue
            ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.3)',
            "rgba(126, 126, 100, 0.2)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      return [
        'coalesce',
        ['get', "fill"],
        [
          "case",
          // ["==", ["get", "name"], "Frontier"], "rgba(115, 16, 142, 0.2)", // purple
          ["==", ["get", "faction"], "ICSC"], "rgba(18, 138, 3, 0.2)", // green
          ["==", ["get", "faction"], "TWE"], "rgba(232, 179, 46, 0.2)", // orange
          ["==", ["get", "faction"], "UPP"], "rgba(232, 46, 46, 0.2)", // red
          ["==", ["get", "faction"], "UA"], "rgba(46, 46, 232, 0.2)", // blue
          ["==", ["get", "type"], "terrestrial"], "rgba(255, 255, 255, 0.8)",
          ['==', ['get', 'type'], 'line'], 'rgba(0, 0, 0, 0)',
          "rgba(255, 255, 255, 0.7)" // default color
        ]
      ];
    }
  } else if (map === "cyberpunk") {
    if (style === "stroke") {
      if (geo === "LineString") {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.3)',
            ["==", ["get", "name"], "filler"], "rgba(117, 186, 143, 0.1)", // green
            "rgba(117, 186, 143, 0.08)" // default green
          ]

        ];
      } else {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            // polygon/territory
            ["==", ["get", "threat"], "corporate"], "rgba(46, 46, 232, 0.2)", // blue
            ["==", ["get", "threat"], "suburbs"], "rgba(232, 179, 46, 0.2)", // orange
            ["==", ["get", "threat"], "executive"], "rgba(115, 16, 142, 0.2)", // purple
            ["==", ["get", "threat"], "combat"], "rgba(232, 46, 46, 0.2)", // red
            ["==", ["get", "threat"], "extreme"], "rgba(232, 46, 46, 0.5)", // red
            ['==', ['get', 'type'], 'apartment'], 'rgba(39, 122, 245, 1)',
            "rgba(126, 126, 100, 0.2)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      return [
        'coalesce',
        ['get', "fill"],
        [
          "case",
          // ["==", ["get", "name"], "Frontier"], "rgba(115, 16, 142, 0.2)", // purple
          ["==", ["get", "threat"], "corporate"], "rgba(46, 46, 232, 0.2)", // blue
          ["==", ["get", "threat"], "suburbs"], "rgba(232, 179, 46, 0.2)", // orange
          ["==", ["get", "threat"], "executive"], "rgba(115, 16, 142, 0.2)", // purple
          ["==", ["get", "threat"], "combat"], "rgba(232, 46, 46, 0.2)", // red
          ["==", ["get", "threat"], "extreme"], "rgba(232, 46, 46, 0.5)", // red

          ['==', ['get', 'type'], 'arts'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'bar'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'hotel'], 'rgba(39, 122, 245, 1)',
          ['==', ['get', 'type'], 'hideout'], 'rgba(39, 122, 245, 1)',

          "rgba(255, 255, 255, 0.7)" // default color
        ]
      ];
    }
  } else if (map === "starwars") {
    if (style === "stroke") {
      if (geo === "LineString") {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ["==", ["get", "type"], "hyperspace"], "rgb(139, 178, 141)",
            "rgba(117, 186, 143, 0.08)" // default green
          ]
        ];
      } else {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ["==", ["get", "faction"], "empire"], "rgba(38, 113, 188, 0.2)",
            ["==", ["get", "faction"], "alliance"], "rgba(125, 0, 0, .2)",
            ["==", ["get", "faction"], "neutral/hutt"], "rgba(50, 135, 44, 0.2)",
            ["==", ["get", "faction"], "the chiss ascendancy"], "rgba(0, 244, 255, 0.2)",
            ["==", ["get", "type"], "line"], "rgba(0, 0, 0, 0)",
            "rgba(126, 126, 100, 0.2)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      return [
        'coalesce',
        ['get', "fill"],
        [
          "case",
          ["==", ["get", "faction"], "empire"], "rgba(38, 113, 188, 0.2)",
          ["==", ["get", "faction"], "alliance"], "rgba(125, 0, 0, .2)",
          ["==", ["get", "faction"], "neutral/hutt"], "rgba(50, 135, 44, 0.2)",
          ["==", ["get", "faction"], "the chiss ascendancy"], "rgba(0, 244, 255, 0.2)",
          ["==", ["get", "type"], "terrestrial"], "rgba(255, 255, 255, 0.8)",
          "rgba(126, 126, 100, 0.2)" // default color
        ]
      ];
    }
  } else if (map === "warhammer") {
    if (style === "stroke") {
      if (geo === "LineString") {
        return [
          'coalesce',
          ['get', "stroke"],
          "rgb(139, 178, 141)"
        ];
      } else {
        return [
          'coalesce',
          ['get', "stroke"],
          [
            "case",
            ["==", ["get", "faction"], "empire"], "rgba(38, 113, 188, 0.2)",
            ["==", ["get", "type"], "line"], "rgba(0, 0, 0, 0)",
            "rgba(126, 126, 100, 0.2)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      return [
        'coalesce',
        ['get', "fill"],
        [
          "case",
          ["==", ["get", "faction"], "Adeptus Astartes/Space Marines"], "#3783FF", // blue
          ["==", ["get", "faction"], "Adeptus Mechanicus"], "#F60000", // red
          ["==", ["get", "faction"], "Adeptus Administratum"], "#FF8C00", // orange
          ["==", ["get", "faction"], "asuryani"], "#45D0D0", // cyan
          ["==", ["get", "faction"], "chaos"], "#F60000", // red
          ["==", ["get", "faction"], "daemon"], "#F60000", // red
          ["==", ["get", "faction"], "Daemon"], "#F60000", // red
          ["==", ["get", "faction"], "Dark Mechanicum"], "#F60000", // red
          ["==", ["get", "faction"], "drukhari"], "#F60000", // red
          ["==", ["get", "faction"], "Empire of the Severed"], "#17630d", // dark green
          ["==", ["get", "faction"], "Exodite"], "#45D0D0", // cyan
          ["==", ["get", "faction"], "Genestealer Cult"], "#ca1c8a", // pink
          ["==", ["get", "faction"], "Ghulo Industrial Complex"], "#ffffff", // white
          ["==", ["get", "faction"], "Khorne"], "#F60000", // red
          ["==", ["get", "faction"], "Kronus Hegemony"], "#ffffff", // white
          ["==", ["get", "faction"], "leagues-of-votann"], "#ffffff", // white
          ["==", ["get", "faction"], "Sons of Malice"], "#ffffff", // white
          ["==", ["get", "faction"], "Mephrit Dynasty"], "#17630d", // dark green
          ["==", ["get", "faction"], "necron"], "#1c8b0e", // monster green
          ["==", ["get", "faction"], "Nihilakh Dynasty"], "#1c8b0e", // monster green
          ["==", ["get", "faction"], "Nurgle"], "#52661a", // puke green
          ["==", ["get", "faction"], "Ogdobekh Dynasty"], "#5c5c5c", // grey
          ["==", ["get", "faction"], "ork"], "#799a1d", // ork smash
          ["==", ["get", "faction"], "Void pirates"], "#ffffff", // white
          ["==", ["get", "faction"], "Roguetrader"], "#FF8C00", // orange
          ["==", ["get", "faction"], "Sarnekh Dynasty"], "#541566", // dark purple
          ["==", ["get", "faction"], "Sautekh Dynasty"], "#1c8b0e", // monster green
          ["==", ["get", "faction"], "Adepta Sororitas"], "#FF8C00", // orange
          ["==", ["get", "faction"], "tau"], "#FF8C00", // orange
          ["==", ["get", "faction"], "Thokt Dynasty"], "#ffffff", // white
          ["==", ["get", "faction"], "tyranid"], "#73108e", // purple
          ["==", ["get", "faction"], "Tzeentch"], "#7984be", // baby blue
          ["==", ["get", "faction"], "Urani-Surtr Regulates"], "#ffffff", // white
          ["==", ["get", "faction"], "Ymyr Conglomerate"], "#ffffff", // white
          ["==", ["get", "faction"], "imperial"], "#fff1ab", // light gold
          ["==", ["get", "faction"], "unclassified"], "#949494", // light grey
          ["==", ["get", "type"], "anomaly"], "#ffffff", // white
          ["==", ["get", "type"], "asteroid"], "#5c5c5c", // grey
          ["==", ["get", "type"], "moon"], "#5c5c5c", // grey
          ["==", ["get", "type"], "hulk"], "#F60000", // red
          ["==", ["get", "type"], "fleet"], "#ffffff", // white
          ["==", ["get", "type"], "station"], "#ffffff", // white
          ["==", ["get", "type"], "star"], "#ffffff", // white
          ["==", ["get", "type"], "terrestrial"], "#ffffff", // white
          ["==", ["get", "type"], "webway"], "#73108e", // purple
          ["==", ["get", "type"], "gate"], "#73108e", // purple
          "#ffffff" // default color
        ]
      ];
    }
  } else {
    if (style === "stroke") {
      return ['get', "stroke"]
    } else if (style === "fill") {
      return ['get', "fill"]
    }
  }
  console.log("ERR: getColorExpression error, likely new map and needs conditionals added")
}

// ai slop to darken user CSS colors
export function darkenColor(hex, percent = 20) {
  // Convert hex to RGB
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  // Convert RGB to HSL
  const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm: h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0); break;
      case gNorm: h = (bNorm - rNorm) / d + 2; break;
      case bNorm: h = (rNorm - gNorm) / d + 4; break;
    }
    h /= 6;
  }
  // Darken by reducing lightness
  l = Math.max(0, l - percent / 100);
  // Convert HSL back to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  }

  return hslToRgb(h, s, l);
}

export function getDailyMenuQuote() {
  const menuQuotes = [
    // Xeno
    "A better world awaits",
    "Life is cheap in the outer colonies",
    "Hazard pay won’t cover this",
    "Scrubbed atmosphere. Unknown bio-sign",
    "The company always gets its payload",
    "Expendable assets acknowledged",
    "Initiating quarantine protocol...",

    // Lancer RPG
    "Frame ready. Pilot online.", // Core game loop reference
    "Omninet connection established.", // Core game loop reference
    "Star chart generated", // Philosophical/lore blend
    "Humanity will continue, even here.", // Frontier theme
    "5017.3.12 General Massive Systems // Please Operate Responsibly", // Refers to Lancer’s data-net

    // p war
    "Please remain calm. Everything is fine.",

    // Space balls the movie
    "A smuggler’s path is never straight.",
    "Even empires burn.",
    "The stars remember every war.",
    "Trust in your instincts, not your scanners.",

    // punk
    "You are the glitch in their system.",
    "Data is power. Power is currency.",
    "Chrome fades. The scars stay.",

    // war
    "Burn the unclean. Then burn the ashes.",
    "In the void, only faith survives.",
    "The Spirit must be appeased.",
    "We are but dust before the stars.",
    "The warp is hungry tonight.",

    // Generic Sci-Fi
    "First contact is rarely polite.", // encounter idea
    "The AI wrote its own commandments.", // AI ascension
    "Entropy always wins.", // Sci-fi thermodynamics
    "Terraforming failed. Again.", // Planet colonization gone wrong
    "Machines forget, but not the way we do.", // AI memory
    "We orbit what we once worshipped.", // Satellite/sacred metaphor
    "All models obsolete eventually.", // Commentary on tech lifespan
    "Upload complete. Identity unknown.", // Digital mind theme
    "Dreams in hexadecimal.", // Hacker or AI
    "You are receiving this transmission too late.", // Distress signal motif
    "Asteroids make terrible neighbors.", // Belt life
    "The clones are remembering things they shouldn’t.", // Cloning fallout
    "Solar flare wiped the backup. Again.", // Data loss in space
    "The colony votes by oxygen share.", // Harsh justice
    "The reactor hums lullabies.", // Ship-as-living thing
    "We named the ship after a forgotten myth.", // Naming lore
    "Cryo logs indicate we've been lied to.", // Sabotaged survival
    "Stars burn out, but bureaucracy endures.", // Satirical tone
  ];

  const date = new Date();
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  return menuQuotes[dayOfYear % menuQuotes.length];
}

export function animateText(elementId, text, typingSpeed = 100, delay = 0) {
  const element = document.getElementById(elementId);
  if (!element) return;

  let index = 0;
  const cursor = document.createElement('span');
  cursor.textContent = '▌';
  cursor.style.display = 'inline-block';
  cursor.style.animation = 'blink 0.5s step-end infinite';
  cursor.style.position = 'relative';
  cursor.style.bottom = '2px';

  element.textContent = '';
  element.appendChild(cursor);

  // Add blinking cursor animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes blink {
      0% { opacity: 1; }
      50% { opacity: 0; }
      100% { opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  // Start typing animation after the delay
  setTimeout(() => {
    const interval = setInterval(() => {
      if (index < text.length) {
        element.textContent = text.slice(0, index + 1);
        element.appendChild(cursor);
        index++;
      } else {
        clearInterval(interval);
        cursor.remove();
      }
    }, typingSpeed);
  }, delay);
}

export function hexToRgb(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r},${g},${b}`;
  // return { r, g, b };
}

// indexDB convert
const dbName = 'mapsDB'
const storeName = 'mapsStore'
export function getDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return
    const request = indexedDB.open(dbName, 1);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(storeName);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

export async function localSet(key, value) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).put(value, key);
  return tx.complete;
}

export async function localGet(key) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readonly');
  const result = await tx.objectStore(storeName).get(key);
  return result;
}

// window attached indexDB function under localGet
export async function getMaps(key = "maps") {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('mapsStore', 'readonly');
    const store = tx.objectStore('mapsStore');
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result || {})
    }
    request.onerror = () => reject(request.error);
  });
}

export const useStore = create((set) => ({
  editorTable: null,
  tutorial: null,
  mode: null,
  setMode: mode => set({ mode }),
  setTutorial: tutorial => set({ tutorial }),
  setEditorTable: editorTable => set({ editorTable }),
}))

export const useMode = create((set) => ({
  mode: null,
  setMode: mode => set({ mode }),
}))

export async function localDelete(key) {
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  tx.objectStore(storeName).delete(key);
  return tx.complete;
}

export function deepArrayCheck(arr1, arr2) {
  if (!arr1 || !arr2) return false
  if (arr1.length !== arr2.length) return true
  for (let i = 0; i < arr1.length; i++) {
    const obj1 = arr1[i]
    const obj2 = arr2[i]

    for (const key in obj1) {
      if (obj1.hasOwnProperty(key) && obj2.hasOwnProperty(key)) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          if (deepArrayCheck([obj1[key]], [obj2[key]])) {
            return true
          }
        } else if (obj1[key] !== obj2[key]) {
          return true
        }
      } else {
        return true
      }
    }
  }
  return false
}


/*
opacity
stroke-width


territory
lines / guide
territory labels
lines / guide labels
locations small
locations large
location labels


background
- stars
-
*/
