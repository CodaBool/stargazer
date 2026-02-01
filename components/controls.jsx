import { useControl, useMap } from '@vis.gl/react-maplibre'
import MapboxDraw from "@mapbox/mapbox-gl-draw"
import { useEffect, useState } from 'react'
import randomName from '@scaleway/random-name'
import { useRouter } from 'next/navigation'
import { hexToRgb, getMaps, localSet, useStore, isMobile } from '@/lib/utils'
import { create } from 'zustand'
import { toast } from 'sonner'
// import {CircleMode} from "@/components/circleMode.js"
// import {DirectModeOverride} from "@/components/circleModeOver.js"
// working but too simplistic
// import DrawCircle from 'mapbox-gl-draw-circle-mode';
// import RadiusMode from './radiusMode';

// needs patching very bad
// import {
//     CircleMode,
//     DragCircleMode,
//     DirectMode,
//     SimpleSelectMode
// } from 'mapbox-gl-draw-circle';

// needs patching bad
// import {
//     CircleMode,
//     DragCircleMode,
//     DirectMode,
//     SimpleSelectMode
// } from 'mapbox-gl-draw-rounded-circle';

import {
    CircleMode,
    DragCircleMode,
    DirectMode,
    SimpleSelectMode
} from 'maplibre-gl-draw-circle';

// this package allows for curves, but I got serialize errors
// https://github.com/Jeff-Numix/mapbox-gl-draw-bezier-curve-mode
// const baseIds = new Set(drawStyles.map(layer => layer.id));
// const pluginExtras = customStyles.filter(layer => !baseIds.has(layer.id));
// const combinedDrawStyles = [...drawStyles, ...pluginExtras]
// mapbox-gl-draw-bezier-curve-mode

// MapLibre compatibility: mapbox-gl-draw → maplibre classes
MapboxDraw.constants.classes.CANVAS        = 'maplibregl-canvas';
MapboxDraw.constants.classes.CONTROL_BASE  = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group';
MapboxDraw.constants.classes.ATTRIBUTION = 'maplibregl-ctrl-attrib'
// MapboxDraw.modes.draw_circle = DrawCircle


export const useDraw = create(set => ({
  draw: null,
  setDraw: draw => set({ draw }),
  recreateListeners: null,
  setRecreateListeners: () => set({ recreateListeners: Math.random() }),
}))

const neonColors = [
  "#FF00FF", // Neon Magenta
  "#00FFFF", // Neon Cyan
  "#FFFF00", // Neon Yellow
  "#FF1493", // Deep Pink
  "#00FF00", // Lime
  "#00FF7F", // Spring Green
  "#FF4500", // Orange Red
  "#7FFF00", // Chartreuse
];

function getRandomNeonColor() {
  return neonColors[Math.floor(Math.random() * neonColors.length)];
}

export default function Controls({ name, params, setSize, TYPES, GEO_EDIT }) {
  const [saveTrigger, setSaveTrigger] = useState()
  const [mapId, setMapId] = useState()
  const { map: wrapper } = useMap()
  const draw = useDraw(d => d.draw)
  const setDraw = useDraw(d => d.setDraw)
  const setRecreateListeners = useDraw(d => d.setRecreateListeners)
  const router = useRouter()

  useEffect(() => {
    if (!draw || !mapId) return

    const geojson = draw.getAll()

    if (!geojson.features.length) return
    let add

    geojson.features.forEach(f => {
      add = false
      const types = TYPES[f.geometry.type.toLowerCase().trim()]
      if (!f.properties.name) {
        f.properties.name = randomName('', ' ')
        add = true
      }
      if (!f.properties.type) {
        console.log("Found point with no type, setting randomly from", TYPES)
        // console.log("found missing type for feature", f, "adding", availableTypes[0])
        f.properties.type = types[0] || "placeholder"
        add = true
      }
      if ((f.geometry.type === "Point" || f.geometry.type.includes("Poly")) && !f.properties.fill) {
        if (f.geometry.type.includes("Poly")) {
          f.properties.fill = `${getRandomNeonColor()}1A` // 10% opacity
        } else {
          f.properties.fill = getRandomNeonColor()
        }
        add = true
      }
      if ((f.geometry.type.includes("LineString") || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
        if (f.properties.fill?.length > 7) {
          f.properties.stroke = f.properties.fill.replace(/, \d+\.\d+\)$/, ', .5)');
        } else {
          f.properties.stroke = `${getRandomNeonColor()}80` // 50% opacity
        }
        add = true
      }
      if (add) draw.add(f)
    })

    getMaps().then(maps => {
      localSet("maps", {
        ...maps, [mapId]: {
          geojson,
          name: maps[mapId]?.name || randomName('', ' '),
          updated: Date.now(),
          id: Number(mapId.split("-")[1]) || Date.now(),
          meta: maps[mapId]?.meta || {},
          map: name,
          config: maps[mapId]?.config || {},
        }
      })
    })

    if (GEO_EDIT) window.localGet("maps").then(r => console.log(Object.values(r)[0].geojson))

  }, [saveTrigger, mapId])


  // fix draw layer order, since sometimes it's not on top
  useEffect(() => {
    if (!wrapper) return
    const map = wrapper.getMap()
    const moveAllDrawLayersToTop = () => {
      const layers = map.getStyle()?.layers ?? []
      const drawIds = layers.filter(l => l.id.startsWith("gl-draw-")).map(l => l.id)
      if (drawIds.length === 0) return
      // Detach to save on performance, only needs to be done once
      map.off("idle", moveAllDrawLayersToTop)
      drawIds.forEach(id => map.moveLayer(id));
    }
    map.on("idle", moveAllDrawLayersToTop)
    return () => map.off("idle", moveAllDrawLayersToTop)
  }, [wrapper])

  useEffect(() => {
    if (!draw) return
    // hacky solution to prevent draw being used before initialization
    try { draw.getAll() } catch (error) { return }

    getMaps().then(maps => {
      const mapsWithData = Object.keys(maps).filter(id => id.split('-')[0] === name)

      // if no data exists set an id and save
      if (!mapsWithData.length || params.get("new")) {

        console.log("no data exists, or given create param", params.get("new"), "maps =", maps)
        const id = Date.now()
        setMapId(`${name}-${id}`)

        const url = new URL(window.location).toString().split("?")[0] + "?id=" + id
        // console.log("replaced URL to", url)
        window.history.replaceState(null, '', url)

        setSaveTrigger(p => !p)
        return
      }

      // if id is set save
      if (mapId) {
        // console.log("mapId already exists", mapId, "save")
        setSaveTrigger(p => !p)
        return
      }

      // console.log(mapsWithData.length, "map found")

      // if data exists ask to restore and save id
      // const matchingMapsCount = mapsWithData.length;
      // console.log(`Number of saved maps that match the name "${name}":`, matchingMapsCount);

      if (params.get("id")) {
        const mId = `${name}-${params.get("id")}`
        const geojson = maps[mId]?.geojson
        if (geojson) {
          setMapId(mId)
          draw.add(geojson)
          toast.success(`restored local map ${maps[mId]?.name || ""}`)
          return
        } else {
          toast.warning("could not find map using id " + mId)
        }
      }

      for (const [key, data] of Object.entries(maps)) {
        // console.log("storage", data)
        const mapName = key.split('-')[0]
        if (mapName !== name) continue
        let daysAgo = Math.floor((Date.now() - parseInt(key.split('-')[1])) / (1000 * 60 * 60 * 24))
        if (daysAgo === 0) {
          daysAgo = "today"
        } else if (daysAgo === 1) {
          daysAgo = "yesterday"
        } else {
          daysAgo = daysAgo + " days ago"
        }
        const restore = window.confirm(`${mapsWithData.length === 1 ? "A previous session was found" : mapsWithData.length + " previous sessions found, one"} from ${daysAgo}. Would you like to ${mapsWithData.length === 1 ? "restore this session" : "choose a session to restore"}?`)
        if (restore) {
          if (mapsWithData.length === 1) {
            // console.log("restore session, only one found", key)
            setMapId(key)
            draw.add(data.geojson)
            router.replace(new URL(window.location).toString() + `?id=${key.split("-")[1]}`)
            return
          } else {
            console.log(`need to redirect to /#${name} page since there are multiple`, key)
            setSize(null)
            router.push(`/#${name}_local`)
            return
          }
        } else {
          toast.success("new session started")

          // duplicate of ?new=1 conditional
          const id = Date.now()
          setMapId(`${name}-${id}`)
          const url = new URL(window.location).toString().split("?")[0] + "?id=" + id
          // console.log("replaced URL to", url)
          window.history.replaceState(null, '', url)

          setSaveTrigger(p => !p)
          return
        }
      }
    })
  }, [draw])

  function s() {
    if (document.querySelector(".unsaved-text")) {
      document.querySelector(".unsaved-text").style.visibility = 'visible'
    }
    setRecreateListeners()
    setSaveTrigger(p => !p)
  }

  // MapboxDrawOptions
  // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/mapbox__mapbox-gl-draw/index.d.ts

  const d = useControl(
    // create
    () => new MapboxDraw({
      touchEnabled: true,
      controls: {
        combine_features: false,
        uncombine_features: false,
      },
      modes: {

        ...MapboxDraw.modes,
        // draw_radius: RadiusMode,

        // ...MapboxDraw.modes,
        // draw_circle: DrawCircle,
        draw_circle  : CircleMode,
        drag_circle  : DragCircleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode
        // drag_circle  : DragCircleMode,
        // direct_select: DirectMode,
        // simple_select: SimpleSelectMode,
      },
      styles: drawStyles,
    }),
    // add
    ({ map }) => {
      map.on('draw.create', s);
      map.on('draw.update', s);
      map.on('draw.delete', s);
    },
    // remove
    ({ map }) => {
      map.off('draw.create', s);
      map.off('draw.update', s);
      map.off('draw.delete', s);
    },
    // options
    {
      position: "top-right"
    }
  )
  useEffect(() => setDraw(d), [])

  return (
    <div className="maplibregl-ctrl-top-right pointer-events-none">
      <div className="maplibregl-ctrl-group maplibregl-ctrl pointer-events-auto top-[113px] relative">
        <button
          type="button"
          title="Circle tool"
          onClick={() => draw.changeMode('draw_circle')}
          className="mapbox-gl-draw_ctrl-draw-btn"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Ccircle cx='10' cy='10' r='6' fill='none' stroke='black' stroke-width='2'/%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  )
}


// drawStyles.ts
export const drawStyles = [
  // --- POLYGONS ---

  // Polygon fill - inactive
  {
    id: "gl-draw-polygon-fill-inactive",
    type: "fill",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Polygon"],
      ["!=", "mode", "static"],
      ["!=", "meta", "radius"],        // exclude radius circle here
    ],
    paint: {
      "fill-color": "#3bb2d0",
      "fill-outline-color": "#3bb2d0",
      "fill-opacity": 0.1,
    },
  },

  // Polygon fill - active
  {
    id: "gl-draw-polygon-fill-active",
    type: "fill",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Polygon"],
      ["!=", "meta", "radius"],
    ],
    paint: {
      "fill-color": "#fbb03b",
      "fill-outline-color": "#fbb03b",
      "fill-opacity": 0.1,
    },
  },

  // Polygon stroke - inactive
  {
    id: "gl-draw-polygon-stroke-inactive",
    type: "line",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Polygon"],
      ["!=", "mode", "static"],
      ["!=", "meta", "radius"],
    ],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#3bb2d0",
      "line-width": 2,
    },
  },

  // Polygon stroke - active (dashed)
  {
    id: "gl-draw-polygon-stroke-active",
    type: "line",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Polygon"],
      ["!=", "meta", "radius"],
    ],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#fbb03b",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },

  // --- LINES (as you had) ---

  {
    id: "gl-draw-line-inactive",
    type: "line",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "LineString"],
      ["!=", "mode", "static"],
    ],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#3bb2d0",
      "line-width": 2,
    },
  },
  {
    id: "gl-draw-line-active",
    type: "line",
    filter: ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": "#fbb03b",
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },

  // --- POINT FEATURES (already added) ---

  {
    id: "gl-draw-point-point-inactive",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "false"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "circle-radius": 5,
      "circle-color": "#3bb2d0",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  },
  {
    id: "gl-draw-point-point-active",
    type: "circle",
    filter: [
      "all",
      ["==", "active", "true"],
      ["==", "$type", "Point"],
      ["==", "meta", "feature"],
    ],
    paint: {
      "circle-radius": 6,
      "circle-color": "#fbb03b",
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  },

  // --- RADIUS CIRCLE (from RadiusMode) ---

  {
    id: "gl-draw-radius-fill",
    type: "fill",
    filter: [
      "all",
      ["==", "meta", "radius"],
      ["==", "$type", "Polygon"],
    ],
    paint: {
      "fill-color": "#fbb03b",
      "fill-opacity": 0.1,
      "fill-outline-color": "#fbb03b",
    },
  },
  {
    id: "gl-draw-radius-outline",
    type: "line",
    filter: [
      "all",
      ["==", "meta", "radius"],
      ["==", "$type", "Polygon"],
    ],
    layout: {
      "line-cap": "round",   // <—
      "line-join": "round",  // <—
    },
    paint: {
      "line-color": "#fbb03b",
      "line-width": 2,
      "line-dasharray": [0.2, 2],
      // optional soft edge:
      "line-blur": 0.5,
    },
  },

  // --- RADIUS CURRENT POSITION DOT (optional) ---

  {
    id: "gl-draw-radius-current-position",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "currentPosition"],
      ["==", "$type", "Point"],
    ],
    paint: {
      "circle-radius": 4,
      "circle-color": "#fbb03b",
      "circle-stroke-width": 1,
      "circle-stroke-color": "#ffffff",
    },
  },

  // --- VERTICES (as you had) ---

  {
    id: "gl-draw-polygon-and-line-vertex-halo-active",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "circle-radius": 5,
      "circle-color": "#ffffff",
    },
  },
  {
    id: "gl-draw-polygon-and-line-vertex-active",
    type: "circle",
    filter: [
      "all",
      ["==", "meta", "vertex"],
      ["==", "$type", "Point"],
      ["!=", "mode", "static"],
    ],
    paint: {
      "circle-radius": 3,
      "circle-color": "#fbb03b",
    },
  },
];
