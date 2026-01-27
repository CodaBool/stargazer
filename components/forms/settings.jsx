'use client'

import { useRouter } from 'next/navigation'
import { useForm } from "react-hook-form"
import { useEffect, useState } from "react"
import 'react-quill-new/dist/quill.bubble.css'
import { getConsts, getMaps, localSet } from "@/lib/utils"
import SharedSettings from "./sharedSettings"

export default function MapSettings({ map, id }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const DEFAULTS = getConsts(map)
  const [submitting, setSubmitting] = useState()
  const [data, setData] = useState()
  const [alert, setAlert] = useState()
  const [preAlert, setPreAlert] = useState()
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

        geojson.features.forEach(f => {
          // Remove properties with null or empty string values
          for (const key in f.properties) {
            if (f.properties[key] === null || f.properties[key] === "" || f.properties[key] === "undefined") {
              console.log("removing", key, "val", f.properties[key])
              delete f.properties[key];
            }
          }
          // set a fill and stroke when needed
          if (f.geometry.type === "Point" && !f.properties.fill) {
            f.properties.fill = getRandomNeonColor()
          } else if (f.geometry.type.includes("Poly") && !f.properties.fill) {
            f.properties.fill = `${getRandomNeonColor()}1A` // 10% opacity
          }
          if ((f.geometry.type.includes("LineString") || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
            f.properties.stroke = `${getRandomNeonColor()}80` // 50% opacity
          }
        })
        newObj.geojson = geojson
      } else {
        // show a dialog letting the user know how many features they would add
        setAlert(preAlert)
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
      body.VIEW.longitude = Number(body.CENTER.split(",")[1])
      body.VIEW.latitude = Number(body.CENTER.split(",")[0])
      delete body.CENTER
    }
    if (body.ZOOM) {
      body.VIEW.zoom = Number(body.ZOOM)
      delete body.ZOOM
    }
    if (body.MAX_BOUNDS) {
      const bounds = body.MAX_BOUNDS.split(",").map(Number)
      body.VIEW.maxBounds = [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ]
      delete body.MAX_BOUNDS
    }
    if (body.MAX_ZOOM) {
      body.MAX_ZOOM = Number(body.MAX_ZOOM)
    }
    if (body.MIN_ZOOM) {
      body.MIN_ZOOM = Number(body.MIN_ZOOM)
    }
    if (body.SEARCH_SIZE) {
      body.SEARCH_SIZE = Number(body.SEARCH_SIZE)
    }
    if (JSON.stringify(body.LAYOUT_OVERRIDE)?.replaceAll(" ", "") === "{}") {
      delete body.LAYOUT_OVERRIDE
    }
    if (body.MAX_BOUNDS) {
      const bounds = body.MAX_BOUNDS.split(",").map(Number)
      body.VIEW.maxBounds = [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]]
      ]
      delete body.MAX_BOUNDS
    }

    setSubmitting(false)
    delete body.file
    delete body.name
    const maps = await getMaps()
    const currentConfig = maps[`${map}-${id}`]?.config
    console.log("local submit", {
      ...newObj,
      config: {
        ...currentConfig,
        ...body,
      },
    })
    localSet("maps", {
      ...maps,
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

  useEffect(() => {
    getMaps().then(maps => {
      if (maps?.hasOwnProperty(`${map}-${id}`)) {
        console.log("property", maps[`${map}-${id}`])
        setData(maps[`${map}-${id}`])
      } else {
        router.push(`/#${map}_local_${id}`)
      }
    })
  }, [])


  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
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
    setPreAlert={setPreAlert}
    map={map}
    id={id}
    data={data}
    {...DEFAULTS}
  />
}


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
