'use client'
import { useEffect, useState } from 'react'
import MapComponent from './map'
import { combineLayers, deepArrayCheck, getConsts, getLocationGroups, isMobile, localGet, localSet } from '@/lib/utils'
import Map from 'react-map-gl/maplibre'
import Controls from './controls.jsx'
import Editor from './editor'
import { useSearchParams, useRouter } from 'next/navigation'
import randomName from '@scaleway/random-name'

let CONST_FINAL = {}
export default function Cartographer({ name, data, stargazer, fid, config }) {
  const CONST = getConsts(name)

  // crash reloading
  const [crashed, setCrashed] = useState()
  const [previewData, setPreviewData] = useState()
  const [configRead, setConfigRead] = useState()
  const [size, setSize] = useState()
  const params = useSearchParams()
  const mobile = isMobile()
  const router = useRouter()
  CONST.VIEW.zoom = params.get("z") || CONST.VIEW.zoom
  CONST.VIEW.longitude = params.get("lng") || CONST.VIEW.longitude
  CONST.VIEW.latitude = params.get("lat") || CONST.VIEW.latitude
  const locked = params.get("locked") === "1"
  const showControls = params.get("controls") !== "0" && !mobile && !stargazer && !locked
  const showEditor = params.get("editor") !== "0" && !mobile && !stargazer && !locked

  useEffect(() => {
    if (params.get("width") && params.get("height")) {
      setSize({ width: Number(params.get("width")), height: Number(params.get("height")) })
    } else {
      setSize({ width: window.innerWidth, height: window.innerHeight })
    }
    const handleResize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (params.get("id")) {
    // TODO: rewrite this in a await fashion
    localGet('maps').then(r => {
      r.onerror = e => console.error("db error", e, r)
      r.onsuccess = () => {
        const localMaps = r.result || {}

        if (params.get("id") === "foundry") {
          const uuid = params.get("uuid")
          // console.log("get map geojson using secret", params.get("secret"), uuid)
          fetch(`/api/v1/map/${uuid}`)
            .then(res => res.json())
            .then(res => {
              // console.log("res", res)
              if (res.error) {
                window.parent.postMessage({
                  type: 'error',
                  message: res.error,
                }, '*')
              } else {
                if (res?.geojson?.type !== "FeatureCollection") {
                  window.parent.postMessage({
                    type: 'error',
                    message: res.error,
                  }, '*')
                  return
                }
                const mapKey = name + "-" + uuid

                localSet("maps", {
                  ...localMaps, [mapKey]: {
                    geojson: res.geojson,
                    name: localMaps[mapKey]?.name || randomName('', ' '),
                    updated: Date.now(),
                    id: Number(uuid),
                    map: name,
                    config: localMaps[mapKey]?.config || {},
                  }
                })
                router.replace(`/${name}?secret=${params.get("secret")}&id=${uuid}&hamburger=0&search=0&zoom=0`)
              }
            })
            .catch(message => {
              window.parent.postMessage({
                type: 'error',
                message,
              }, '*');
            })
        } else if (params.get("preview")) {
          const localGeojson = localMaps[name + "-" + params.get("id")]
          if (localGeojson?.geojson) {
            localGeojson.geojson.features.forEach(f => {
              f.properties.userCreated = true
              f.id = fid++
            })
            // ensure that the local data changes get passed to the preview state
            const userData = previewData?.features.filter(f => f.properties.userCreated)
            const localUserData = localGeojson.geojson.features.filter(f => f.properties.userCreated)
            const preview = combineLayers([localGeojson.geojson, data])
            if (!previewData) setPreviewData(preview)
            if (deepArrayCheck(userData, localUserData)) {
              setPreviewData(preview)
            }
          }
        }

        // override config
        const localGeojson = localMaps[name + "-" + params.get("id")]
        if (localGeojson?.config) {
          Object.keys(localGeojson.config).forEach(key => {
            if (CONST.hasOwnProperty(key)) {
              CONST[key] = localGeojson.config[key];
            }
          })
        }
        CONST_FINAL = JSON.parse(JSON.stringify(CONST));
        // TODO: this tries to update state before mount. Should rethink this whole config init process
        if (!configRead) setConfigRead(true)
      }
    })
  } else {
    CONST_FINAL = JSON.parse(JSON.stringify(CONST))
    Object.keys(config || {}).forEach(key => {
      if (CONST_FINAL.hasOwnProperty(key)) {
        CONST_FINAL[key] = config[key]
      }
    })
    if (!configRead) setConfigRead(true)
  }

  if ((!size || params.get("waitForFetch")) || (params.get("preview") && !previewData) || !configRead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
      </div>
    )
  }

  const locationGroups = getLocationGroups((params.get("preview") ? (previewData || data) : data).features.filter(f =>
    f.geometry.type === "Point" && f.properties.type !== "text"
  ))

  // duplicate of the else case
  // TODO: rewrite cartographer to always have valid config
  if (!CONST_FINAL.STYLES) {
    CONST_FINAL = JSON.parse(JSON.stringify(CONST))
    Object.keys(config || {}).forEach(key => {
      if (CONST_FINAL.hasOwnProperty(key)) {
        CONST_FINAL[key] = config[key]
      }
    })
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
        initialViewState={CONST_FINAL.VIEW}
        maxZoom={CONST_FINAL.MAX_ZOOM}
        minZoom={CONST_FINAL.MIN_ZOOM}
        style={{ width: size.width, height: size.height }}
        mapStyle={CONST_FINAL.STYLE}
        pixelRatio={2}
      // good to view what kind of distortion is happening
      // projection="globe"
      >
        <MapComponent locationGroups={locationGroups} width={size.width} height={size.height} name={name} data={params.get("preview") ? (previewData || data) : data} mobile={mobile} params={params} stargazer={stargazer} locked={locked} setCrashed={setCrashed} {...CONST_FINAL} />
        {showControls && <Controls name={name} params={params} setSize={setSize} TYPES={CONST_FINAL.TYPES} STYLES={CONST_FINAL.STYLES} />}
      </Map>
      {showEditor && <Editor mapName={name} params={params} TYPES={CONST_FINAL.TYPES} />}
      <div style={{ width: size.width, height: size.height, background: `radial-gradient(${CONST_FINAL.BG})`, zIndex: -1, top: 0, position: "absolute" }}></div>
    </>
  )
}
