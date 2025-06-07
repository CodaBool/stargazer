'use client'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { feature } from "topojson-client"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { ArrowLeft, LoaderCircle, Settings, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import 'react-quill-new/dist/quill.bubble.css'
import { combineAndDownload, combineLayers, getConsts, hexToRgb } from "@/lib/utils"
import randomName from '@scaleway/random-name'
import Link from "next/link"
import { Textarea } from "../ui/textarea"

let preAlertData
const templates = ["xeno", "neuropunk", "mousewars", "postwar", "crusaiders"]
export default function MapSettings({ map, id }) {
  // https://github.com/zenoamaro/react-quill/issues/921
  const { VIEW, DISTANCE_CONVERTER, MAX_ZOOM, MIN_ZOOM, UNIT, BG, TYPES, STYLES, IS_GALAXY } = getConsts(map)
  const [submitting, setSubmitting] = useState()
  const [data, setData] = useState()
  const [alert, setAlert] = useState()
  const router = useRouter()
  const form = useForm()

  async function submit(body, _, approved) {
    const newObj = {
      name: data.name,
      updated: Date.now(),
      map,
    }
    // let template = ""
    // templates.forEach(t => {
    //   if (data.name.includes(t)) template = t
    // })
    // if (template) console.log("use template", template)
    body.TYPES = JSON.parse(body.TYPES)
    body.LAYOUT_OVERRIDE = JSON.parse(body.LAYOUT_OVERRIDE)
    setSubmitting(true)

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

    // console.log("fixed body", body)

    setSubmitting(false)
    delete body.file
    const prev = JSON.parse(localStorage.getItem('maps')) || {}
    localStorage.setItem('maps', JSON.stringify({
      ...prev,
      [`${map}-${id}`]: {
        ...newObj,
        config: body,
      },
    }))
    console.log("I set right", JSON.parse(localStorage.getItem('maps')))
    router.push(`/${map}/export`)
  }

  useEffect(() => {
    const json = JSON.parse(localStorage.getItem('maps')) || {}
    if (json.hasOwnProperty(`${map}-${id}`)) {
      setData(json[`${map}-${id}`])
    } else {
      router.push(`/${map}/export`)
    }
  }, [])

  // debug
  useEffect(() => {
    if (data) console.log(data)
  }, [data])
  // useEffect(() => {
  //   if (form) console.log("form looking for geojson", form.getValues("file"))
  // }, [form])

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-900 rounded-full" />
      </div>
    )
  }

  return (
    <Form {...form}>

      <form onSubmit={form.handleSubmit(submit)} className="space-y-8 md:container mx-auto my-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle><Settings className="inline mb-1" /> Settings {data.name}</CardTitle>
              <Link href={`/${map}/export`}>
                <Button type="button" variant="ghost" className="cursor-pointer">
                  <X />
                </Button>
              </Link>
            </div>
            {/* <CardDescription className="select-text"> <a className="text-blue-50" href="https://github.com/CodaBool/community-vtt-maps/issues" target="_blank">issues</a> page. Or DM <b>CodaBool</b> by searching in the <a href="https://discord.gg/foundryvtt" className="text-blue-50" target="_blank">FoundryVTT</a> Discord</CardDescription> */}
          </CardHeader>
          <CardContent>
            {/* <FormField
              control={form.control}
              rules={{ required: "Map name is required" }}
              name="name"
              defaultValue={randomName('', ' ')}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Map Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem >
              )}
            /> */}

            <FormField
              control={form.control}
              name="CENTER"
              rules={{
                validate: v => {
                  return v.includes(',') && v.split(',').length === 2 && v.split(',').every(part => !isNaN(part.trim())) || "Value must be two numbers separated by a comma"
                }
              }}
              defaultValue={data.config?.VIEW?.latitude ? [data.config?.VIEW?.latitude, data.config?.VIEW?.longitude].toString() : [VIEW.latitude, VIEW.longitude].toString()}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Coordinates</FormLabel>
                  <FormControl>
                    <Input placeholder={[VIEW.latitude, VIEW.longitude].toString()} {...field} />
                  </FormControl>
                  <FormDescription>
                    Controls the initial x/Lat and y/Lng coordinate location when first viewing the map. Use a comma to separate the x/Lat and y/Lng values. (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#center">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="MAX_BOUNDS"
              rules={{
                validate: v => {
                  if (v === "") return true
                  const parts = v.split(',');
                  return parts.length === 4 && parts.every(part => !isNaN(part.trim())) || "Value must be four numbers separated by commas"
                }
              }}
              defaultValue={data.config?.VIEW?.maxBounds ? data.config?.VIEW?.maxBounds.toString() : ""}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Bounds</FormLabel>
                  <FormControl>
                    <Input placeholder="" {...field} />
                  </FormControl>
                  <FormDescription>
                    Limits how far in any direction the map can be panned. Use this formatting "left, bottom, right, top" replacing each direction word with your chosen number (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#maxbounds">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              rules={{ validate: v => !isNaN(v) || "Value must be a number" }}
              name="ZOOM"
              defaultValue={data.config?.VIEW?.zoom || VIEW.zoom}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Zoom</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder={VIEW.zoom} {...field} />
                  </FormControl>
                  <FormDescription>
                    Controls the initial zoom level when first viewing the map (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#zoom">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem >
              )}
            />
            <FormField
              control={form.control}
              rules={{
                validate: v => {
                  if (isNaN(v)) return "Value must be a number";
                  if (v < 0 || v > 24) return "Value must be between 0 and 24 inclusively";
                  return true;
                }
              }}
              name="MAX_ZOOM"
              defaultValue={data.config?.MAX_ZOOM || MAX_ZOOM}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Maximum Zoom</FormLabel>
                  <FormControl>
                    <Input placeholder={MAX_ZOOM} type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Limits how far in you can zoom (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#maxzoom">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              rules={{
                validate: v => {
                  if (isNaN(v)) return "Value must be a number";
                  if (v < 0 || v > 24) return "Value must be between 0 and 24 inclusively";
                  return true;
                }
              }}
              name="MIN_ZOOM"
              defaultValue={data.config?.MIN_ZOOM || MIN_ZOOM}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Minimum Zoom</FormLabel>
                  <FormControl>
                    <Input placeholder={MIN_ZOOM} type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Limits how far out you can zoom (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#minzoom">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="IS_GALAXY"
              defaultValue={typeof data.config?.IS_GALAXY === 'boolean' ? data.config?.IS_GALAXY : IS_GALAXY}
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                  <FormLabel>Galaxy Map</FormLabel>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      className="cursor-pointer"
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Determines whether the map is a galaxy or on Earth
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="UNIT"
              defaultValue={data.config?.UNIT || UNIT}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Unit of Measurement</FormLabel>
                  <FormControl>
                    <Input placeholder={UNIT} {...field} />
                  </FormControl>
                  <FormDescription>
                    What distance unit to use for measuring
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* TODO: look into scale control maplibre */}
            <FormField
              control={form.control}
              rules={{ validate: v => !isNaN(v) || "Value must be a number" }}
              name="DISTANCE_CONVERTER"
              defaultValue={data.config?.DISTANCE_CONVERTER || DISTANCE_CONVERTER}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Unit Factor</FormLabel>
                  <FormControl>
                    <Input placeholder={DISTANCE_CONVERTER} type="number" {...field} />
                  </FormControl>
                  <FormDescription>
                    Scale up or down the distance per unit of measurement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="BG"
              defaultValue={data.config?.BG || BG}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Background Gradient</FormLabel>
                  <FormControl>
                    <Input placeholder={BG} {...field} />
                  </FormControl>
                  <FormDescription>
                    <a target="_blank" className="text-blue-300" href="https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/radial-gradient">CSS color gradient</a> to use for the background
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="MAIN_COLOR"
              rules={{
                validate: v => {
                  if (!v.includes('#')) return "Value must contain a #";
                  if (v.length !== 7) return "Value must be 7 characters in length";
                  return true;
                }
              }}
              defaultValue={data.config?.STYLES?.MAIN_COLOR || STYLES.MAIN_COLOR}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Main Color</FormLabel>
                  <FormControl>
                    <Input placeholder={STYLES.MAIN_COLOR} {...field} />
                  </FormControl>
                  <FormDescription>
                    <a target="_blank" className="text-blue-300" href="https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color">Six-value CSS hex color</a> used in UI elements such as the search bar (<a target="_blank" className="text-blue-300" href="https://htmlcolorcodes.com/color-picker/">color picker</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="HIGHLIGHT_COLOR"
              rules={{
                validate: v => {
                  if (!v.includes('#')) return "Value must contain a #";
                  if (v.length !== 7) return "Value must be 7 characters in length";
                  return true;
                }
              }}
              defaultValue={data.config?.STYLES?.HIGHLIGHT_COLOR || STYLES.HIGHLIGHT_COLOR}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Highlight Color</FormLabel>
                  <FormControl>
                    <Input placeholder={STYLES.HIGHLIGHT_COLOR} {...field} />
                  </FormControl>
                  <FormDescription>
                    <a target="_blank" className="text-blue-300" href="https://developer.mozilla.org/en-US/docs/Web/CSS/hex-color">Six-value CSS hex color</a> used when hovering a location (<a target="_blank" className="text-blue-300" href="https://htmlcolorcodes.com/color-picker/">color picker</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="TYPES"
              rules={{
                validate: v => {
                  try {
                    JSON.parse(v);
                    return true;
                  } catch (e) {
                    return "Value must be valid JSON";
                  }
                }
              }}
              defaultValue={data.config?.TYPES ? JSON.stringify(data.config.TYPES, null, 2) : JSON.stringify(TYPES, null, 2)}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Available Feature Types</FormLabel>
                  <FormControl>
                    <Textarea placeholder="{}" {...field} rows={11} />
                  </FormControl>
                  <FormDescription>
                    I'm just going to recommend not touching this one
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="LAYOUT_OVERRIDE"
              rules={{
                validate: v => {
                  try {
                    JSON.parse(v);
                    return true;
                  } catch (e) {
                    return "Value must be valid JSON";
                  }
                }
              }}
              defaultValue={data.config?.LAYOUT_OVERRIDE ? JSON.stringify(data.config.LAYOUT_OVERRIDE, null, 2) : "{}"}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Symbol/Location layout overrides</FormLabel>
                  <FormControl>
                    <Textarea placeholder="{}" {...field} />
                  </FormControl>
                  <FormDescription>
                    <a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-style-spec/layers/#symbol">Maplibre symbol</a> layout overrides. e.g. {'{"icon-size": 1}'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Upload Map Data</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".geojson,.topojson,.json"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const content = await file.text();
                          try {
                            let fileData = JSON.parse(content)
                            if (fileData.type === "FeatureCollection") { // geojson
                            } else if (fileData.type === "Topology") { // topojson
                              const [convertedGeojson, type] = combineAndDownload("geojson", fileData, {})
                              fileData = JSON.parse(convertedGeojson)
                            } else {
                              throw new Error("Invalid GeoJSON or TopoJSON file")
                            }
                            // console.log("loaded a file with", fileData.features.length, "features")
                            preAlertData = {
                              points: fileData.features.filter(f => f.geometry.type === "Point").length,
                              polygons: fileData.features.filter(f => f.geometry.type.includes("Poly")).length,
                              lines: fileData.features.filter(f => f.geometry.type === "LineString").length,
                              total: fileData.features.length,
                            }

                            // fill required data
                            fileData.features.forEach(f => {
                              const availableTypes = Object.keys(TYPES).filter(t =>
                                f.geometry.type.toLowerCase() === t.split(".")[1]
                              ).map(t => t.split(".")[0])
                              if (!f.properties.name) {
                                f.properties.name = randomName('', ' ')
                              }
                              if (!f.properties.type) {
                                f.properties.type = availableTypes[0] || "placeholder"
                              }
                              if (f.geometry.type === "Point" && !f.properties.fill) {
                                f.properties.fill = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
                              } else if (f.geometry.type.includes("Poly") && !f.properties.fill) {
                                f.properties.fill = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.4)`
                              }
                              if ((f.geometry.type === "LineString" || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
                                f.properties.stroke = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
                              }
                            })

                            const combinedGeojson = combineLayers([fileData, data.geojson])
                            form.setValue('file', combinedGeojson)
                            form.clearErrors('invalidJson')
                          } catch (error) {
                            console.error(error)
                            form.setError("invalidJson")
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a GeoJSON or TopoJSON file to fill the map with data. If uploading a topojson the layers must be named as follows: "location" for points, "territory" for polygons, "guide" for lines
                  </FormDescription>
                  {form.formState.errors.invalidJson && <p className="text-sm text-red-500">Invalid format</p>}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button disabled={submitting} type="submit" variant="outline" className="w-full cursor-pointer">
              {submitting
                ? <LoaderCircle className="animate-spin" />
                : "Submit"
              }
            </Button>
          </CardFooter>
        </Card>
        <AlertDialog open={!!alert} onOpenChange={open => !open && setAlert(null)}>
          <AlertDialogContent style={{ minWidth: "64vw" }}>
            <AlertDialogHeader>
              <AlertDialogTitle>Adding {alert?.total} features!</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div>
                  This change is difficult to undo. Creating a backup before continuing is recommended.
                  Review the following carefully before proceeding:
                  <hr className="my-4" />
                  <ul>
                    <li>Points: {alert?.points}</li>
                    <li>Polygons: {alert?.polygons}</li>
                    <li>Lines: {alert?.lines}</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" onClick={() => setSubmitting(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction className="cursor-pointer" onClick={() => submit(form.getValues(), null, true)}>
                I've backed up and want to add {alert?.total} Features to {data.name}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </Form >
  )
}
