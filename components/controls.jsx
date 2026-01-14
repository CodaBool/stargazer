import { useControl, useMap } from '@vis.gl/react-maplibre'
import MapboxDraw from "@hyvilo/maplibre-gl-draw"
import { useEffect, useState } from 'react'
import randomName from '@scaleway/random-name'
import { useRouter } from 'next/navigation'
import { hexToRgb, getMaps, localSet, useStore, isMobile } from '@/lib/utils'
import { create } from 'zustand'
import { toast } from 'sonner'

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
  // const { setTutorial, tutorial } = useStore()
  const [mapId, setMapId] = useState()
  const { map: wrapper } = useMap()
  const mobile = isMobile()
  const draw = useDraw(d => d.draw)
  const setDraw = useDraw(d => d.setDraw)
  const setRecreateListeners = useDraw(d => d.setRecreateListeners)
  const router = useRouter()

  useEffect(() => {
    if (!draw || !mapId) return

    const geojson = draw.getAll()

    if (!geojson.features.length) return

    geojson.features.forEach(f => {
      // TYPES: {
      //   "polygon": ["sector", "cluster", "nebulae"],
      //   "point": ["station", "jovian", "moon", "terrestrial", "desert planet", "ocean planet", "barren planet", "ice planet", "asteroid", "lava planet", "ringed planet", "gate", "red dwarf", "orange star", "yellow star", "white dwarf", "red giant", "red supergiant", "blue giant", "blue supergiant", "red star", "blue star", "black hole", "wormhole", "exoplanet", "neutron star", "comet"],
      //   "linestring": ["guide", "hyperspace"],
      // },

      const types = TYPES[f.geometry.type.toLowerCase().trim()]
      if (!f.properties.name) {
        f.properties.name = randomName('', ' ')
        draw.add(f)
      }
      if (!f.properties.type) {
        console.log("Found point with no type, setting randomly from", TYPES)
        // console.log("found missing type for feature", f, "adding", availableTypes[0])
        f.properties.type = types[0] || "placeholder"
        draw.add(f)
      }
      if ((f.geometry.type === "Point" || f.geometry.type.includes("Poly")) && !f.properties.fill) {
        if (f.geometry.type.includes("Poly")) {
          f.properties.fill = `rgba(${hexToRgb(getRandomNeonColor())}, 0.1)`
        } else {
          f.properties.fill = getRandomNeonColor()
        }
        draw.add(f)
      }
      if ((f.geometry.type.includes("LineString") || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
        if (f.properties.fill?.length > 7) {
          f.properties.stroke = f.properties.fill.replace(/, \d+\.\d+\)$/, ', .5)');
        } else {
          f.properties.stroke = `rgba(${hexToRgb(getRandomNeonColor())}, 0.5)`
        }
        draw.add(f)
      }
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
      }
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
  return null
}
