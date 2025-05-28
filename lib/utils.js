import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import POSTWAR_GREEN from '@/lib/style.json'
import { toKML } from "@placemarkio/tokml"
import { feature } from "topojson-client"
import { topology } from "topojson-server"

export const MENU_HEIGHT_PX = 40
export const SCALE = 500
export const CENTER = [-78, 26]

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// export function debounce(func, wait, immediate) {
//   var timeout;
//   return function () {
//     var context = this, args = arguments;
//     var later = function () {
//       timeout = null;
//       if (!immediate) func.apply(context, args);
//     };
//     var callNow = immediate && !timeout;
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//     if (callNow) func.apply(context, args);
//   };
// }

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
export const AVAILABLE_PROPERTIES = {
  "type": "dual purpose, a category for the geometry but will also be used as an SVG<br/> if matching the name of <a style='color: rgb(133, 163, 255);' target='_blank' href='https://github.com/CodaBool/stargazer.vercel.app/wiki/Sci%E2%80%90Fi-maps-for-all#icon'>available icons</a> and no icon key is present|required|type=text",
  "name": "geometry name|required|type=text",
  "icon": "an SVG icon, can be one of the preset icons or a remote URL (<a href='https://gist.githubusercontent.com/CodaBool/8c4ae1b4cc000c1b96d4f881175adbdd/raw/ea260e9614b4c91dcff4b6511f5b53793dd043ec/farmer.svg' target='_blank' style='color: rgb(133, 163, 255);'>e.g.</a>).<br/>This takes priority over the type key, which comes with a default icon.<br/>Using one from the thousands of preset icons <b>is recommended</b>.<br/>Since color results are not guaranteed correct if using the remote URL method.|type=text",
  "description": "markdown text which describes the geometry|type=text",
  "faction": "the faction this geometry aligns with, typically used with territories to change the color|type=text",
  "link": "Foundry uuid, can be for a journal, page, or macro|type=text",
  "unofficial": "shows a tag marking the geometry as unofficial|type=true/false",
  "label": "used to determine if a label should be shown above the geometry|type=true/false",
  "capital": "shows a tag marking the geometry as a capital|type=true/false",
  "destroyed": "shows a tag marking the geometry as destroyed|type=true/false",
  "city": "comma separated list of cities present at the location|type=comma list",
  "alias": "comma separated list of alternative names|type=comma list",
  "fill": "interior color for Territories polygons. Also works as the line color for Locations. Guides do use fill.|type=rgba",
  "stroke": "line color for Territories and Guides. Locations do not use stroke.|type=rgba",
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

export function createPopupHTML(e, isGalaxy) {
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

  const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/" + (isGalaxy ? "lancer/" : "utils.jsL107/")

  return `
    <div class="min-w-64">
      <div class="w-full">
        <p><b>${e.features[0].properties.name}</b> <b class="text-center text-gray-400 ml-4">${type}</b></p>
      </div>
      <div style="width:80px;height:80px;float:right;padding-left:10px">
        <img src="${svgBase + type + '.svg'}" alt="${type}" width="80px" height="80px" align="left">
      </div>
      <hr class="my-3"/>
      <p>${description}</p>
      <div class="flex flex-col items-center">${badges}</div>
    </div>
  `
}

export function getConsts(map) {
  if (map === "postwar") {
    return {
      CENTER: [-100, 40],
      SCALE: 1400,
      STYLE: POSTWAR_GREEN,
      DISTANCE_CONVERTER: 0.621371, // to mile
      LAYOUT_OVERIDE: {
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-size": .8,
      },
      IGNORE_POLY: ["country", "state"],
      LAYER_PRIO: ["postwarFaction", "region"],
      QUOTE: "I survived because the fire inside me burned brighter than the fire around me",
      UNIT: "miles",
      CLICK_ZOOM: 8,
      TYPES: {
        "territory.polygon": "Territory (polygon)",
        "region.polygon": "Region (polygon)",
        "guide.linestring": "Guide (line)",
        "base.point": "Base",
        "settlement.point": "Settlement",
        "town.point": "Town",
        "city.point": "City",
        "vault.point": "Vault",
        "building.point": "Building",
        "cave.point": "Cave",
        "compound.point": "Compound",
      },
      BG: "#06402B 0%, #000000 100%",
      NO_PAN: [],
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
      CENTER: [-78, 26],
      SCALE: 400,
      // Janederscore's map is 135ly across. Convert km so they match up
      DISTANCE_CONVERTER: 0.013043478, // to ly
      LAYOUT_OVERIDE: {
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
      IGNORE_POLY: ["line"],
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
      UNIT: "ly",
      QUOTE: "...along ancient charted paths and out toward new worlds. Union could not bring their dead back home. But they would choke the stars with the living",
      TYPES: {
        "sector.polygon": "Sector (polygon)",
        "cluster.polygon": "Star Cluster (polygon)",
        "guide.linestring": "Guide (line)",
        "terrestrial.point": "Terrestrial",
        "star.point": "Star",
        "station.point": "Station",
        "gate.point": "Gate",
        "jovian.point": "Jovian",
        "moon.point": "Moon",
      },
      LAYER_PRIO: ["cluster", "sector"],
      CLICK_ZOOM: 5,
      NO_PAN: ["line"],
      BG: "#000A2E 0%, #000000 100%",
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
  } else if (map === "mousewars") {
    return {
      CENTER: [-78, 26],
      SCALE: 400,
      LAYOUT_OVERIDE: {
        "icon-size": .7,
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
      UNIT: "ly",
      QUOTE: "...punch it",
      TYPES: {
        "sector.polygon": "Sector (polygon)",
        "cluster.polygon": "Star Cluster (polygon)",
        "guide.linestring": "Guide (line)",
        "terrestrial.point": "Terrestrial",
        "star.point": "Star",
        "station.point": "Station",
        "gate.point": "Gate",
        "jovian.point": "Jovian",
        "moon.point": "Moon",
      },
      LAYER_PRIO: ["cluster", "sector"],
      CLICK_ZOOM: 5,
      NO_PAN: ["line"],
      BG: "#000A2E 0%, #000000 100%",
      VIEW: {
        longitude: 14,
        latitude: -29,
        zoom: 2,
        // [[left, bottom], [right, top]]
        maxBounds: [[-130, -80], [148, 82]],
      },
      MAX_ZOOM: 13,
      MIN_ZOOM: .2,
    }
  }
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

export function combineAndDownload(type, serverTopojson, clientGeojson) {
  // Function to normalize properties and ensure FID is a string
  function combineLayersForTopoJSON(geojsons) {
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


// use color
export const styles = {
  territory: {
    strokeWidth: 3,
    opacity: 1,
    fillRandom: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    stroke: "black",
  },
  territoryLabel: {

  },
  guide: {
    strokeWidth: 2,
    opacity: 1,
    fill: "none",
    stroke: "rgba(255, 255, 255, 0.2)",
  },
  guideLabel: {
    fontSize: ".7em",
    fill: "white",
  },
  locationMinor: {
    // TODO: lancer has two fills for this
    fill: "slategray",
    stroke: "black",
    opacity: 1,
  },
  locationMajor: {
    // TODO: lancer has two fills for this
    fill: "teal",
    stroke: "black",
    opacity: 1,
  },
  locationLabel: {
    // TODO: dependent on location size
    fontSizeDefault: "8px",
    fontWeightDefault: 600,
    fill: "white",
    opacity: 0
  },
}

export function important(map, { name, type, faction }) {
  if (map === "postwar") {
    if (type === "vault") return true
  } else if (map.includes("lancer")) {
    if (type === "gate") return true
  }
  return false
}

export function accent(map, opacity, overide) {
  let rgb = "61,150,98"
  if (map.includes("lancer")) {
    rgb = overide || "61,150,98"
  } else if (map === "postwar") {
    rgb = overide || "255,215,120"
  } else if (map === "mousewars") {
    rgb = overide || "61,150,98"
  }
  return `rgba(${rgb},${opacity})`
}

export const searchBar = {
  "lancer": {
    background: "rgb(2 6 15)",
    border: "rgb(30 41 59)"
  },
  "lancer_starwall": {
    background: "rgb(2 6 15)",
    border: "rgb(30 41 59)"
  },
  "postwar": {
    background: "#020e03",
    border: "#0a400d",
  },
  "mousewars": {
    background: "rgb(2 6 15)",
    border: "rgb(30 41 59)"
  },
}

export function genLink(d, map, type) {
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
  } else if (map === "postwar") {
    const theWord = "f" + "a" + "l" + "l" + "o" + "u" + "t"
    return type === "href" ? `https://${theWord}.fandom.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  } else if (map === "mousewars") {
    const theWord = "s" + "t" + "a" + "r" + "w" + "a" + "r" + "s"
    return type === "href" ? `http://${theWord}.wikia.com/wiki/Special:Search?query=${encodeURIComponent(d.properties.name)}` : "_blank"
  }
}

export function getColorExpression(map, style, geo) {
  if (map === "postwar") {
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
          ['==', ['get', 'type'], 'line'], 'rgba(255, 255, 255, 0.15)',
          ['==', ['get', 'type'], 'cluster'], 'rgba(39, 83, 245, 0.3)',
          ['==', ['get', 'name'], 'Karrakis Trade Baronies'], 'rgba(133, 92, 0, 1)',
          ['==', ['get', 'name'], 'Harrison Armory'], 'rgba(99, 0, 128, 1)',
          ['==', ['get', 'name'], 'IPS-N'], 'rgba(128, 0, 0, 1)',
          ['==', ['get', 'faction'], 'interest'], 'rgba(84, 153, 199, .3)',
          ['==', ['get', 'name'], 'Union Coreworlds'], 'rgba(245, 39, 39, 0.3)',
          ['==', ['get', 'type'], 'territory'], 'rgba(255, 255, 255, 0.2)',
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
          ['==', ['get', 'type'], 'cluster'], 'rgba(39, 122, 245, 0.1)',
          ['==', ['get', 'faction'], 'KTB'], 'rgba(133, 92, 0, .4)',
          ['==', ['get', 'faction'], 'HA'], 'rgba(99, 0, 128, .4)',
          ['==', ['get', 'faction'], 'IPS-N'], 'rgba(128, 0, 0, .4)',
          ['==', ['get', 'faction'], 'union'], 'rgba(245, 81, 39, 0.2)',
          ['==', ['get', 'name'], 'The Interest'], 'rgba(84, 153, 199, .3)',
          ['==', ['get', 'name'], 'The Long Rim'], 'rgba(84, 153, 199, .3)',
          ['==', ['get', 'type'], 'gate'], 'teal',
          ['==', ['get', 'type'], 'star'], 'lightgray',
          ['==', ['get', 'type'], 'line'], 'rgba(0, 0, 0, 0)',
          'rgba(255, 255, 255, 0.2)' // default color
        ]
      ];
    }
  } else if (map === "mousewars") {
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
  }
  console.log("ERR: getColorExpression error, likely new map and needs conditionals added")
}

export const starHTML = `<img src="data:image/webp;base64,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" width="200px" height="100px" >`

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
