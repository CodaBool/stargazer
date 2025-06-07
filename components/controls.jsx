// TODO: try to switch back to MapboxDraw
// import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { useControl } from 'react-map-gl/maplibre'
import MapboxDraw from "@hyvilo/maplibre-gl-draw"
import { useEffect, useState } from 'react'
import randomName from '@scaleway/random-name'
import { useRouter } from 'next/navigation'
import { hexToRgb } from '@/lib/utils'
import { create } from 'zustand'

export const useDraw = create(set => ({
  draw: null,
  setDraw: draw => set({ draw }),
  recreateListeners: null,
  setRecreateListeners: () => set({ recreateListeners: Math.random() }),
}))

export default function Controls({ name, params, setSize, TYPES, STYLES }) {
  const [saveTrigger, setSaveTrigger] = useState()
  const [mapId, setMapId] = useState()
  const draw = useDraw(d => d.draw)
  const setDraw = useDraw(d => d.setDraw)
  const setRecreateListeners = useDraw(d => d.setRecreateListeners)
  const router = useRouter()

  useEffect(() => {
    if (!draw || !mapId) return
    const geojson = draw.getAll()
    if (!geojson.features.length) return

    geojson.features.forEach(f => {
      const availableTypes = Object.keys(TYPES).filter(t =>
        f.geometry.type.toLowerCase() === t.split(".")[1]
      ).map(t => t.split(".")[0])
      if (!f.properties.name) {
        f.properties.name = randomName('', ' ')
        draw.add(f)
      }
      if (!f.properties.type) {
        // console.log("found missing type for feature", f, "adding", availableTypes[0])
        f.properties.type = availableTypes[0] || "placeholder"
        draw.add(f)
      }
      if ((f.geometry.type === "Point" || f.geometry.type.includes("Poly")) && !f.properties.fill) {
        f.properties.fill = STYLES.MAIN_COLOR
        draw.add(f)
      }
      if ((f.geometry.type === "LineString" || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
        f.properties.stroke = `rgba(${hexToRgb(STYLES.HIGHLIGHT_COLOR)}, 0.5)`
        draw.add(f)
      }
    })

    const prev = JSON.parse(localStorage.getItem('maps')) || {}
    localStorage.setItem('maps', JSON.stringify({
      ...prev, [mapId]: {
        geojson,
        name: prev[mapId]?.name || randomName('', ' '),
        updated: Date.now(),
        map: name,
        config: prev[mapId]?.config || {},
      }
    }))
  }, [saveTrigger, mapId])

  useEffect(() => {
    if (!draw) return
    // hacky solution to prevent draw being used before initialization
    try { draw.getAll() } catch (error) { return }
    const savedMaps = JSON.parse(localStorage.getItem('maps')) || {}
    const mapsWithData = Object.keys(savedMaps).filter(id => id.split('-')[0] === name)

    // if no data exists set an id and save
    if (!mapsWithData.length || params.get("new")) {

      console.log("no data exists, or given create param", params.get("new"), "maps =", savedMaps)
      // TODO: consider const uuid = crypto.randomUUID()
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
      // TODO: toast system, show a message "restored local map"
      // console.log("chose map from URL param")
      const mId = `${name}-${params.get("id")}`
      const geojson = savedMaps[mId]?.geojson

      if (geojson) {
        setMapId(mId)
        draw.add(savedMaps[mId].geojson || {})
        return
      } else {
        // TODO: give toast message "map not found locally"
        console.log("could not find map using id", mId)
      }
    }

    for (const [key, data] of Object.entries(savedMaps)) {
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
      // console.log("found", mapsWithData.length, "previous maps for", mapName, "from", daysAgo)
      // TODO: need a way to have multiple stored maps for the same map
      const restore = window.confirm(`${mapsWithData.length === 1 ? "A previous session was found" : mapsWithData.length + " previous sessions found, one"} from ${daysAgo}. Would you like to ${mapsWithData.length === 1 ? "restore this session" : "choose a session to restore"}?`)
      if (restore) {
        if (mapsWithData.length === 1) {
          // console.log("restore session, only one found", key)
          setMapId(key)
          draw.add(data.geojson)
          return
        } else {
          console.log(`need to redirect to /${name}/export page since there are multiple`, key)
          setSize(null)
          router.push(`/${name}/export`)
          return
        }
      } else {
        // TODO: toast system, show a message "fresh map started"
        console.log("start a new session")

        // duplicate of ?new=1 conditional
        const id = Date.now()
        // TODO: consider const uuid = crypto.randomUUID()
        setMapId(`${name}-${id}`)
        const url = new URL(window.location).toString().split("?")[0] + "?id=" + id
        // console.log("replaced URL to", url)
        window.history.replaceState(null, '', url)

        setSaveTrigger(p => !p)
        return
      }
    }
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
