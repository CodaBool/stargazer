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
import { Slider } from "@/components/ui/slider"
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
import POSTWAR_GREEN from '@/lib/style.json'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Download, LoaderCircle, Settings, X } from "lucide-react"
import 'react-quill-new/dist/quill.bubble.css'
import { combineAndDownload, combineLayers, getConsts, hexToRgb, localGet, localSet, TITLE } from "@/lib/utils"
import randomName from '@scaleway/random-name'
import Link from "next/link"
import { Textarea } from "../ui/textarea"
import { toast } from "sonner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible"

export default function SharedSettings({
  isCloud,
  config,
  form,
  submit,
  submitting,
  setSubmitting,
  alert,
  setAlert,
  setPreAlert,
  map,
  id,
  data,
  VIEW,
  MAX_ZOOM,
  MIN_ZOOM,
  IS_GALAXY,
  UNIT,
  DISTANCE_CONVERTER,
  BG,
  STYLES,
  TYPES,
  SPEED,
}) {

// console.log(data.config?.SPEED ? data.config?.SPEED : SPEED, SPEED, "LOOKY", data.config?.SPEED)
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-8 md:container mx-auto my-8">
        <Card className="mx-auto max-w-2xl">
          <CardHeader className="pb-0">
            <div className="flex items-center justify-between">
              <CardTitle><Settings className="inline mb-1" /> Settings {data.name}</CardTitle>
              <Link href={`/#${map}_${isCloud ? "cloud" : "local"}_${id}`}>
                <Button type="button" variant="ghost" className="p-1 rounded-full w-12 h-12">
                  <ArrowLeft style={{ width: "100%", height: "100%" }} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              rules={{
                required: "Map name is required",
                maxLength: {
                  value: 50,
                  message: "Map name cannot exceed 50 characters",
                },
              }}
              name="name"
              defaultValue={data.name}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Map Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Name" {...field} className="font-mono" />
                  </FormControl>
                  <FormMessage />
                </FormItem >
              )}
            />

            <FormField
              control={form.control}
              name="CENTER"
              rules={{
                validate: v => {
                  const parts = v.split(",")
                  return parts.length === 2 && parts.every(part => part.trim().length > 0 && !isNaN(part.trim())) || "This must be two numbers separated by a comma";
                }
              }}

              defaultValue={typeof data.config?.VIEW?.latitude !== "undefined" ? [data.config?.VIEW?.latitude, data.config?.VIEW?.longitude].toString() : [VIEW.latitude, VIEW.longitude].toString()}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Coordinates</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder={[VIEW.latitude, VIEW.longitude].toString()} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("CENTER", [VIEW.latitude, VIEW.longitude].toString())} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
                  if (v === "" || typeof v === "undefined") return true
                  const parts = v.split(',')
                  return parts.length === 4 && parts.every(part => part.trim().length > 0 && !isNaN(part.trim())) || "Value must be four numbers separated by commas"
                }
              }}
              defaultValue={typeof data.config?.VIEW?.maxBounds !== "undefined" ? data.config?.VIEW?.maxBounds.toString() : VIEW.maxBounds?.toString()}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Bounds</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder="" {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("MAX_BOUNDS", VIEW.maxBounds?.toString())} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
              defaultValue={typeof data.config?.VIEW?.zoom !== "undefined" ? data.config?.VIEW?.zoom : VIEW.zoom}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Starting Zoom</FormLabel>
                  <p className="inline ml-5 text-gray-400 text-sm">{form.getValues("ZOOM")}</p>
                  <FormControl>
                    <div className="flex">
                      <Input type="range" min={0} max={24} step={0.1} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("ZOOM", VIEW.zoom)} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
              defaultValue={typeof data.config?.MAX_ZOOM !== "undefined" ? data.config?.MAX_ZOOM : MAX_ZOOM}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Maximum Zoom</FormLabel>
                  <p className="inline ml-5 text-gray-400 text-sm">{form.getValues("MAX_ZOOM")}</p>
                  <FormControl>
                    <div className="flex">
                      <Input type="range" min={0} max={24} step={0.1} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("MAX_ZOOM", MAX_ZOOM)} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Limits how far in you can zoom. Higher values allow users to zoom in more closely. Lower values limit users view further away from the map. (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#maxzoom">source</a>)
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
              defaultValue={typeof data.config?.MIN_ZOOM !== "undefined" ? data.config?.MIN_ZOOM : MIN_ZOOM}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Minimum Zoom</FormLabel>
                  <p className="inline ml-5 text-gray-400 text-sm">{form.getValues("MIN_ZOOM")}</p>
                  <FormControl>
                    <div className="flex">
                      <Input type="range" min={0} max={24} step={0.1} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("MIN_ZOOM", MIN_ZOOM)} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Limits how far out you can zoom. Higher values limit users view closer to the map. Lower values allow users to zoom out further. (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/MapOptions/#minzoom">source</a>)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {map === "custom" && <FormField
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
                      onCheckedChange={e => {
                        const proceed = window.confirm("This will permanently delete all data for this custom map. Are you sure you want to continue?")
                        console.log("proceed", proceed, e)
                        if (proceed) {
                          field.onChange(e)
                          let mapName = "custom"
                          if (!e) {
                            mapName = "fallout"
                          }
                          form.setValue("MAX_BOUNDS", getConsts(mapName).VIEW.maxBounds.flat().join(","));
                          form.setValue("CENTER", `${getConsts(mapName).VIEW.latitude},${getConsts(mapName).VIEW.longitude}`)
                          form.setValue("UNIT", getConsts(mapName).UNIT)
                          form.setValue('STYLE', getConsts(mapName).STYLE)
                          // TODO: add these as form options
                          // form.setValue('GENERATE_LOCATIONS', getConsts(mapName).GENERATE_LOCATIONS)
                          // form.setValue('SEARCH_POINT_ZOOM', getConsts(mapName).SEARCH_POINT_ZOOM)
                          form.setValue('BG', getConsts(mapName).BG)
                          form.setValue('MAX_ZOOM', getConsts(mapName).MAX_ZOOM)
                          form.setValue('MIN_ZOOM', getConsts(mapName).MIN_ZOOM)
                          form.setValue('DISTANCE_CONVERTER', getConsts(mapName).DISTANCE_CONVERTER)
                          form.setValue('TYPES', JSON.stringify(getConsts(mapName).TYPES, null, 2))

                          // delete all points on the map
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Determines whether the map is a galaxy or on Earth
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />}
            {map === "custom" && <FormField
              control={form.control}
              name="UNIT"
              defaultValue={data.config?.UNIT || UNIT}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Unit of Measurement</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder={UNIT} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("UNIT", UNIT)} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    An arbitrary label for the unit of measurement. This has no impact on the measurement itself.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />}
            {/* TODO: look into scale control maplibre */}
            {map === "custom" && <FormField
              control={form.control}
              rules={{ validate: v => !isNaN(v) || "Value must be a number" }}
              name="DISTANCE_CONVERTER"
              defaultValue={data.config?.DISTANCE_CONVERTER ? data.config?.DISTANCE_CONVERTER : DISTANCE_CONVERTER}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Unit Factor</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder={DISTANCE_CONVERTER} type="number" {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("DISTANCE_CONVERTER", DISTANCE_CONVERTER)} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Scale up or down the distance per unit of measurement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />}
            {map === "alien" && <FormField
              control={form.control}
              rules={{ validate: v => !isNaN(v) || "Value must be a number" }}
              name="SPEED"
              defaultValue={data.config?.SPEED ? data.config?.SPEED : SPEED}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Speed</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder={SPEED} type="number" {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("SPEED", SPEED)} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Speed by which the distance is divided to find the time to travel
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />}
            <FormField
              control={form.control}
              name="BG"
              defaultValue={data.config?.BG || BG}
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Background Gradient</FormLabel>
                  <FormControl>
                    <div className="flex">
                      <Input placeholder={BG} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("BG", BG)} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
                    <div className="flex">
                      <Input placeholder={STYLES.MAIN_COLOR} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("MAIN_COLOR", STYLES.MAIN_COLOR)} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
                    <div className="flex">
                      <Input placeholder={STYLES.HIGHLIGHT_COLOR} {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("HIGHLIGHT_COLOR", STYLES.HIGHLIGHT_COLOR)} className="ml-3">
                        Reset
                      </Button>
                    </div>
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
                    <div className="flex">
                      <Textarea placeholder="{}" {...field} rows={11} readOnly disabled />
                      <Button variant="outline" type="button" onClick={() => form.setValue("TYPES", JSON.stringify(TYPES, null, 2))} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Available types when creating a new feature. <b>Currently changing this is not allowed</b>
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
                    <div className="flex">
                      <Textarea placeholder="{}" {...field} />
                      <Button variant="outline" type="button" onClick={() => form.setValue("LAYOUT_OVERRIDE", "{}")} className="ml-3">
                        Reset
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    <a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-style-spec/layers/#symbol">Maplibre symbol</a> layout overrides. e.g. {'{"icon-size": 1}'}. This only applies to the point location symbol layer. Meaning polygon or linestrings are not affected. Some maplibre symbol properties listed are Paint properties, such as <b>icon-color</b>. These cannot be overridden using this field, only Layout properties can.
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

                            console.log("fileData", fileData)
                            if (fileData.type === "FeatureCollection") { // geojson
                              if (fileData.features?.length === 0 || !fileData.features) {
                                throw new Error("GeoJSON file has no feature data")
                              }
                            } else if (fileData.type === "Topology") { // topojson
                              const [convertedGeojson, type] = combineAndDownload("geojson", fileData, {})
                              fileData = JSON.parse(convertedGeojson)
                              if (fileData.features.length === 0) {
                                throw new Error("TopoJSON either has no data or it's layers are named incorrectly. Use 'territory' for polygons, 'location' for points, and 'guide' for lines")
                              }
                            } else {
                              throw new Error("Invalid GeoJSON or TopoJSON file")
                            }
                            // console.log("loaded a file with", fileData.features.length, "features")
                            setPreAlert({
                              points: fileData.features.filter(f => f.geometry.type === "Point").length,
                              polygons: fileData.features.filter(f => f.geometry.type.includes("Poly")).length,
                              lines: fileData.features.filter(f => f.geometry.type.includes("LineString")).length,
                              total: fileData.features.length,
                            })

                            // fill required data
                            let altered = 0
                            fileData.features.forEach(f => {

                              // TYPES: {
                              //   "polygon": ["sector", "cluster", "nebulae"],
                              //   "point": ["station", "jovian", "moon", "terrestrial", "desert planet", "ocean planet", "barren planet", "ice planet", "asteroid", "lava planet", "ringed planet", "gate", "red dwarf", "orange star", "yellow star", "white dwarf", "red giant", "red supergiant", "blue giant", "blue supergiant", "red star", "blue star", "black hole", "wormhole", "exoplanet", "neutron star", "comet"],
                              //   "linestring": ["guide", "hyperspace"],
                              // },

                              const availableTypes = TYPES[f.geometry.type.toLowerCase().trim()]

                              if (!f.properties.name || !f.properties.type) {
                                const proceed = window.confirm(
                                  `This data is missing a required 'name' or 'type' property\n\n` +
                                  `${JSON.stringify(f.properties, null, 2)}\n\n` +
                                  `Auto-fill missing required property values?\n\n` +
                                  `• name (if missing) → random name\n` +
                                  `• type (if missing) → "${availableTypes[0] || "placeholder"}"`
                                )
                                if (!proceed) {
                                  throw new Error("Missing required property")
                                }
                                if (!f.properties.name) {
                                  f.properties.name = randomName('', ' ')
                                  altered++
                                }
                                if (!f.properties.type) {
                                  f.properties.type = availableTypes[0] || "placeholder"
                                  altered++
                                }
                              }


                              // if (f.geometry.type === "Point" && !f.properties.fill) {
                              //   f.properties.fill = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
                              // } else if (f.geometry.type.includes("Poly") && !f.properties.fill) {
                              //   f.properties.fill = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.4)`
                              // }
                              // if ((f.geometry.type.includes("LineString") || f.geometry.type.includes("Poly")) && !f.properties.stroke) {
                              //   f.properties.stroke = `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`
                              // }
                            })

                            if (altered) toast.success(`Added ${altered} required value${altered > 1 ? 's' : ''} to your uploaded map`);

                            const combinedGeojson = combineLayers([fileData, data.geojson])
                            form.setValue('file', combinedGeojson)
                            form.clearErrors('invalid')
                          } catch (error) {
                            console.log(error)
                            if (error.name === "SyntaxError") {
                              toast.warning(`Invalid JSON`)
                            } else {
                              toast.warning(`${error.message}`);
                            }
                            form.setError('invalid')
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a GeoJSON or TopoJSON file to fill the map with data. If uploading a topojson the layers must be named as follows: "location" for points, "territory" for polygons, "guide" for lines
                  </FormDescription>
                  {form.formState.errors.invalid &&
                    <>
                      <p className="text-sm text-red-500">Invalid map data</p>
                      <div className="py-2">
                        <Collapsible>
                          <CollapsibleTrigger className="text-blue-200 cursor-pointer">
                            <span class="relative size-3 inline mr-2">
                              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-200 opacity-75"></span>
                              <span class="relative inline-flex size-3 rounded-full bg-sky-300"></span>
                            </span>
                            Need help, click here?
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 text-gray-400 select-text">
                            <p>Troubleshooting steps:</p>
                            <ul className="list-disc list-inside">
                              <li>Ensure that each feature has both a <strong>name</strong> and <strong>type</strong> property. These are required.</li>
                              <li>The current implementation of {TITLE} has a hardcoded set of types. Those can be seen above under <b>Available Feature Types</b>. Use a value from there depending on the feature geometry type.</li>
                              <li>When uploading a topojson {TITLE} currently expects each geometry layer to be named exactly (must be lowercase) as shown below. Note that you do not have to include all 3 layers, but if they are present, they must follow this naming convention:</li>
                              <ul className="list-disc list-inside ml-4">
                                <li><strong>location:</strong> for points</li>
                                <li><strong>territory:</strong> for polygons</li>
                                <li><strong>guide:</strong> for lines</li>
                              </ul>
                              <li>There are two websites which make creating map data easy: <a href="https://geojson.io" target="_blank" className="text-blue-300">geojson.io</a> and <a href="https://mapshaper.org" target="_blank" className="text-blue-300">mapshaper.org</a>. Let's do a full exhaustive workflow example using mapshaper:</li>
                              <ul className="list-decimal list-inside ml-4">
                                <li>Download a full copy of {map}'s map data: you can do that from the <a href="/" target="_blank" className="text-blue-300">menu</a> by selecting the relevant system and clicking the <strong><Download className="inline" size={18} /> download</strong> button.</li>
                                <li>Use <a href="https://mapshaper.org" target="_blank" className="text-blue-300">mapshaper.org</a> and upload your downloaded base map</li>
                                <li>Open the layers popover by clicking at the top middle button</li>
                                <li>In the popover, click on the top most eye symbol. This reveals all layers.</li>
                                <li>Create a new layer by clicking on "Add empty layer". Or if you already have some data, use "Add files"</li>
                                <li>Use mapshaper tools to add features and edit their properties. Remember, <b>name</b> and <b>type</b> are required on all features.</li>
                                <li>Once done, delete the original layers which were uploaded. They were there just to be used as a reference. We don't actually want that in the data we will be uploading.</li>
                                <li>Now follow the above rule for layer naming convention. Meaning <b>location</b> for points, <b>territory</b> for polygons, and <b>guide</b> for lines.</li>
                                <li>Use the <b>Export</b> button and export as topojson</li>
                                <li>Upload your topojson to {TITLE}</li>
                              </ul>
                              <li>Additional tips:</li>

                              <ul className="list-disc list-inside ml-4">
                                <li>in rare cases mapshaper will simplify your data. Use this option on export to disable that: <b>no-quantization precision=0.001</b></li>
                                <li>Want to trace over an image? Well it's complicated but here is the best process I've found. Make a <a href="https://figma.com" target="_blank" className="text-blue-300">figma.com</a> project. Add an image and create polygons on top...just the polygons. What about points and line? Well here is where things get time consuming. If you want accurate points you'll need to create a box which you'll later use as reference for your points. Then export the fame as an SVG file. Convert the <a href="https://codabool.github.io/svg-plotter" target="_blank" className="text-blue-300">SVG to GeoJSON</a> (change the center to 0,0). Finally use mapshaper to cleanup your data, translating any boxes into points. This is a long process...</li>
                                <li><b>npx mapshaper</b> CLI can be used to combine layers into one (but it's very picky on the properties on each feature)</li>
                                <li><a href="https://findthatpostcode.uk/tools/merge-geojson" target="_blank" className="text-blue-300">combine two geojson files into one</a> (this tool is not picky)</li>
                                <li>My maps are small and centered on coordinates 0,0 to minimize mercator projection distortion</li>
                              </ul>
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    </>}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="STYLE"
              render={({ field }) => (
                <FormItem className="py-4">
                  <FormLabel>Maplibre Style</FormLabel>
                  {config?.STYLE && <p className="text-orange-100">A style already exists for this map!</p>}
                  <FormControl>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files[0]
                        if (file) {
                          const content = await file.text();
                          try {
                            let fileData = JSON.parse(content)
                            form.setValue('STYLE', fileData)
                            form.clearErrors('invalidStyle')
                          } catch (error) {
                            console.error(error)
                            form.setError("invalidStyle")
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Define a style for non-galaxy maps. Must be a valid Maplibre style (<a target="_blank" className="text-blue-300" href="https://maplibre.org/maplibre-style-spec/">spec</a>). I recommend using <a target="_blank" className="text-blue-300" href="https://maplibre.org/maputnik">Maputnik</a> for creating and editing the style.
                  </FormDescription>
                  {form.formState.errors.invalidStyle && <p className="text-sm text-red-500">Invalid format</p>}
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
