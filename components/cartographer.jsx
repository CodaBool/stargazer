'use client'
import { useEffect, useState } from 'react'
import MapComponent from './map'
import { combineLayers, getConsts, getLocationGroups, getMaps, isMobile, accelerationCheck } from '@/lib/utils'
import Map from '@vis.gl/react-maplibre'
import Controls from './controls.jsx'
import Editor from './editor'
import { useSearchParams } from 'next/navigation'
import RBush from 'rbush'
const GEO_EDIT = (false && process.env.NEXT_PUBLIC_URL === "http://192.168.0.16:3000") // local debugging

export default function Cartographer({ name, data, uuid, fid, remoteConfig }) {
  const CONFIG = getConsts(name)
  const [crashed, setCrashed] = useState() // crash reloading
  const [size, setSize] = useState()
  const [combined, setCombined] = useState()
  const [groups, setGroups] = useState()
  const [config, setConfig] = useState()
  const params = useSearchParams()
  const mobile = isMobile()
  CONFIG.VIEW.zoom = params.get("z") || CONFIG.VIEW.zoom
  CONFIG.VIEW.longitude = params.get("lng") || CONFIG.VIEW.longitude
  CONFIG.VIEW.latitude = params.get("lat") || CONFIG.VIEW.latitude
  const locked = params.get("locked") === "1"
  const showControls = params.get("controls") !== "0" && !mobile && !uuid && !locked && !params.get("preview")
  const showEditor = params.get("editor") !== "0" && !mobile && !uuid && !locked && !params.get("preview")

  useEffect(() => {
    if (name === "warhammer" && window.alert("The Warhammer 40k map is still in an unfinished state. Follow on itch.io or GitHub for updates."))
      accelerationCheck()
  }, [])
  useEffect(() => {
    // set size
    if (params.get("width") && params.get("height")) {
      setSize({ width: Number(params.get("width")), height: Number(params.get("height")) })
    } else {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize);

    (async () => {
      if (remoteConfig) {
        setConfig({
          ...CONFIG,
          ...remoteConfig,
        })
        console.log("remote config, skip local map read")
        // duplicate code to below
        const index = new RBush()
        const features = data.features.filter(f =>
          f.geometry.type === "Point" && f.properties.type !== "text"
        ).map(f => ({
          minX: f.geometry.coordinates[0],
          minY: f.geometry.coordinates[1],
          maxX: f.geometry.coordinates[0],
          maxY: f.geometry.coordinates[1],
          feature: f
        }))
        index.load(features)
        setGroups(index)
        return
      }
      const maps = await getMaps()
      const map = maps[name + "-" + params.get("id")]

      if (!map || !params.get("id")) {
        console.log("map not found or new map, skip local map read")
        setConfig(CONFIG)
        // duplicate code to below
        const index = new RBush()
        const features = data.features.filter(f =>
          f.geometry.type === "Point" && f.properties.type !== "text"
        ).map(f => ({
          minX: f.geometry.coordinates[0],
          minY: f.geometry.coordinates[1],
          maxX: f.geometry.coordinates[0],
          maxY: f.geometry.coordinates[1],
          feature: f
        }))
        index.load(features)
        setGroups(index)
        return
      }
      // console.log("read local map", map)
      map.geojson.features.forEach(f => {
        f.properties.userCreated = true
        f.id = fid++
      })

      // TODO: this is most likely a race condition
      const combined = combineLayers([map.geojson, data])
      if (params.get("preview")) {
        setCombined(combined)
      } else {
        setCombined(null)
      }
      setConfig({
        ...CONFIG,
        ...map.config,
      })
      // what's better than 2 race conditions...3!
      const index = new RBush()
      const features = (combined || data).features.filter(f =>
        f.geometry?.type === "Point" && f.properties.type !== "text"
      ).map(f => ({
        minX: f.geometry.coordinates[0],
        minY: f.geometry.coordinates[1],
        maxX: f.geometry.coordinates[0],
        maxY: f.geometry.coordinates[1],
        feature: f
      }))
      index.load(features)
      setGroups(index)
    })();

    // cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [params])

  if (!size || !config || !groups) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
      </div>
    )
  }

  return (
    <>
      <Map
        id="map"
        key={crashed}
        dragRotate={false}
        scrollZoom={!locked}
        dragPan={!locked}
        doubleClickZoom={!locked}
        attributionControl={false}
        initialViewState={{
          ...config.VIEW,
          // renderWorldCopies: false
        }}
        maxZoom={config.MAX_ZOOM}
        minZoom={config.MIN_ZOOM}
        style={{ width: size.width, height: size.height }}
        mapStyle={config.STYLE}
        pixelRatio={2}
      // good to view what kind of distortion is happening
      // projection="vertical-perspective"
      // projection="globe"
      // projection={config.IS_GALAXY === false ? "mercator" : "globe"}
      >
        <MapComponent locationGroups={groups} width={size.width} height={size.height} name={name} data={combined || data} mobile={mobile} params={params} locked={locked} setCrashed={setCrashed} {...config} GEO_EDIT={GEO_EDIT} />
        {showControls && <Controls name={name} params={params} setSize={setSize} TYPES={config.TYPES} STYLES={config.STYLES} GEO_EDIT={GEO_EDIT} />}
      </Map>
      {showEditor && <Editor mapName={name} params={params} TYPES={config.TYPES} data={data} GEO_EDIT={GEO_EDIT} />}
      <div style={{ width: size.width, height: size.height, background: `radial-gradient(${config.BG})`, zIndex: -1, top: 0, position: "absolute" }}></div>
    </>
  )
}
