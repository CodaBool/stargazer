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

export function createPopupHTML(e, isGalaxy, map, setDrawerContent) {
  const type = e.features[0].properties.type
  const overflow = e.features[0].properties.description?.length > 150
  const description = e.features[0].properties.description
    ? e.features[0].properties.description.slice(0, 150)
    : 'No description available'

  let badges = [
    e.features[0].properties.unofficial && '<div class="inline-flex text-black items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-red-500 hover:bg-red-500/80 mx-auto my-1">unofficial</div>',
    e.features[0].properties.destroyed && '<div class="inline-flex text-black items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-slate-100 hover:bg-slate-100/80 mx-auto my-1">destroyed</div>',
    e.features[0].properties.capital && '<div class="inline-flex text-black items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-slate-100 hover:bg-slate-100/80 mx-auto my-1">capital</div>'
  ].filter(Boolean).join('');

  if (e.features[0].properties.faction) {
    e.features[0].properties.faction.split(",").forEach(f => {
      badges += `<div class="inline-flex text-black items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 dark:border-slate-800 dark:focus:ring-slate-300 border-transparent bg-white hover:bg-blue-600/80 my-1">${f.trim()}</div>`
    })
  }

  let url = svgBase
  if (map === "custom" && isGalaxy) {
    url += "lancer/"
  } else if (map === "custom" && !isGalaxy) {
    url += "fallout/"
  } else {
    url += `${map}/`
  }

  const center = centroid(e.features[0])
  window.popoverData = { coordinates: [center.geometry.coordinates[0], center.geometry.coordinates[1]], selectedId: e.features[0].id, myGroup: [], d: e.features[0] }

  return `
    <div class="min-w-64 p-2">
      <div class="w-full">
        <p><b>${e.features[0].properties.name}</b> <b class="text-center text-gray-400 ml-4">${type.replaceAll("_", " ")}</b></p>
      </div>
      <div style="width:70px;height:70px;float:right;padding-left:10px">
        <img src="${url + type + '.svg'}" alt="${type}" width="70px" height="70px" align="left">
      </div>
      <hr class="my-3"/>
      <p>${description}${overflow ? `...<span class="text-blue-300 hover:underline cursor-pointer" onclick='window.setDrawerContent(window.popoverData)'> read more.</span>` : ''}</p>
      <div class="flex items-center flex-wrap mt-1.5">${badges}</div>
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
  let t = type
  // replace spaces with underscores for easier URL construction
  if (type) t = type.replace(/\s+/g, "_")
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
        return `/svg/${map}/${t}.svg`
      } else {
        console.log(`WARN: failed to create relative icon path: ${d.properties}. Type ${t}`)
        return null
      }
    }
  }
  return `${SVG_BASE}${map}/${t}.svg`
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
    UNIT: "ly",
    IS_GALAXY: true,
    IMPORTANT: [], // used for maplibre symbol sort priority
    UNIMPORTANT: [], // used for maplibre symbol sort priority
    UNIMPORTANT_ZOOM: [8.4, 8.5],
    MIN_ZOOM: 1,
    MAX_ZOOM: 15,
    SEARCH_SIZE: .1,
    DISTANCE_CONVERTER: 1,
    GENERATE_LOCATIONS: true,
    TIME_DILATION: false,
    TRAVEL_RATE_UNIT: "ly/h",
    TRAVEL_TIME_UNIT: "hours",
    TRAVEL_RATE: 300,
    SEARCH_POINT_ZOOM: 10,
    BG: "#010f45 0%, #000000 100%",
    IGNORE_POLY: ["line", "grid", "bg", "bg-texture"],
    VIEW: {
      longitude: 0,
      latitude: 0,
      zoom: 1,
      // [[left, bottom], [right, top]]
      maxBounds: [[-8, -8], [8, 8]],
    },
    TYPES: {
      "polygon": ["sector", "cluster", "nebulae"],
      "point": ["station", "jovian", "moon", "terrestrial", "desert_planet", "ocean_planet", "barren_planet", "ice_planet", "asteroid", "lava_planet", "ringed_planet", "gate", "black_hole", "wormhole", "exoplanet", "star", "neutron star", "comet", "unknown"],
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
      SEARCH_SIZE: 0.4,
      GENERATE_LOCATIONS: false,
      STYLE: POSTWAR_GREEN,
      DISTANCE_CONVERTER: 0.621371, // to mile
      LAYOUT_OVERRIDE: {
        "icon-allow-overlap": true,
        "text-padding": 11,
      },
      QUOTE: "I survived because the fire inside me burned brighter than the fire around me",
      TRAVEL_RATE: 3, // average walking speed in miles per hour
      UNIT: "miles",
      TRAVEL_RATE_UNIT: "mph",
      SEARCH_POINT_ZOOM: 8,
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
      IMPORTANT: ["gate"], // used for maplibre symbol sort priority
      UNIMPORTANT: ["star"], // used for maplibre symbol sort priority
      // Janederscore's map is 135ly across. Convert km so they match up
      DISTANCE_CONVERTER: 0.124080882, // km to ly and scaled
      LAYOUT_OVERRIDE: {
        "icon-size": [
          "case",
          ["in", ["get", "type"], ["literal", ["star"]]], 0.7,
          1.4
        ]
      },
      UNIT: "ly",
      TIME_DILATION: true,
      TRAVEL_RATE_UNIT: "c",
      TRAVEL_RATE: .995,
      QUOTE: "...along ancient charted paths and out toward new worlds. Union could not bring their dead back home. But they would choke the stars with the living",
      // LAYER_PRIO: ["cluster", "sector"],
      SEARCH_SIZE: 0.05,
      VIEW: {
        longitude: 0,
        latitude: 0,
        zoom: 7.2,
        // [[left, bottom], [right, top]]
        maxBounds: [[-6, -6], [6, 6]],
      },
      MAX_ZOOM: 15,
      MIN_ZOOM: 2.3,
    }
  } else if (map === "starwars") {
    return {
      ...DEFAULTS,
      LAYOUT_OVERRIDE: {
        "icon-size": .7,
      },
      // Starwas map is 90000ly in width, convert km to match this width
      // source https://www.starwars.com/star-wars-galaxy-map
      DISTANCE_CONVERTER: 3.193754436, // km to ly and scaled
      QUOTE: "...punch it",
      UNIMPORTANT_ZOOM: [8, 8.1],
      SHIP_CLASS: "1.0",
      UNIMPORTANT: ["terrestrial"],
      // LAYER_PRIO: ["cluster", "sector"],
      // NO_PAN: ["line"],
      SEARCH_SIZE: 0.001,
      GRID_DENSITY: 0.65,
      VIEW: {
        longitude: 0,
        latitude: 0,
        zoom: 1,
        // [[left, bottom], [right, top]]
        maxBounds: [[-8, -8], [8, 8]],
      },
      MAX_ZOOM: 15,
      MIN_ZOOM: 1,
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
      UNIMPORTANT: ["star", "terrestrial", "station", "jovian"],
      UNIMPORTANT_ZOOM: [8.5, 9],
      UNIT: "parsec",
      TRAVEL_RATE: 16,
      TRAVEL_RATE_UNIT: "FTL",
      SEARCH_SIZE: 0.035,
      GRID_DENSITY: 0.1859,
      VIEW: {
        longitude: 0,
        latitude: -1,
        zoom: 7.2,
        // [[left, bottom], [right, top]]
        maxBounds: [[-5.5, -3.3], [4, 10]],
      },
      // MAX_ZOOM: 13,
      // MIN_ZOOM: .2,
    }
  } else if (map === "cyberpunk") {
    return {
      ...DEFAULTS,
      DISTANCE_CONVERTER: 0.01330686, // km to mi in the geojson area I have
      QUOTE: "Wake the fuck up samurai",
      UNIT: "mi",
      UNIMPORTANT: ["road"],
      IS_GALAXY: false,
      GENERATE_LOCATIONS: false,
      TRAVEL_RATE_UNIT: "mph",
      TRAVEL_RATE: 3, // average walking speed in miles per hour
      COORD_OFFSET: [118.25, 34.05], // LA
      SEARCH_SIZE: 0.05,
      VIEW: {
        longitude: 0,
        latitude: 0,
        zoom: 5,
        // [[left, bottom], [right, top]]
        maxBounds: [[-4, -4], [4, 4]],
      },
      LAYOUT_OVERRIDE: {
        "icon-size": 1,
      },
      TYPES: {
        "polygon": ["territory", "zone", "threat"],
        "point": ["apartment",
          "arts",
          "bar",
          "braindance",
          "brothel",
          "camp",
          "container_hotel",
          "club",
          "corpo_housing",
          "cube_hotel",
          "cyberwear",
          "entertainment",
          "firefighter",
          "fixer",
          "hideout",
          "hospital",
          "hotel",
          "house",
          "office",
          "park",
          "police",
          "restaurant",
          "ripper doc",
          "school",
          "service",
          "shop",
          "text",
        ],
        "linestring": ["road", "highway", "tunnel", "main street"],
      },
      MAX_ZOOM: 16,
      // MAX_ZOOM: 9.5,
      // MIN_ZOOM: .2,
    }
  } else if (map === "warhammer") {
    return {
      ...DEFAULTS,
      // LAYOUT_OVERRIDE: {
      //   "icon-size": .7,
      // },
      // DISTANCE_CONVERTER: 3.193754436, // km to ly and scaled
      QUOTE: "Blessed is the mind too small for doubt",
      SEARCH_SIZE: 0.015,
      // QUOTE: "...punch it",
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
        } else if (geomType.includes("LineString")) {
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
  if (!d) return ""
  // both cartographer and [id] map append a userCreated prop
  // console.log("gen", d)
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
    // const name = encodeURIComponent(d.properties.name)
    // return type === "href" ? `/contribute?map=${map}&x=${x}&y=${y}&name=${name}` : ""
    return type === "href" ? `https://lancer.wiki.gg/wiki/Special:Search?search=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "fallout") {
    return type === "href" ? `https://fallout.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "starwars") {
    return type === "href" ? `http://starwars.wikia.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "warhammer") {
    return type === "href" ? `https://warhammer40k.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "alien") {
    // There are two fandom sites for Alien, avp is slightly better
    return type === "href" ? `https://avp.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "cyberpunk") {
    return type === "href" ? `https://cyberpunk.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  }
}

export function getPaint(map, geometry, layer, STYLES) {
  const { UNIMPORTANT_ZOOM } = getConsts(map)
  if (geometry === "fill") {
    const obj = {
      "fill-color": [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        `rgba(${hexToRgb(STYLES.HIGHLIGHT_COLOR)}, .1)`,
        getColorExpression(map, "fill", "Polygon")
      ],
      'fill-outline-color': getColorExpression(map, "stroke", "Polygon"),
    }
    if (layer === "polygon-foreground") {
      obj["fill-pattern"] = ["case", ["has", "icon"], ["get", "icon"], ""]
      obj["fill-antialias"] = false
      obj["fill-opacity"] = ["case", ["has", "opacity"], ["get", "opacity"], 0.4]
    }
    return obj
  } else if (geometry === "line") {
    return {
      "line-color": getColorExpression(map, "stroke", "LineString"),
      "line-width": [
        "case",
        ["in", ["get", "type"], ["literal", ["highway", "replace_me"]]], 3.5,
        2.5
      ],
      // 'line-dasharray': [6, 1],
    }
  } else if (layer === "location") {
    return {
      "text-color": [
        'coalesce',
        ['get', "text-color"],
        "#fff"
      ],
      "text-opacity": [
        "interpolate", ["linear"], ["zoom"],
        UNIMPORTANT_ZOOM[0], [
          "coalesce",
          ["get", "text-opacity"],                             // per-feature override (constant across zooms)
          [
            "case",
            ["<=", ["coalesce", ["to-number", ["get", "priority"]], 5], 3],
            0,                                                 // low-priority: hidden at z8
            1                                                  // high-priority: visible at all zooms
          ]
        ],
        UNIMPORTANT_ZOOM[1], [
          "coalesce",
          ["get", "text-opacity"],
          [
            "case",
            ["<=", ["coalesce", ["to-number", ["get", "priority"]], 5], 3],
            1,                                                 // low-priority: fully visible by z10
            1
          ]
        ]
      ],
      "icon-opacity": [
        'coalesce',
        ['get', "icon-opacity"],
        1
      ],
      "icon-color": [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        STYLES.HIGHLIGHT_COLOR,
        getColorExpression(map, "fill", "Point")
      ],
    }
  } else if (layer === "line-label") {
    return {
      "text-color": "#ffffff",
      "text-halo-color": "#000000",
      "text-halo-width": 1.5,
      "text-opacity": [
        "interpolate", ["linear"], ["zoom"],
        9.1, [
          "case",
          ["<", ["coalesce", ["to-number", ["get", "priority"]], 0], 5],
          0,   // low-priority (<5): hidden at z8.5
          1    // high-priority (>=5): always visible
        ],
        9.3, [
          "case",
          ["<", ["coalesce", ["to-number", ["get", "priority"]], 0], 5],
          1,   // low-priority (<5): fades in by z9.5
          1    // high-priority (>=5): always visible
        ]
      ],
    }
  } else if (layer === "polygon-label") {
    const defaults = {
      "text-color": [
        'coalesce',
        ['get', "text-color"],
        "#fff"
      ],
      "text-opacity": 0.5,
    }
    if (map === "cyberpunk") {
      return {
        ...defaults,
        "text-opacity": [
          "interpolate", ["linear"], ["zoom"],
          7.95, [
            "case",
            ["<", ["coalesce", ["to-number", ["get", "priority"]], 0], 6],
            0,   // low-priority (<5): hidden at z8.5
            0.4    // high-priority (>=5): always visible
          ],
          8.05, [
            "case",
            ["<", ["coalesce", ["to-number", ["get", "priority"]], 0], 6],
            0.4,   // low-priority (<5): fades in by z9.5
            0.4    // high-priority (>=5): always visible
          ]
        ],
      }
    }
    return defaults
  }
  return {}
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
          ['==', ['get', 'name'], 'Karrakin Trade Baronies'], 'rgba(247, 173, 77, 1)',
          ['==', ['get', 'name'], 'Harrison Armory'], 'rgba(99, 0, 128, 1)',
          ['==', ['get', 'name'], 'IPS-N'], 'rgba(158, 0, 0, 1)',
          ['==', ['get', 'faction'], 'interest'], 'rgba(84, 153, 199, .6)',
          ['==', ['get', 'name'], 'Union Coreworlds'], 'rgba(245, 39, 39, 0.6)',
          ['==', ['get', 'type'], 'territory'], 'rgba(255, 255, 255, 0.4)',
          'black' // default fallback
        ]
      ];
    } else if (style === "fill") {
      if (geo === "Point") {
        return [
          'coalesce',
          ['get', "fill"],
          [
            'case',
            ['==', ['get', 'type'], 'station'], 'rgba(39, 122, 245, 1)',
            ['==', ['get', 'type'], 'jovian'], 'rgba(39, 122, 245, 1)',
            ['==', ['get', 'type'], 'terrestrial'], 'rgba(39, 122, 245, 1)',
            ['==', ['get', 'type'], 'moon'], 'rgba(39, 122, 245, 1)',
            ['==', ['get', 'type'], 'gate'], 'teal',
            ['==', ['get', 'type'], 'star'], 'lightgray',
            ['==', ['get', 'type'], 'line'], 'rgba(0, 0, 0, 0)',
            'rgba(255, 255, 255, 0.2)' // default color
          ]
        ];
      } else {
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
            ["==", ["get", "faction"], "3WE"], "rgba(232, 179, 46, 0)", // orange
            ["==", ["get", "faction"], "UPP"], "#e82e2e", // red
            ["==", ["get", "faction"], "UA"], "#2e2ee8", // blue
            ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.3)',
            "rgba(126, 126, 100, 0.2)" // default color
          ]
        ];
      }
    } else if (style === "fill") {
      if (geo === "Point") {
        return "rgba(255, 255, 255, 0.7)"
      }
      return [
        'coalesce',
        ['get', "fill"],
        [
          "case",
          // ["==", ["get", "name"], "Frontier"], "rgba(115, 16, 142, 0.2)", // purple
          ["==", ["get", "faction"], "ICSC"], "rgba(18, 138, 3, 0.2)", // green
          ["==", ["get", "faction"], "3WE"], "rgba(232, 179, 46, 0.2)", // orange
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
            ['==', ['get', 'type'], 'highway'], 'rgba(157, 77, 255, 0.8)',
            ['==', ['get', 'type'], 'road'], 'rgba(0, 71, 71, 1)',
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
            ["==", ["get", "type"], "bg"], "black", // blue
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
          ["==", ["get", "type"], "bg"], "black", // blue
          ["==", ["get", "type"], "bg-radiated"], "green", // blue
          ["==", ["get", "name"], "NorCal Military Base"], "rgba(232, 46, 46, .1)", // red, looks good
          ["==", ["get", "name"], "Watson Development"], "rgba(46, 46, 232, .1)", // blue, looks good
          ["==", ["get", "name"], "New Westbrook North"], "rgba(232, 179, 46, .1)", // yellow
          ["==", ["get", "name"], "Little Europe"], "rgba(255, 0, 197, 0.07)", // purple, looks good
          ["==", ["get", "name"], "Port of Night City"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "Reclamation Zone"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "Santo Domingo"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "North Heywood"], "rgba(245, 95, 39, 0.1)", // orange
          ["==", ["get", "name"], "Heywood Docks"], "rgba(0, 10, 255, 0.15)", // blue
          ["==", ["get", "name"], "New Westbrook"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "Exec Zone"], "rgba(245, 39, 219, 0.08)", // pink
          ["==", ["get", "name"], "Charter Hill"], "rgba(146, 39, 245, 0.14)", // purple
          ["==", ["get", "name"], "Upper Marina"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "Downtown"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "Kabuki"], "rgba(108, 245, 39, 0.08)", // green
          ["==", ["get", "name"], "Old Japantown"], "rgba(0, 197, 255, 0.1)", // blue
          ["==", ["get", "name"], "The Hot Zone"], "rgba(0, 0, 0, 1)", // black, looks good
          ["==", ["get", "name"], "Morro Rock"], "rgba(0, 0, 0, 1)", // black, looks good
          ["==", ["get", "name"], "University District"], "rgba(16, 255, 0, 0.06)", // green, looks good
          ["==", ["get", "name"], "South Night City"], "rgba(255, 149, 0, 0.08)", // orange
          ["==", ["get", "name"], "The Glen"], "rgba(143, 143, 255,.08)", // blue
          ["==", ["get", "name"], "Old Combat Zone"], "rgba(255, 143, 143, .12)", // red
          ["==", ["get", "name"], "Old Japan Town"], "rgba(143, 255, 153, .1)", // green
          ["==", ["get", "name"], "Little China"], "rgba(255, 0, 0, 0.08)", // red
          ["==", ["get", "name"], "Morro Rock"], "rgba(255, 255, 255, .05)", // grey
          ["==", ["get", "name"], "Heywood"], "rgba(250, 255, 0, 0.12)", // yellow
          ["==", ["get", "name"], "Pacifica Playground"], "rgba(0, 255, 218, 0.09)", // cyan
          ["==", ["get", "name"], "Rancho Coronado"], "rgba(255, 0, 212, 0.07)", // purple
          ["==", ["get", "name"], "Heywood Industrial Zone"], "rgba(255, 255, 255, .1)", //
          ["==", ["get", "name"], "New Westbrook South"], "rgba(255, 0, 0, 0.04)", // red
          ["==", ["get", "name"], "Executive Zone"], "rgba(90, 0, 255, 0.08)", // purple


          ["==", ["get", "threat"], "corporate"], "rgba(46, 46, 232, 0.2)", // blue
          ["==", ["get", "threat"], "suburbs"], "rgba(232, 179, 46, 0.2)", // orange
          ["==", ["get", "threat"], "executive"], "rgba(115, 16, 142, 0.2)", // purple
          ["==", ["get", "threat"], "combat"], "rgba(232, 46, 46, 0.2)", // red
          ["==", ["get", "threat"], "extreme"], "rgba(232, 46, 46, 0.5)", // red

          // ['==', ['get', 'type'], 'arts'], 'rgba(39, 122, 245, 1)',
          // ['==', ['get', 'type'], 'bar'], 'rgba(39, 122, 245, 1)',
          // ['==', ['get', 'type'], 'hotel'], 'rgba(39, 122, 245, 1)',
          // ['==', ['get', 'type'], 'hideout'], 'rgba(39, 122, 245, 1)',

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
            ["==", ["get", "type"], "hyperspace"], "rgba(139, 178, 141, 0.6)",
            "rgba(117, 186, 143, 0.05)" // default green
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

export function accelerationCheck() {
  if (typeof window === 'undefined') return // SSR guard

  // put on delay to not hurt initial load
  setTimeout(() => {
    // const gl = wrapper.getMap().getCanvas().getContext("webgl2")
    // const renderer = gl.getParameter(gl.getExtension('WEBGL_debug_renderer_info').UNMASKED_RENDERER_WEBGL)
    // if (/swiftshader/i.test(renderer) ||
    // /llvmpipe/i.test(renderer) ||
    // /soft.*?renderer/i.test(renderer) ||
    // /angle/i.test(renderer)) {
    //   window.alert(
    //     `WARN: No hardware acceleration found. Your performance will be greatly affected.\n${renderer}`
    //   )
    // }

    const hasHWA = (() => {
      // create a test function for both "default" drawing and forced software
      const test = (force = false) => {
        // Firefox (at lest on macOS) doesn't accelerate OffscreenCanvas
        const canvas = document.createElement("canvas");
        // willReadFrequently will force software rendering
        const ctx = canvas.getContext("2d", { willReadFrequently: force });
        ctx.moveTo(0, 0),
          ctx.lineTo(120, 121); // HWA is bad at obliques
        ctx.stroke()
        return ctx.getImageData(0, 0, 200, 200).data.join();
      };
      // check that both return different results
      return test(true) !== test(false);
    })();

    if (!hasHWA) {
      window.alert(
        "No hardware acceleration found. Your performance will be greatly affected."
      )
    }
  }, 6_000)
}

// best not to repeat yourself
export function getDescriptionFromFaction(map, faction) {
  if (map.includes("lancer")) {
    switch (faction) {
      case "Union":
      case "union":
        return "Union is a post-capital and communal hegemony that seeks to unify humanity under a cooperative framework. It emerged from the devastation of the Little Wars on Cradle and expanded outward through successive waves of colonization supported by advanced technologies such as blink gates, the omninet, and manna. Member states retain internal autonomy but are linked through Union’s wider institutions and infrastructure. The trajectory of Union reflects its changing ideological basis. FirstComm prioritized democratic governance and rebuilding. SecComm oversaw rapid territorial expansion and pursued military solutions to conflicts with other human states. ThirdComm arose from popular revolution and emphasizes peaceful reintegration, ethical oversight, and adherence to the Utopian Pillars. Across all periods, Union has functioned as both a political authority and a coordinating body for human survival and development in interstellar space.";
      case "HA":
        return "Harrison Armory is a Big Four corpro-state headquartered on Ras Shamra, founded in 4515u by former SecComm loyalists. Originally a heavy ordnance producer, it expanded into full-frame manufacturing and became the Orion Arm’s leading military supplier, recognized for durable, heat-resistant designs with a brutalist aesthetic. Following the Interest War with the Karrakin Trade Baronies, Union permitted the Armory to retain sovereignty and operate the Think Tank, a restricted NHP collective used for research and paracausal development. The Armory’s expansion is organized through the Purview, its network of integrated colonies. Military power is projected by the Armory Naval Command, which fields doctrine-driven carrier groups and specialized frigates, and by the Colonial Legionnate, which manages planetary annexation through advance teams and large-scale legions. Service in these forces offers citizenship and advancement, reinforcing loyalty among both citizens and subject populations. The Armory’s focus on military capacity and territorial growth makes it the most overtly imperial of the corpro-states.";
      case "KTB":
        return "The Karrakin Trade Baronies (formally the Federal Karrakin Monarchy) are a powerful Union member-state whose industrial capacity underpins much of the post-scarcity economy of the Galactic Core. Emerging in the 4th millennium u after the Union Karrakin War, the Baronies developed into a society defined by hereditary nobility, strict social stratification, and massive industrial output. Their economy and mega engineering projects ranging from star dismantling to planet-scale farming give them immense leverage in galactic politics, often allowing them to operate outside Union’s ethical norms. Though defeated in the Interest War by Harrison Armory, the conflict cemented the prominence of mechs in Baronic society and led to military reforms centered on house companies and Free Companies. The Baronies are governed by a federation of noble houses led by the Prime Baron and Baronic Council, balanced against the broader Ignoble House. Nobility monopolizes political rights, while the vast ignoble population over 95% forms the labor base yet remains excluded from hereditary power. Despite this hierarchy, Republican movements and uprisings like the Ungratefuls have challenged the monarchy, reflecting growing internal strain. Cultural life is marked by the Passions, a decentralized spiritual system in which individuals are bonded to archetypal entities influencing fate. Collectively, the Baronies represent both a vital industrial partner to Union and a deeply conservative, unequal society whose persistence continues to spark controversy across the Orion Arm.";
      case "Dawnline Shore":
        return "The Dawnline Shore is a frontier sector on the proximal edge of the Orion Arm, roughly three lightyears across and containing twelve inhabited, resource-rich worlds. Its unusually high planetary density made it a prized target for colonial expansion and resource extraction. First seeded by Union during the First Expansion Period, many early colonies failed, leaving behind remnants later claimed by the Federal Karrakin Monarchy after 3007u. By the 4th millennium u the region, renamed the Baronic Interest, was secured as Karrakin territory and became central to conflicts with Harrison Armory, including the Interest War. Geographically the Shore is organized as a loose chain of systems labeled DS1 through DS12, with clusters of worlds divided by the half-lightyear Palisade Strait. DS2 and DS9 functioned historically as entry points for traffic arriving from the Long Rim, and later Blink 1 near New Madrassa served as the main transit hub into the region. The Shore’s worlds and stations became points of contention not only for the Baronies and the Armory but also for Union administrators attempting to stabilize the sector. Its position as both a rich resource zone and a frontier transit corridor has made the Dawnline Shore one of the most politically significant border regions in Union space.";
      case "Boundary Garden":
        return "Boundary Garden is a contested frontier region located near Cornucopia and the wider Dawnline Shore. It is characterized by dense industrial cities, agricultural plains, and major orbital infrastructure that made it an important strategic sector in the early 6th millennium u. The Garden has historically served as both a productive heartland and a battleground, caught between Union forces and the expansion of the Aunic Ascendancy. The sector is defined by its mix of terrestrial settlements and orbital platforms, including large industrial cities such as Boundary Industrial and supporting shipyards and mining stations. Its geography placed it along vital blink and nearlight transit corridors, which elevated its significance during conflicts between Union, local revolutionary movements, and Aunic crusading fleets. Several key battles were fought across Cornucopia’s skies and the surrounding orbital defenses, with heavy use of Ofanim chassis and mass fleet actions. Boundary Garden today is remembered as a symbol of both resilience and devastation. Its cities, fields, and orbitals became iconic examples of how frontier settlements could be transformed into major theaters of war. While politically tied to larger struggles between Union and rival powers, the Garden’s local populations and terrain defined its importance: a crossroads where agricultural wealth, industrial capacity, and transit routes converged into one of the most hard-fought sectors of the Orion Arm.";
      case "The Long Rim":
        return "The Long Rim is a corridor of space at the far edge of Union’s reach, stretching between Rao Co Station, the most distant active blink gate, and the contested Dawnline Shore. Though officially marked as empty and barren, the region is filled with derelict stations, mined-out asteroids, and wreckage from old conflicts. It is also one of the busiest sub-blink shipping lanes in the Orion Arm, moving vast amounts of cargo, people, and resources between the Core and frontier space. The Rim has no central authority and exists as a patchwork of settlements, stations, and small powers sustained by trade and survival. It is a place where shipping routes intersect with piracy, local enterprises rise and fall, and Union oversight is limited. Geography and circumstance make it both a vital thoroughfare and a volatile frontier, defined by constant movement and the uncertain balance of those who live and work there.";
      case "SSC":
        return "SSC rose from the First Expansion Period as a cooperative venture that combined vast private wealth with early Union contracts. Initially known for space travel equipment, it soon found its niche in personalized hardsuits and advanced augmentation, appealing to elite customers in the Galactic Core. As transhumanist experimentation was curtailed after the Deimos Event, SSC focused on refining human potential through genetics, establishing the Constellar Worlds program as the cornerstone of its economic model. These worlds served both as habitats and as reservoirs of genetic diversity, marketed to colonial ventures, militaries, and medical clients seeking tailored human adaptation. Structurally, SSC blends research, luxury production, and corporate governance. Its Exotic Materials Group maintains technological superiority, while ateliers like Atelier Celeste supply high-prestige equipment in limited runs. The Constellar Congress connects and oversees its territories as a shared omninet polity, supported by Constellar Security forces and the covert Midnight program. Key product lines include BELLA CIAO combat frames and the LUX-Iconic commission series, which extend SSC’s philosophy of customization and exclusivity across civilian and military markets. With close ties to the Karrakin Trade Baronies, SSC remains a powerful corpro-state, defining itself by its pursuit of crafted human evolution and the creation of technology designed for the individual.";
      case "Horis":
      case "horis":
        return "HORUS is a decentralized and poorly understood omninet-based entity, often described more as a loose collection of actors and phenomena than a conventional organization. Records of its existence date back to First Committee, though its activity accelerated after the Deimos Event in the 31st century u. Its structure is opaque, with most activity carried out by dispersed cells and individuals linked through encrypted codices, shared memes, and anonymous directives. The only broadly consistent theme is the release of information and technology into the public sphere, often in defiance of regulation, and the pursuit of open access across the omninet. HORUS became one of the Big Four not through territory or industrial output, but through ubiquity and influence. It is a prolific source of unregulated schematics, anomalous software, and paracausal technology, distributed through irregular methods such as anomalous printer events in conflict zones. Its mechs follow the “pattern group” model, combining experimental and esoteric components into unpredictable frames, with licenses appearing through cryptic processes rather than official channels. Though its leadership, origins, and long-term goals remain unclear, HORUS continues to shape the galactic landscape by undermining control of information and proliferating dangerous but highly sought-after technology.";
      case "IPS-N":
        return "Interplanetary Shipping-Northstar is one of the Big Four corpro-states, formed by the merger of Interplanetary Shipping Inc. and Northstar Corporation in the late third millennium u. Its core mission centers on interstellar transport and zero-g operations, supported by a long history of shipbuilding that stretches back to early nearlight expansion. IPS-N helped standardize space combat practices and equipment, and it emphasizes modularity through the QuickMod design system that keeps frames serviceable and upgradable over long timelines. It also operates Northstar Realignment facilities to assist long-haul travelers with temporal acclimation. Organizationally, IPS-N secures trade with Trunk Security, a patrol arm focused on anti-piracy across major lanes, and it fields Northstar Galactic Command as a contract force integrated into client militaries during deployments. The company maintains a wide presence on blink stations and spaceports, with Carina in the Argo Navis system as headquarters and Luna sites preserved as a museum. Partnerships include Albatross, which IPS-N equips and supports. Product lines span civilian and military hulls and frames.";
      default:
        return ""
    }
  } else if (map === "alien") {
    switch (faction) {
      case "UA":
        return "The United Americas, abbreviated as the UA, was a major interstellar human superpower formed in 2104 by North, Central, and South America. The United Americas maintained a formidable fighting force including the United States Colonial Marine Corps, as well as the most powerful industrial base in the Middle Heavens. In 2202, two years short of its centennial, the UA joined with an allied government, the Three World Empire, to form the United Systems."
      case "UPP":
        return "The Union of Progressive Peoples (UPP) is a socialist interstellar power formed in the early 22nd century by Russia, China, Germany, Spain, Vietnam, and other allied nations. Its territory span the Outer Veil, Outer Rim, and the Frontier. The UPP rejects corporate influence and instead emphasizes centralized state control, relying on subterranean settlements and habitation domes rather than terraforming. Locked in a cold war with the United Americas, the UPP fields the Space Operating Forces as its elite military and employs the Ministry of Space Security to maintain internal control and conduct espionage abroad."
      case "3WE":
        return "The Three World Empire is a technocratic-parliamentary bloc founded by the United Kingdom and Japan in the late 21st century, later joined by India and other partners. Its territory anchors Sol and stretches across the Core Systems and Outer Veil, with limited reach into the Outer Rim and the Frontier known collectively as the Anglo Japanese Arm. The state relies heavily on Weyland Yutani for technology and naval support, while fielding its own navy and Royal Marines Commandos for limited interventions. It generally aligns with the United Americas, keeps wary watch on the UPP, and prefers stability over large shooting wars."
      case "ICSC":
        return "The Independent Core System Colonies (ICSC) are a loose alliance of independent worlds centered in the New Eden Sector of the Core Systems. Originally founded in the 2080s as the Central Space Consortium by corporations seeking to avoid taxation and government oversight, the bloc grew into a haven for colonies and settlers seeking autonomy. Each member world maintains its own laws, while corporate powers such as Weyland Yutani, Seegson, and Hyperdyne use the ICSC as a base for trade, banking, and covert activity. The Consortium maintains a combined mercenary fleet for security, though coordination is poor compared to national militaries. Despite sanctions from the United Americas and the Three World Empire, the ICSC thrives through trade, smuggling, and recruitment of new colonies, and its independence made it a key player in shaping the political landscape that later produced the United Systems."
      // case "ICC":
      //   return "The Interstellar Commerce Commission (ICC) is the primary body overseeing interstellar trade, shipping lanes, and quarantine enforcement across human space. It regulates starship licensing, inspects cargo, and can seize vessels suspected of carrying contraband or hazardous materials. The ICC has the authority to enforce system-wide quarantines and, in extreme cases, order full planetary sterilization to contain outbreaks. Although presented as an independent authority, it is in practice controlled by Weyland-Yutani, aligning its operations with corporate interests while maintaining formal ties with the United Americas and the Three World Empire."
      default:
        return ""
    }
  }
}

// --- STAR WARS grid constants you already have ---
const SW_TOP_LAT = 6.5;           // row 0 starts at 6.5°, rows increase going south
const SW_STEP = 0.65;          // degrees per row/column step
const SW_ZERO_LON_LETTER = "L";   // 0° meridian uses column "L"

const fixNegZero = (n) => (Object.is(n, -0) ? 0 : n);

// 0-based Excel-like
function indexToLetters(index) {
  let n = Math.max(0, index), s = "";
  while (true) {
    const rem = n % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor(n / 26) - 1;
    if (n < 0) break;
  }
  return s;
}
function letterToIndex(letter) {
  const up = letter.toUpperCase();
  let n = 0;
  for (let i = 0; i < up.length; i++) n = n * 26 + (up.charCodeAt(i) - 65 + 1);
  return n - 1;
}

// ---------- Rounded (for labels) ----------
function swRoundedColFromLon(lonDeg) {
  const baseIndex = letterToIndex(SW_ZERO_LON_LETTER); // 'L' -> 11
  const offset = Math.round(lonDeg / SW_STEP + (lonDeg === 0 ? 0 : Math.sign(lonDeg) * 1e-9));
  return indexToLetters(baseIndex + offset);
}
function swRoundedRowFromLat(latDeg) {
  return Math.round((SW_TOP_LAT - latDeg) / SW_STEP + 1e-9);
}

// ---------- Cell membership (truth) ----------
// Half-open intervals with transitions ON lines:
// • Columns: [k*step, (k+1)*step) belong to column base+k (east-inclusive).
// • Rows:     at lat lines SW_TOP_LAT - k*step belong to row k (north-inclusive).
function swCellColFromLon(lonDeg) {
  const baseIndex = letterToIndex(SW_ZERO_LON_LETTER);
  const k = Math.floor(lonDeg / SW_STEP); // 0 at [0, 0.65), -1 at [-0.65, 0), 1 at [0.65, 1.3), ...
  return indexToLetters(baseIndex + k);
}
function swCellRowFromLat(latDeg) {
  const k = Math.floor((SW_TOP_LAT - latDeg) / SW_STEP); // 0 at [6.5 down to >5.85], 1 at [5.85 down to >5.2], ...
  return k;
}

// ---------------- factory -------------------
export function gridHelpers(name, GRID_DENSITY) {
  const EPS = 1e-9;

  // single-axis: rounded (labels)
  function axisLabel(deg, alignment) {
    if (name === 'alien') {
      const idx = Math.round(deg * (1 / GRID_DENSITY) + (deg === 0 ? 0 : Math.sign(deg) * EPS));
      return String(idx === 0 ? 0 : idx);
    }
    if (name === 'fallout') {
      return String(Math.floor(deg)); // Fallout labels already behave like cells
    }
    if (name === 'starwars') {
      const v = fixNegZero(+deg.toFixed(10));
      return alignment ? swRoundedColFromLon(v) : String(swRoundedRowFromLat(v));
    }
    return deg.toFixed(1);
  }

  // single-axis: cell (truth)
  function axisCell(deg, alignment, decimal = 1) {
    if (name === 'alien') {
      // exact cell binning by GRID_DENSITY, transitions at lines
      const k = Math.floor(deg / GRID_DENSITY);
      return String(k);
    }
    if (name === 'fallout') {
      return String(Math.floor(deg));
    }
    if (name === 'starwars') {
      const v = fixNegZero(+deg.toFixed(10));
      return alignment ? swCellColFromLon(v) : String(swCellRowFromLat(v));
    }
    return deg.toFixed(decimal);
  }

  // keep using this for the grid package (pretty labels)
  function formatLabels(deg, alignment) {
    return axisLabel(deg, alignment);
  }

  // use this for your HUD; returns BOTH variants
  function coordFromLngLat(lon, lat, decimal = 1) {
    // rounded (for display labels)
    const rCol = axisLabel(fixNegZero(lon), true);
    const rRow = axisLabel(fixNegZero(lat), false);

    // cell/truth (for exact membership)
    const cCol = axisCell(fixNegZero(lon), true, decimal);
    const cRow = axisCell(fixNegZero(lat), false, decimal);

    const roundedLabel = name === 'starwars' ? `${rCol}-${rRow}` : `${rCol},${rRow}`;
    const cellLabel = name === 'starwars' ? `${cCol}-${cRow}` : `${cCol},${cRow}`;

    return {
      rounded: { col: rCol, row: rRow, label: roundedLabel },
      cell: { col: cCol, row: cRow, label: cellLabel },
      meta: {
        system: name,
        input: { lon, lat },
        nearest: {
          lon: GRID_DENSITY
            ? fixNegZero(Math.round(lon / GRID_DENSITY) * GRID_DENSITY)
            : lon,
          lat: GRID_DENSITY
            ? fixNegZero(Math.round(lat / GRID_DENSITY) * GRID_DENSITY)
            : lat,
        },
        density: GRID_DENSITY,
      },
    };
  }

  return { formatLabels, coordFromLngLat };
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
  return `${r}, ${g}, ${b}`;
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
