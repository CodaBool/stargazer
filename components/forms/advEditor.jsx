"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, X, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { RgbaColorPicker } from "react-colorful"
import { debounce } from "@/lib/utils"
import dynamic from "next/dynamic"
import { Slider } from "../ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdvancedEditor({ children, IS_GALAXY, mapName, feature, editProp }) {
  return (
    <Dialog defaultOpen={true}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{feature.properties.name}</DialogTitle>
          <DialogDescription className="text-center">
            Some values when left blank will be filled in with generated values
          </DialogDescription>
          <FormComponent IS_GALAXY={IS_GALAXY} mapName={mapName} feature={feature} editProp={editProp} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export function FormComponent({ feature, mapName, IS_GALAXY, editProp }) {
  const Quill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const type = feature?.properties?.type

  // local UI state (fast), debounced persistence (slow)
  const [values, setValues] = useState(() => feature?.properties ?? {})

  useEffect(() => {
    const incoming = feature?.properties ?? {}
    setValues((prev) => ({ ...prev, ...incoming }))
  }, [feature?.id])

  const debouncedRef = useRef(null)
  if (!debouncedRef.current) {
    debouncedRef.current = debounce((val, key) => editProp(val, key), 150)
  }
  const persistSoon = (val, key) => debouncedRef.current(val, key)
  const persistNow = (val, key) => editProp(val, key)

  const set = (key, val, { immediate = false } = {}) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    if (immediate) persistNow(val, key)
    else persistSoon(val, key)
  }

  const removeKey = (key) => {
    setValues((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    persistNow(undefined, key)
  }

  // -------- sliders config helpers --------
  const numOr = (v, fallback) => (typeof v === "number" && !Number.isNaN(v) ? v : fallback)

  const diameterRange = useMemo(() => {
    if (type === "asteroid") return { min: 0.1, max: 1000, step: 0.1 }
    if (type === "station" || type === "ship") return { min: 0.05, max: 50, step: 0.05 }
    if (type === "star") return { min: 0.01, max: 1000, step: 0.01 }
    return { min: 1_000, max: 150_000, step: 1_000 }
  }, [type])
  const temperatureRange = useMemo(() => {
    if (type === "star") return { min: 2_000, max: 25_000, step: 1_000 }
    return { min: -273, max: 300, step: 1 }
  }, [type])

  return (
    <div className="space-y-6 text-sm">
      <Section>
        <Comma label="Alias" value={values.alias} onChange={(v) => set("alias", v, { immediate: true })} />
        <Comma label="Region" value={values.region} onChange={(v) => set("region", v, { immediate: true })} />
        <Comma label="People" value={values.people} onChange={(v) => set("people", v, { immediate: true })} />

        <Field label="Image">{input(values.image, (v) => set("image", v))}</Field>
        <Field label="Caption">{input(values.caption, (v) => set("caption", v))}</Field>
        <Field label="Seed">{input(values.seed, (v) => set("seed", v))}</Field>
        <Field label="Source">{input(values.source, (v) => set("source", v))}</Field>

        <BoolRow label="Unofficial" value={!!values.unofficial} onChange={(v) => set("unofficial", v, { immediate: true })} />
        <BoolRow label="Destroyed" value={!!values.destroyed} onChange={(v) => set("destroyed", v, { immediate: true })} />
        <BoolRow label="Capital" value={!!values.capital} onChange={(v) => set("capital", v, { immediate: true })} />
        <BoolRow label="Visible" value={!!values.visibility} onChange={(v) => set("visibility", v, { immediate: true })} />
        <BoolRow label="Notes Visible" value={!!values.notesVisibility} onChange={(v) => set("notesVisibility", v, { immediate: true })} />
      </Section>

      <Section title="Notes">
        <Quill theme="bubble" value={values.notes ?? ""} onChange={(v) => set("notes", v)} />
      </Section>

      <Section title="Colors">
        <Row label="Icon Tint In Drawer">
          <ColorGrid value={values.tint} count={1} onChange={(v) => set("tint", v, { immediate: true })} />
        </Row>

        {IS_GALAXY && (
          <>
            {type !== "star" && (
              <Row label="Base">
                <ColorGrid value={values.baseColors} count={4} onChange={(v) => set("baseColors", v, { immediate: true })} />
              </Row>
            )}
            {(type === "barren_planet" || type === "moon" || type === "ice_planet" || type === "eyeball_planet" || type === "jovian" || type === "lava_planet" || type === "terrestrial" || type === "ocean_planet" || type === "ecumenopolis") && (
              <Row label="Features">
                <ColorGrid
                  value={values.featureColors}
                  count={4}
                  onChange={(v) => set("featureColors", v, { immediate: true })}
                />
              </Row>
            )}
            {(type === "ringed_planet" || type === "lava_planet" || type === "terrestrial" || type === "ocean_planet" || type === "ecumenopolis") && (
            <Row label="Extra Layer">
              <ColorGrid value={values.layerColors} count={4} alpha onChange={(v) => set("layerColors", v, { immediate: true })} />
              </Row>
            )}

            {(type === "terrestrial" || type === "ecumenopolis") && (
              <Row label="Planet Atmosphere">
                <ColorGrid
                  value={values.atmosphereColors}
                  count={3}
                  alpha
                  onChange={(v) => set("atmosphereColors", v, { immediate: true })}
                />
              </Row>
            )}
          </>
        )}
      </Section>

      {IS_GALAXY && (
        <>
          <Section title="Planet Details">
            {/* New fields */}
            <Field label="Pixels">
              {sliderNum(
                numOr(values.pixels, 200),
                (v) => set("pixels", v),
                50,
                1000,
                50
              )}
            </Field>

            {(type === "terrestrial" || type === "ecumenopolis" || type === "ocean_planet") && (
              <Field label="Cloud %">
                {sliderNum(numOr(values.cloudPercent, 0), (v) => set("cloudPercent", v), 0, 1, 0.01, true)}
              </Field>
            )}

            {(type === "terrestrial" || type === "ocean_planet" || type === "ice_planet" || type === "eyeball_planet") && (
              <Field label="Hydro %">
                {sliderNum(numOr(values.hydroPercent, 0), (v) => set("hydroPercent", v), 0, 1, 0.01, true)}
              </Field>
            )}

            {type === "lava_planet" && (
              <Field label="Lava %">
                {sliderNum(
                  numOr(values.lavaPercent, 0),
                  (v) => set("lavaPercent", v),
                  0,
                  1,
                  0.01,
                  true,
                )}
              </Field>
            )}

            {(type !== "star" && type !== "station") && (
              <Field label="Ice %">
                {sliderNum(numOr(values.icePercent, 0), (v) => set("icePercent", v), 0, 1, 0.01, true)}
              </Field>
            )}

            {type === "ringed_planet" && (
              <Field label="Ring Size">
                {sliderNum(numOr(values.ringSize, 0), (v) => set("ringSize", v), 0.001, 0.2, 0.005, null, true)}
              </Field>
            )}


            {type === "asteroid" && (
              <Field label="Asteroid Size">
                {sliderNum(numOr(values.size, 1), (v) => set("size", v), 1, 9, 1)}
              </Field>
            )}

            {/* <Field label="Modifier">
              <Select
                value={values.modifier ?? "none"}
                onValueChange={(v) => set("modifier", v === "none" ? undefined : v, { immediate: true })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {["moon", "dwarf", "supermassive", "giant"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>*/}

            {(type !== "star") && (
              <>
                {/* <BoolRow label="Is Moon" value={!!values.isMoon} onChange={(v) => set("isMoon", v, { immediate: true })} />*/}
                <Field label="Hours in a Day">
                  <SliderWithInput
                    value={numOr(values.hoursInDay, 24)}
                    onChange={(v) => set("hoursInDay", v)}
                    min={0}
                    max={1_000}
                    step={1}
                  />
                </Field>
                <Field label="Days in a Year">
                  <SliderWithInput
                    value={numOr(values.daysInYear, 365)}
                    onChange={(v) => set("daysInYear", v)}
                    min={0}
                    max={3_000}
                    step={1}
                  />
                </Field>
                <Field label="Composition">
                  <Comma
                    label={null}
                    value={values.composition}
                    onChange={(v) => set("composition", v, { immediate: true })}
                    placeholder="iron, silicate, methane..."
                    hideLabel
                  />
                </Field>
              </>
            )}

            {/* Convert previous number inputs to sliders */}
            <Field label="Model Size">
              <PlanetSizeSlider
                value={numOr(values.planetSize, 2)}
                onChange={(v) => set("planetSize", v)}
              />
            </Field>

            <Field label="Temperature (°C)">
              {type !== "star" && <p className="text-sm text-muted-foreground inline ms-4">Earth = 15°C</p>}
              {type === "star" && <p className="text-sm text-muted-foreground inline ms-4">Sun = 5499°C</p>}
              <SliderWithInput
                value={numOr(values.temperature, temperatureRange.min)}
                onChange={(v) => set("temperature", v)}
                min={temperatureRange.min}
                max={temperatureRange.max}
                step={temperatureRange.step}
              />
            </Field>

            <Field label={`Diameter (${type === "star" ? "solar radii" : "km"})`}>
              {type === "star" && <p className="text-sm text-muted-foreground inline ms-4">solar radii</p>}
              {type === "asteroid" && <p className="text-sm text-muted-foreground inline ms-4">1 Ceres (largest asteroid) = 939 km</p>}
              {type === "station" && <p className="text-sm text-muted-foreground inline ms-4">The Citadel (Mass Effect) = 44 km</p>}
              {type === "ship" && <p className="text-sm text-muted-foreground inline ms-4">Star Destroyer = 1.6 km</p>}
              {(type !== "star" && type !== "asteroid" && type !== "station" && type !== "ship") && <p className="text-sm text-muted-foreground inline ms-4">Earth = 12,742 km</p>}
              <SliderWithInput
                value={numOr(values.diameter, diameterRange.min)}
                onChange={v => set("diameter", v)}
                min={diameterRange.min}
                max={diameterRange.max}
                step={diameterRange.step}
              />
            </Field>


            {(type !== "star") && (
              <>
                <Field label="Gravity (cm/s²)">
                  <p className="text-sm text-muted-foreground inline ms-4">Earth = 981 cm/s²</p>
                  <SliderWithInput
                    value={numOr(values.gravity, 980)}
                    onChange={v => set("gravity", v)}
                    min={0}
                    max={4_000}
                    step={10}
                  />
                </Field>
                <Field label="Pressure (millibars)">
                  <p className="text-sm text-muted-foreground inline ms-4">Earth = 1013 mb</p>
                  <SliderWithInput
                    value={numOr(values.pressure, 1000)}
                    onChange={v => set("pressure", v)}
                    min={0}
                    max={10_000}
                    step={10}
                  />
                </Field>
              </>
            )}
          </Section>

          <CustomFieldsRender
            values={values}
            setProp={(k, v, opts) => set(k, v, opts)}
            debouncedRef={debouncedRef}
            setValues={setValues}
            removeKey={removeKey}
          />
        </>
      )}
    </div>
  )
}

/* ------------------ planetSize slider w/ icon ------------------ */

function PlanetSizeSlider({ value, onChange }) {
  const v = clampNum(value, 1, 3)
  const icon = "🪐"
  const steps = [
    3.4, 3.2, 3.0, 2.8, 2.6,
    2.4, 2.2, 2.0, 1.8, 1.6, 1.4,
  ]
  const t = (v - 1) / 2 // 0 → 1
  const idx = Math.min(steps.length - 1, Math.floor(t * steps.length))
  const scale = steps[steps.length - 1 - idx]
  return (
    <div className="flex items-center gap-3">
      <Slider value={[v]} onValueChange={(arr) => onChange(arr[0])} min={1} max={3} step={0.2} className="w-[411px]" />
      <div
        className="text-center select-none ms-12"
        style={{ transform: `scale(${scale})`, transformOrigin: "center" }}
      >
        {icon}
      </div>
    </div>
  )
}

/* ------------------ custom fields ------------------ */

function CustomFieldsRender({ values, setProp, debouncedRef, setValues, removeKey }) {
  const [keyDraft, setKeyDraft] = useState("")
  const [valDraft, setValDraft] = useState("")

  const customEntries = useMemo(() => {
    const obj = values ?? {}
    return Object.entries(obj)
      .filter(([k]) => !KNOWN_KEYS.has(k))
      .filter(([k]) => !k.startsWith("_"))
      .sort(([a], [b]) => a.localeCompare(b))
  }, [values])

  function addField() {
    const k = keyDraft.trim()
    if (!k) return
    if (KNOWN_KEYS.has(k)) return
    if ((values ?? {})[k] !== undefined) return

    setProp(k, valDraft ?? "", { immediate: true })
    setKeyDraft("")
    setValDraft("")
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label className="text-xs uppercase opacity-70">Custom Properties</Label>
        <div className="flex gap-2">
          <Input placeholder="key" value={keyDraft} onChange={(e) => setKeyDraft(e.target.value)} />
          <Input placeholder="value" value={valDraft} onChange={(e) => setValDraft(e.target.value)} />
          <Button type="button" size="icon" onClick={addField} title="Add field">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {customEntries.length > 0 && (
        <div className="space-y-2">
          {customEntries.map(([k, v]) => (
            <div key={k} className="flex items-center gap-2">
              <div className="min-w-[180px] max-w-[220px] px-2 py-1 border rounded text-xs opacity-80 truncate">
                {k}
              </div>

              <Input
                value={v ?? ""}
                onChange={(e) => {
                  const next = e.target.value
                  setValues((prev) => ({ ...prev, [k]: next }))
                  debouncedRef.current(next, k)
                }}
              />

              <Trash2
                className="cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => removeKey(k)}
                title="Delete field"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------ ui helpers ------------------ */

function Section({ title = "Metadata", children }) {
  return (
    <div className="space-y-3 border-b pb-4">
      <h3 className="font-semibold text-xs uppercase opacity-70">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="w-40">{label}</Label>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      {label && <Label>{label}</Label>}
      {children}
    </div>
  )
}

function BoolRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="w-40">{label}</Label>
      <Checkbox checked={!!value} onCheckedChange={(v) => onChange(v === true)} />
    </div>
  )
}

function sliderNum(value, onChange, min = 0, max = 1, step = 0.1, isPercent = false, hideNumber = false) {
  const safe = clampNum(value, min, max)
  return (
    <div className="flex items-center gap-3">
      {!hideNumber && <div className="w-20 text-xs opacity-70 tabular-nums">{isPercent ? `${Math.round(safe * 100)}` : safe}</div>}
      <Slider value={[safe]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step} className="flex-1" />
    </div>
  )
}

function input(value, onChange) {
  return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
}

function clampNum(v, min, max) {
  const n = typeof v === "number" ? v : Number(v)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

/* ------------------ comma tags ------------------ */

function parseCsv(csv) {
  if (!csv) return []
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}
function toCsv(tags) {
  return tags.join(", ")
}
function uniq(arr) {
  return [...new Set(arr)]
}

function Comma({ label, value, onChange, placeholder = "", hideLabel = false }) {
  const [draft, setDraft] = useState("")
  const tags = uniq(parseCsv(value))

  function commit(nextTags) {
    onChange(toCsv(nextTags))
  }

  function addFromDraft() {
    const incoming = draft.split(",").map((t) => t.trim()).filter(Boolean)
    if (!incoming.length) return
    commit(uniq([...tags, ...incoming]))
    setDraft("")
  }

  function removeTag(tag) {
    commit(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      {!hideLabel && label && <Label>{label}</Label>}

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="h-8"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addFromDraft()
            }
          }}
        />
        <Button type="button" variant="secondary" size="icon" className="h-8 w-8" onClick={addFromDraft} title="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="grid grid-cols-2 gap-2 select-none">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center justify-between gap-2 py-1">
              <span className="truncate">{tag}</span>
              <button
                type="button"
                className="opacity-70 hover:opacity-100 cursor-pointer"
                onClick={() => removeTag(tag)}
                aria-label={`Remove ${tag}`}
              >
                <span className="sr-only">Remove</span>
                <span className="inline-flex">
                  <X size={14} />
                </span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------ colors ------------------ */

const rgbaToObj = (rgba) => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 } : { r: 255, g: 255, b: 255, a: 1 }
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const rgbaObjToCss = ({ r, g, b, a }) =>
  `rgba(${clamp(Math.round(r), 0, 255)}, ${clamp(Math.round(g), 0, 255)}, ${clamp(Math.round(b), 0, 255)}, ${clamp(a ?? 1, 0, 1)})`

const hexToRgbaObj = (hex) => {
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

const rgbaObjToHex6 = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")
const rgbaObjToHex8 = ({ r, g, b, a }) =>
  "#" +
  [r, g, b, Math.round(clamp(a ?? 1, 0, 1) * 255)]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")

const splitCsv = (v, count) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
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
          onChange={(next) => {
            const nextArr = [...colors]
            nextArr[i] = next
            onChange(nextArr.join(","))
          }}
        />
      ))}
    </div>
  )
}

function SliderWithInput({
  value,
  onChange,
  min,
  max,
  step,
}) {
  const v = typeof value === "number" ? value : Number(value)
  const safe = Number.isFinite(v) ? v : min

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Slider
          value={[safe]}
          onValueChange={(arr) => onChange(arr[0])}
          min={min}
          max={max}
          step={step}
        />
      </div>

      <Input
        type="number"
        className="w-28 h-8"
        value={Number.isFinite(safe) ? safe : ""}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === "") return onChange("")
          onChange(Number(raw))
        }}
        min={min}
        max={max}
        step={step}
      />
    </div>
  )
}


function PopoverPickerSimple({ value, onChange, alpha = false }) {
  const rgba = hexToRgbaObj(value)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className="swatch w-5 h-5 cursor-pointer border border-white"
          style={{ backgroundColor: rgbaObjToCss(rgba) }}
          title={typeof value === "string" ? value : ""}
        />
      </PopoverTrigger>

      <PopoverContent side="right" align="start" sideOffset={12} className="z-[9999] w-auto p-2">
        <RgbaColorPicker
          color={rgba}
          onChange={(nextObj) => {
            const next = alpha ? rgbaObjToHex8(nextObj) : rgbaObjToHex6(nextObj)
            onChange(next)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

const KNOWN_KEYS = new Set([
  // earth + galaxy
  "alias",
  "region",
  "image",
  "caption",
  "people",
  "notes",
  "tint",
  "seed",
  "source",
  "unofficial",
  "destroyed",
  "capital",
  "visibility",
  "notesVisibility",

  // common
  "name",
  "type",
  "starType", // galaxy only
  "fill",
  "stroke",
  "icon",
  "faction",
  "locations",
  "description",

  // galaxy-only extras
  "pixels",
  "baseColors",
  "featureColors",
  "layerColors",
  "atmosphereColors",
  "schemeColor",
  "cloudPercent",
  "hydroPercent",
  "lavaPercent",
  "ringSize",
  "size",
  "planetSize",
  "temperature",
  "diameter",
  "isMoon",
  "modifier",
  "hoursInDay",
  "daysInYear",
  "gravity",
  "pressure",
  "icePercent",
  "composition",
])
