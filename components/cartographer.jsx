'use client'
import { useEffect, useState } from 'react'
import MapComponent from './map'
import { combineAndDownload, combineLayers, getConsts, isMobile } from '@/lib/utils'
import Map from 'react-map-gl/maplibre'
import Controls from './controls.jsx'
import Editor from './editor'
import { useSearchParams, useRouter } from 'next/navigation'
import { create } from 'zustand'
import randomName from '@scaleway/random-name'

export const useStore = create((set) => ({
  editorTable: null,
  setEditorTable: editorTable => set({ editorTable }),
}))

export default function Cartographer({ name, data, stargazer, fid }) {
  const { SCALE, CENTER, STYLE, VIEW, MAX_ZOOM, MIN_ZOOM, BOUNDS, BG } = getConsts(name)

  // crash reloading
  const [crashed, setCrashed] = useState()
  const [size, setSize] = useState()
  const params = useSearchParams()
  const mobile = isMobile()
  const router = useRouter()
  VIEW.zoom = params.get("z") || VIEW.zoom
  VIEW.longitude = params.get("lng") || VIEW.longitude
  VIEW.latitude = params.get("lat") || VIEW.latitude
  const locked = params.get("locked") === "1"
  if (params.get("preview")) stargazer = true
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
    if (typeof localStorage === 'undefined') {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
        </div>
      )
    }
    const maps = JSON.parse(localStorage.getItem('maps')) || {}
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
            if (res.type !== "FeatureCollection") {
              window.parent.postMessage({
                type: 'error',
                message: res.error,
              }, '*')
              return
            }
            const prev = JSON.parse(localStorage.getItem('maps')) || {}
            const mapKey = name + "-" + uuid
            localStorage.setItem('maps', JSON.stringify({
              ...prev, [mapKey]: {
                geojson: res,
                name: prev[mapKey]?.name || randomName('', ' '),
                updated: Date.now(),
                map: name,
              }
            }))
            //
            // console.log("redirect to", `/${name}?id=${uuid}&hamburger=0&search=0&link=foundry&secret=${params.get("secret")}`)
            // router.replace(`/${name}?id=${uuid}&hamburger=0&search=0&link=foundry&secret=${params.get("secret")}`)
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
      const localGeojson = maps[name + "-" + params.get("id")]
      if (localGeojson?.geojson) {
        localGeojson.geojson.features.forEach(f => {
          f.properties.userCreated = true
          f.id = fid++
        })
        data = combineLayers([localGeojson.geojson, data])
      }
    }
  }

  if (!size || params.get("waitForFetch")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
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
        initialViewState={VIEW}
        maxZoom={MAX_ZOOM}
        minZoom={MIN_ZOOM}
        style={{ width: size.width, height: size.height }}
        mapStyle={STYLE}
        pixelRatio={2}
      >
        <MapComponent width={size.width} height={size.height} name={name} data={data} mobile={mobile} SCALE={SCALE} CENTER={CENTER} params={params} stargazer={stargazer} locked={locked} setCrashed={setCrashed} />
        {showControls && <Controls name={name} params={params} setSize={setSize} />}
      </Map>
      {showEditor && <Editor mapName={name} params={params} />}
      <div style={{ width: size.width, height: size.height, background: `radial-gradient(${BG})`, zIndex: -1, top: 0, position: "absolute" }}></div>
    </>
  )
}
