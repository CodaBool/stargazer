'use client'

import { useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { ArrowLeft, LoaderCircle, Settings, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import 'react-quill-new/dist/quill.bubble.css'
import { combineAndDownload, combineLayers, getConsts, hexToRgb, localGet, localSet } from "@/lib/utils"
import SharedSettings from "./sharedSettings"

let preAlertData
export default function MapSettings({ map, id }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const DEFAULTS = getConsts(map)
  const [submitting, setSubmitting] = useState()
  const [data, setData] = useState()
  const [alert, setAlert] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body, _, approved) {
    const newObj = {
      name: body.name,
      updated: Date.now(),
      id: Number(id),
      map,
    }
    body.TYPES = JSON.parse(body.TYPES)
    body.LAYOUT_OVERRIDE = JSON.parse(body.LAYOUT_OVERRIDE)
    setSubmitting(true)

    if (typeof body.STYLE === "undefined") {
      delete body.STYLE
    }

    if (body.file) {
      if (approved) {
        // console.log("submit with file", body)
        const geojson = body.file
        newObj.geojson = geojson
      } else {
        // show a dialog letting the user know how many features they would add
        setAlert(preAlertData)
        return
      }
    } else {
      newObj.geojson = data.geojson
    }

    // console.log("prefix body", body)

    // massage data into proper nesting
    body.STYLES = {}
    body.VIEW = {}
    if (body.MAIN_COLOR) {
      body.STYLES.MAIN_COLOR = body.MAIN_COLOR
      delete body.MAIN_COLOR
    }
    if (body.HIGHLIGHT_COLOR) {
      body.STYLES.HIGHLIGHT_COLOR = body.HIGHLIGHT_COLOR
      delete body.HIGHLIGHT_COLOR
    }
    if (body.CENTER) {
      // TODO: make sure this is the right order
      body.VIEW.longitude = Number(body.CENTER.split(",")[0])
      body.VIEW.latitude = Number(body.CENTER.split(",")[1])
      delete body.CENTER
    }
    if (body.ZOOM) {
      body.VIEW.zoom = Number(body.ZOOM)
      delete body.ZOOM
    }
    if (body.MAX_ZOOM) {
      body.MAX_ZOOM = Number(body.MAX_ZOOM)
    }
    if (body.MIN_ZOOM) {
      body.MIN_ZOOM = Number(body.MIN_ZOOM)
    }
    if (body.MAX_BOUNDS) {
      body.VIEW.maxBounds = body.MAX_BOUNDS.split(",").map(Number)
      delete body.MAX_BOUNDS
    }

    setSubmitting(false)
    delete body.file
    delete body.name
    localGet('maps').then(r => {
      r.onsuccess = () => {
        const localMaps = r.result || {}
        const currentConfig = localMaps[`${map}-${id}`]?.config
        console.log("submit", {
          ...newObj,
          config: {
            ...currentConfig,
            ...body,
          },
        })
        localSet("maps", {
          ...localMaps,
          [`${map}-${id}`]: {
            ...newObj,
            config: {
              ...currentConfig,
              ...body,
            },
          },
        })
        router.push(`/#${map}_local`)
      }
    })
  }

  useEffect(() => {
    localGet('maps').then(r => {
      r.onsuccess = () => {
        if (r.result?.hasOwnProperty(`${map}-${id}`)) {
          setData(r.result[`${map}-${id}`])
          // console.log("form", form, "starting with", r.result[`${map}-${id}`]?.config)
        } else {
          router.push(`/#${map}_local_${id}`)
        }
      }
    })
  }, [])


  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
      </div>
    )
  }

  return <SharedSettings
    form={form}
    isCloud={false}
    submit={submit}
    submitting={submitting}
    setSubmitting={setSubmitting}
    alert={alert}
    setAlert={setAlert}
    map={map}
    id={id}
    data={data}
    {...DEFAULTS}
  />
}
