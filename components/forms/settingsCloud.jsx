'use client'
import SharedSettings from "./sharedSettings"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { ArrowLeft, LoaderCircle, Settings, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import 'react-quill-new/dist/quill.bubble.css'
import { getConsts } from "@/lib/utils"
import Link from "next/link"

let preAlertData
export default function MapSettings({ map, id, data, config }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const DEFAULTS = getConsts(map)
  const [submitting, setSubmitting] = useState()
  // const [data, setData] = useState()
  const [alert, setAlert] = useState()
  const router = useRouter()
  const form = useForm()

  // console.log(config)

  async function submit(body, _, approved) {
    const newObj = {
      name: body.name,
      id,
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
    if (body.MAX_BOUNDS) {
      body.VIEW.maxBounds = body.MAX_BOUNDS.split(",").map(Number)
      delete body.MAX_BOUNDS
    }
    if (body.MAX_ZOOM) {
      body.MAX_ZOOM = Number(body.MAX_ZOOM)
    }
    if (body.MIN_ZOOM) {
      body.MIN_ZOOM = Number(body.MIN_ZOOM)
    }


    delete body.file
    delete body.name
    console.log("submission", {
      ...newObj,
      config: {
        ...body,
      },
    })
    fetch('/api/map', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...newObj,
        config: {
          ...body,
        },
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          toast.warning(data.error)
          setSubmitting(false)
        } else {
          toast.success(`"${data.map.name}" successfully updated`)
          router.push(`/#${map}_cloud_${id}`)
        }
      })
      .catch(error => {
        console.log(error)
        toast.warning("A server error occurred")
        setSubmitting(false)
      })
  }

  if (!data) {
    router.push(`/#${map}_cloud_${id}`)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
      </div>
    )
  }

  return <SharedSettings
    isCloud={true}
    config={config}

    form={form}
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
