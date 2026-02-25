"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import "react-quill-new/dist/quill.bubble.css"
import { RgbaColorPicker } from "react-colorful"
import { LoaderCircle, X } from "lucide-react"

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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { getConsts, REPO, USER } from "@/lib/utils"
import { Comma } from "@/components/forms/advEditor"
import { Toggle } from "../ui/toggle"
import { useEffect } from "react"



export default function CreateLocation({ map }) {
  const DEFAULTS = getConsts(map)


  // https://github.com/zenoamaro/react-quill/issues/921
  const Editor = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }),
    [],
  )

  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      // required-ish
      name: "",
      type: "",
      coordinates: "",
      source: "",
      description: "",

      // csv badge adders
      faction: "",
      alias: "",
      locations: "",
      region: "",
      people: "",
      tags: "",
      composition: "",

      // simple strings
      image: "",
      caption: "",

      // numbers (left unconstrained)
      temperature: "",
      diameter: "",
      gravity: "",
      pressure: "",
      hoursInDay: "",
      daysInYear: "",
      hydroPercent: "",
      icePercent: "",

      // colors (csv strings)
      baseColors: "",
      featureColors: "",
      layerColors: "",
      atmosphereColors: "",
    },
    mode: "onSubmit",
  })

  const type = form.watch("type")
  const diameterUnit =
    type === "star" ? "solar radii" : "km"


  async function submit(body) {
    try {
      setSubmitting(true)
      const payload = {
        ...body,
        map,
        table: "location",
      }

      // console.log("submit", payload)
      // setSubmitting(false)
      // return


      const res = await fetch("/api/contribute", {
        method: "POST",
        body: JSON.stringify(payload),
      })

      const response = await res.json()

      if (response?.msg) {
        toast.success(response.msg)
        form.reset()
        router.replace(`/contribute/${map}`)
        return
      }

      console.error(response?.error ?? response)
      toast.warning("Could not create a new location at this time")
    } catch (err) {
      console.error(err)
      toast.warning("Could not create a new location at this time")
    } finally {
      setSubmitting(false)
    }
  }

  const [types, setTypes] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch("/api/contribute/types", {
          cache: "force-cache",
        })
        const arr = await res.json()
        if (!cancelled) {
          setTypes(Array.isArray(arr) ? arr : [])
        }
      } catch (e) {
        console.error(e)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-8 md:container mx-auto my-8"
      >
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Create a new {map} core feature</CardTitle>
              <Button
                type="button"
                variant="ghost"
                className="cursor-pointer"
                onClick={() => router.push(`/contribute/${map}`)}
              >
                <X />
              </Button>
            </div>

            <CardDescription className="select-text">
              Add a new feature to the shared core map. To edit an existing
              location, scroll down and find it. If you want to submit multiple
              locations, I would instead recommend opening an issue on GitHub
              with a Geojson file.
              {REPO && (
                <span>
                  For other issues submit on the{" "}
                  <a
                    className="text-blue-50"
                    href={REPO + "/issues"}
                    target="_blank"
                    rel="noreferrer"
                  >
                    issues
                  </a>{" "}
                  page. Or DM <b>{USER}</b> by searching in the{" "}
                  <a
                    href="https://discord.gg/foundryvtt"
                    className="text-blue-50"
                    target="_blank"
                    rel="noreferrer"
                  >
                    FoundryVTT
                  </a>{" "}
                  Discord.
                </span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* -------- Required core fields -------- */}
            <Section title="Core">
              <FormField
                control={form.control}
                name="name"
                rules={{ required: "You must give a location name" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="geometry"
                rules={{ required: "Pick a geometry type" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Geometry</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Geometry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Point" className="cursor-pointer">
                            Point
                          </SelectItem>
                          <SelectItem value="Polygon" className="cursor-pointer">
                            Polygon
                          </SelectItem>
                          <SelectItem value="LineString" className="cursor-pointer">
                            LineString
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                rules={{ required: "Pick a location type" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {types.map(t => (
                            <SelectItem key={t} value={t} className="cursor-pointer">
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>Category for the location</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coordinates"
                rules={{
                  required: "This location must have coordinates",
                  validate: v =>
                    /^\s*[+-]?\d+(?:\.\d+)?\s*,\s*[+-]?\d+(?:\.\d+)?\s*$/.test(
                      String(v ?? ""),
                    )
                      ? true
                      : "Coordinates must be in the format: number,number (example: -4, 2)",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coordinates</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="-24, 601"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      The x and y coordinates for this location. Use the{" "}
                      <a
                        href={`/${map}?c=1`}
                        className="text-blue-50"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Find Coordinates
                      </a>{" "}
                      control to determine this. Use a comma to separate x and
                      y.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                rules={{ required: "Source material is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Material</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Book pg. 404"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormDescription>
                      Name + page number for the source material. Or a URL which
                      will become a link.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                rules={{
                  required: "You must provide detail in the description",
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <div className="border border-gray-800 rounded-md p-2">
                        <Editor
                          theme="bubble"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Select text for rich editing
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            {/* -------- Badge adders / CSV fields -------- */}
            <Section title="Tags & Lists">
              <FormField
                control={form.control}
                name="faction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faction</FormLabel>
                    <FormControl>
                      <Comma
                        label={null}
                        hideLabel
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Tunnel Snakes, Raiders"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alias</FormLabel>
                    <FormControl>
                      <Comma
                        label={null}
                        hideLabel
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Alt name, old name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Locations</FormLabel>
                    <FormControl>
                      <Comma
                        label={null}
                        hideLabel
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Historic Statue, Capital Building"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region</FormLabel>
                    <FormControl>
                      <Comma
                        label={null}
                        hideLabel
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Dera Region, Outer Rim"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="people"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>People</FormLabel>
                    <FormControl>
                      <Comma
                        label={null}
                        hideLabel
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="VIPs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <TagTogglesRow
                        value={field.value}
                        onChange={field.onChange}
                        items={TAG_ITEMS}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {DEFAULTS.IS_GALAXY && (
                <FormField
                  control={form.control}
                  name="composition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Composition</FormLabel>
                      <FormControl>
                        <Comma
                          label={null}
                          hideLabel
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="iron, silicate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </Section>

            {/* -------- Media -------- */}
            <Section title="Media">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/image.png"
                        {...field}
                        className="font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="caption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image Caption</FormLabel>
                    <FormControl>
                      <Input placeholder="Short Description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Section>

            {/* -------- Numbers -------- */}
            {DEFAULTS.IS_GALAXY && (
              <Section title="Advanced Numbers">
                <Grid2>
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature (°C)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="15"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{`Diameter (${diameterUnit})`}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder={diameterUnit === "km" ? "12742" : "1"}
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gravity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gravity (cm/s²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="981"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>Earth ≈ 981 cm/s².</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pressure (millibars)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="1013"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>Earth ≈ 1013 mb.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hoursInDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hours In Day</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="24"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="daysInYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days In Year</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="365"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hydroPercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hydro Percent (0–1)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.71"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          Please enter a decimal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="icePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ice Percent (0–1)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="0.24"
                            {...field}
                            className="font-mono"
                          />
                        </FormControl>
                        <FormDescription>
                          Please enter a decimal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </Grid2>
              </Section>
            )}

            {/* -------- Colors (csv strings) -------- */}
            {DEFAULTS.IS_GALAXY && (
              <Section title="Colors">
                <FormField
                  control={form.control}
                  name="baseColors"
                  render={({ field }) => (
                    <FormItem>
                      <RowLabel label="Base Colors" hint="" />
                      <FormControl>
                        <div className="space-y-2">
                          <ColorGrid
                            value={field.value}
                            count={4}
                            alpha={false}
                            onChange={field.onChange}
                          />
                          <Input
                            className="font-mono"
                            placeholder="#ffffff, #ff00ff, #000000, #123456"
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Used for planet surface colors
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featureColors"
                  render={({ field }) => (
                    <FormItem>
                      <RowLabel label="Feature Colors" hint="" />
                      <FormControl>
                        <div className="space-y-2">
                          <ColorGrid
                            value={field.value}
                            count={4}
                            alpha={false}
                            onChange={field.onChange}
                          />
                          <Input
                            className="font-mono"
                            placeholder="#ffffff, #ff00ff, #000000, #123456"
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value)}
                          />
                        </div>
                      </FormControl>

                      <FormDescription>
                        Used for objects on a planet, lakes, craters, land
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="layerColors"
                  render={({ field }) => (
                    <FormItem>
                      <RowLabel label="Layer Colors" hint="use alpha hex" />
                      <FormControl>
                        <div className="space-y-2">
                          <ColorGrid
                            value={field.value}
                            count={4}
                            alpha
                            onChange={field.onChange}
                          />
                          <Input
                            className="font-mono"
                            placeholder="#ffffffff, #00ffffff, #000000ff, #12345678"
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color of lava, clouds, rings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="atmosphereColors"
                  render={({ field }) => (
                    <FormItem>
                      <RowLabel
                        label="Atmosphere Colors"
                        hint="use alpha hex"
                      />
                      <FormControl>
                        <div className="space-y-2">
                          <ColorGrid
                            value={field.value}
                            count={3}
                            alpha
                            onChange={field.onChange}
                          />
                          <Input
                            className="font-mono"
                            placeholder="#ffffffff, #00ffffff, #12345678"
                            value={field.value ?? ""}
                            onChange={e => field.onChange(e.target.value)}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Color of the outer atmospheric glow on terrestrial-like
                        planets (e.g. ocean planet, ecumenopolis planet). A low
                        opacity is recommended.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Section>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              disabled={submitting}
              type="submit"
              variant="outline"
              className="w-full cursor-pointer"
            >
              {submitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                "Submit"
              )}
            </Button>

            <p className="text-xs opacity-70">
              Submissions are sent for review. Leave fields blank if unknown.
            </p>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

/* --------------------------- UI helpers --------------------------- */

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-xs uppercase tracking-wide font-semibold opacity-70">
          {title}
        </h3>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Grid2({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
}

function RowLabel({ label, hint }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {hint ? <p className="text-xs opacity-70">{hint}</p> : null}
    </div>
  )
}

/* --------------------------- Colors --------------------------- */

function parseCsv(v) {
  if (!v) return []
  return String(v)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const rgbaObjToCss = ({ r, g, b, a }) =>
  `rgba(${clamp(Math.round(r), 0, 255)}, ${clamp(Math.round(g), 0, 255)}, ${clamp(
    Math.round(b),
    0,
    255,
  )}, ${clamp(a ?? 1, 0, 1)})`

const rgbaObjToHex6 = ({ r, g, b }) =>
  "#" +
  [r, g, b]
    .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")

const rgbaObjToHex8 = ({ r, g, b, a }) =>
  "#" +
  [r, g, b, Math.round(clamp(a ?? 1, 0, 1) * 255)]
    .map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")

const rgbaToObj = rgba => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const m = String(rgba).match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
  return m
    ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 }
    : { r: 255, g: 255, b: 255, a: 1 }
}

const hexToRgbaObj = hex => {
  if (!hex) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof hex === "object") return hex
  if (typeof hex !== "string") return { r: 255, g: 255, b: 255, a: 1 }

  const s = hex.trim()
  if (!s.startsWith("#")) return rgbaToObj(s)

  const h = s.slice(1)
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return { r, g, b, a: 1 }
  }
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    const a = parseInt(h.slice(6, 8), 16) / 255
    return { r, g, b, a }
  }
  return { r: 255, g: 255, b: 255, a: 1 }
}

const splitCsv = (v, count) =>
  (v ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, count)
    .concat(Array(count).fill("#ffffff"))
    .slice(0, count)

function ColorGrid({ value, count, alpha = false, onChange }) {
  const colors = splitCsv(value, count)
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c, i) => (
        <PopoverPickerSimple
          key={i}
          value={c}
          alpha={alpha}
          onChange={next => {
            const nextArr = [...colors]
            nextArr[i] = next
            onChange(nextArr.join(", "))
          }}
        />
      ))}
    </div>
  )
}

function PopoverPickerSimple({ value, onChange, alpha = false }) {
  const rgba = hexToRgbaObj(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="swatch w-6 h-6 cursor-pointer border border-white/40 rounded-sm"
          style={{ backgroundColor: rgbaObjToCss(rgba) }}
          title={typeof value === "string" ? value : ""}
        />
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        className="z-[9999] w-auto p-2"
      >
        <RgbaColorPicker
          color={rgba}
          onChange={nextObj => {
            const next = alpha ? rgbaObjToHex8(nextObj) : rgbaObjToHex6(nextObj)
            onChange(next)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
function toggleCsvTag(csv, tag, enabled) {
  const tags = new Set(parseCsv(csv))
  if (enabled) tags.add(tag)
  else tags.delete(tag)
  return [...tags].join(", ")
}
function TagTogglesRow({ value, onChange, items }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon }) => {
        const pressed = parseCsv(value).includes(key)
        return (
          <Toggle
            key={key}
            variant="outline"
            pressed={pressed}
            onPressedChange={next => onChange(toggleCsvTag(value, key, next))}
            aria-label={label}
            className="gap-2"
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span className="text-xs">{label}</span>
          </Toggle>
        )
      })}
    </div>
  )
}

// WARN: keep in sync with what I have in advEditor.jsx
const TAG_ITEMS = [
  { key: "unofficial", label: "Unofficial" },
  { key: "destroyed", label: "Destroyed" },
  { key: "capital", label: "Capital" },
  { key: "notes_visible", label: "Notes Visible" },
  { key: "moon", label: "Moon" },
  { key: "dwarf", label: "Dwarf" },
  { key: "massive", label: "Massive" },
  { key: "giant", label: "Giant" },
  { key: "supermassive", label: "Supermassive" },
  { key: "tidally_locked", label: "Tidally Locked" },
  { key: "geologically_active", label: "Geologically Active" },
  { key: "subsurface_ocean", label: "Subsurface Ocean" },
  { key: "ammonia_ocean", label: "Ammonia Ocean" },
  { key: "sulfuric_acid_ocean", label: "Sulfuric Acid Ocean" },
  { key: "exoplanet", label: "Exoplanet" },
  { key: "mountainous", label: "Mountainous" },
  { key: "habitable", label: "Habitable" },
]
