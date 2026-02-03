"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

export default function AdvancedEditor({ children, IS_GALAXY, mapName, feature, editProp }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{feature.properties.name}</DialogTitle>
          <DialogDescription className="text-center">
            Some values when left blank will be filled in with generated values
          </DialogDescription>
          <FormComponent
            IS_GALAXY={IS_GALAXY}
            mapName={mapName}
            feature={feature}
            editProp={editProp}
          />
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
  }, [feature?.id]) // important: feature id, not whole object

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
    // persist delete
    persistNow(undefined, key) // or set(key, undefined, { immediate: true }) if your parent deletes on undefined
  }

  return (
    <div className="space-y-6 text-sm">
      <Section>
        <Comma name="alias" label="Alias" value={values.alias} onChange={(v) => set("alias", v, { immediate: true })} />
        <Comma name="region" label="Region" value={values.region} onChange={(v) => set("region", v, { immediate: true })} />
        <Comma name="people" label="People" value={values.people} onChange={(v) => set("people", v, { immediate: true })} />

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
        <Quill
          theme="bubble"
          value={values.notes ?? ""}
          onChange={(v) => set("notes", v)} // debounced
        />
      </Section>

      <Section title="Colors">
        <Row label="Icon Tint In Drawer">
          <ColorGrid
            value={values.tint}
            count={1}
            onChange={(v) => set("tint", v, { immediate: true })}
          />
        </Row>
        {IS_GALAXY && (
          <>
            <Row label="Planet Base">
              <ColorGrid
                value={values.baseColors}
                count={4}
                onChange={(v) => set("baseColors", v, { immediate: true })}
              />
            </Row>
            <Row label="Planet Feature">
              <ColorGrid
                value={values.featureColors}
                count={4}
                onChange={(v) => set("featureColors", v, { immediate: true })}
              />
            </Row>
            <Row label="Planet Layer">
              <ColorGrid
                value={values.layerColors}
                count={4}
                alpha
                onChange={(v) => set("layerColors", v, { immediate: true })}
              />
            </Row>

            {(type === "terrestrial" || type === "ocean_planet") && (
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
            <Field label="Model Size (1-3, smaller is larger)">{numberInput(values.planetSize, (v) => set("planetSize", v))}</Field>
            <Field label="Temperature (°C)">{numberInput(values.temperature, (v) => set("temperature", v))}</Field>
            <Field label={`Diameter (${type === "star" ? "solar radii" : "km"})`}>{numberInput(values.diameter, (v) => set("diameter", v))}</Field>
            <Field label="Gravity (cm/s²)">{numberInput(values.gravity, (v) => set("gravity", v))}</Field>
            <Field label="Pressure (milibars)">{numberInput(values.pressure, (v) => set("pressure", v))}</Field>
            <Field label="Ice % (0-1)">{numberInput(values.icePercent, (v) => set("icePercent", v), { step: "0.01" })}</Field>
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

function CustomFieldsRender({
  values,        // the local values object from AdvancedEditor
  setProp,       // your set(key, val, { immediate }) helper
  debouncedRef,
  setValues,
  removeKey,
}) {
  const [keyDraft, setKeyDraft] = useState("")
  const [valDraft, setValDraft] = useState("")

  // per-key debouncers so multiple custom fields don't fight one timer
  const debouncersRef = useRef(new Map())

  const customEntries = useMemo(() => {
    const obj = values ?? {}
    return Object.entries(obj)
      .filter(([k]) => !KNOWN_KEYS.has(k))
      .filter(([k]) => !k.startsWith("_")) // optional: hide internal keys
      .sort(([a], [b]) => a.localeCompare(b))
  }, [values])

  function addField() {
    const k = keyDraft.trim()
    if (!k) return
    if (KNOWN_KEYS.has(k)) return // can't shadow known fields
    if ((values ?? {})[k] !== undefined) return // no duplicates

    setProp(k, valDraft ?? "", { immediate: true })
    setKeyDraft("")
    setValDraft("")
  }

  function removeField(k) {
    setValues((prev) => {
      const next = { ...prev }
      delete next[k]
      return next
    })
    setProp(k, undefined, { immediate: true }) // persists deletion
  }

  return (
    <div className="space-y-3">
      {/* add new */}
      <div className="space-y-2">
        <Label className="text-xs uppercase opacity-70">Custom Properties</Label>
        <div className="flex gap-2">
          <Input
            placeholder="key"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
          />
          <Input
            placeholder="value"
            value={valDraft}
            onChange={(e) => setValDraft(e.target.value)}
          />
          <Button type="button" size="icon" onClick={addField} title="Add field">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* existing custom */}
      {customEntries.length > 0 && (
        <div className="space-y-2">
          <div className="space-y-2">
            {customEntries.map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                {/* locked key */}
                <div className="min-w-[180px] max-w-[220px] px-2 py-1 border rounded text-xs opacity-80 truncate">
                  {k}
                </div>

                {/* editable value */}
                <Input
                  value={v ?? ""}
                  onChange={(e) => {
                    const next = e.target.value
                    // local update only
                    setValues((prev) => ({ ...prev, [k]: next }))
                    // persist debounced once
                    debouncedRef.current(next, k)
                  }}

                />

                <Trash2
                  className="cursor-pointer opacity-70 hover:opacity-100"
                  // size={18}
                  onClick={() => removeKey(k)}
                  title="Delete field"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}


/* ------------------ ui helpers ------------------ */

function Section({ title, children }) {
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
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function BoolRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="w-40">{label}</Label>
      <Checkbox
        checked={!!value}
        onCheckedChange={(v) => onChange(v === true)}
      />
    </div>
  )
}

function input(value, onChange) {
  return (
    <Input
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function numberInput(value, onChange, { step } = {}) {
  return (
    <Input
      type="number"
      step={step}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value
        onChange(raw === "" ? "" : Number(raw))
      }}
    />
  )
}

/* ------------------ comma tags (no RHF) ------------------ */

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

function Comma({ name, label, value, onChange, placeholder = "" }) {
  const [draft, setDraft] = useState("")

  const tags = uniq(parseCsv(value))

  function commit(nextTags) {
    onChange(toCsv(nextTags))
  }

  function addFromDraft() {
    const incoming = draft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (!incoming.length) return
    commit(uniq([...tags, ...incoming]))
    setDraft("")
  }

  function removeTag(tag) {
    commit(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

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
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8"
          onClick={addFromDraft}
          title="Add"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {tags.length > 0 && (
        <div className="grid grid-cols-2 gap-2 select-none">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center justify-between gap-2 py-1"
            >
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

/* ------------------ custom arbitrary fields ------------------ */

function CustomFields({ editProp }) {
  const [key, setKey] = useState("")
  const [val, setVal] = useState("")

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input placeholder="value" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button
          size="icon"
          type="button"
          onClick={() => {
            if (!key) return
            editProp(val, key)
            setKey("")
            setVal("")
          }}
        >
          <Plus />
        </Button>
      </div>

      <div className="text-xs opacity-70">
        Adds arbitrary properties directly to feature.properties
      </div>
    </div>
  )
}

/* ------------------ colors ------------------ */

const rgbaToObj = (rgba) => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
  return m
    ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 }
    : { r: 255, g: 255, b: 255, a: 1 }
}

const objToRgba = (o) =>
  typeof o === "object" ? `rgba(${o.r}, ${o.g}, ${o.b}, ${o.a})` : o

const rgbToHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")

const rgbaToHexA = ({ r, g, b, a }) =>
  "#" + [r, g, b, Math.round(a * 255)].map((v) => v.toString(16).padStart(2, "0")).join("")

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

const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

const rgbaObjToCss = ({ r, g, b, a }) =>
  `rgba(${clamp(Math.round(r), 0, 255)}, ${clamp(Math.round(g), 0, 255)}, ${clamp(Math.round(b), 0, 255)}, ${clamp(a ?? 1, 0, 1)})`

const hexToRgbaObj = (hex) => {
  if (!hex) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof hex === "object") return hex
  if (typeof hex !== "string") return { r: 255, g: 255, b: 255, a: 1 }

  const s = hex.trim()
  if (!s.startsWith("#")) return rgbaToObj(s) // fallback to rgba()

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
  "#" +
  [r, g, b]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")

const rgbaObjToHex8 = ({ r, g, b, a }) =>
  "#" +
  [r, g, b, Math.round(clamp(a ?? 1, 0, 1) * 255)]
    .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
    .join("")


function PopoverPickerSimple({ value, onChange, alpha = false }) {
  // value may be #RRGGBB, #RRGGBBAA, rgba(...), or object
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

      <PopoverContent
        side="right"
        align="start"
        sideOffset={12}
        className="z-[9999] w-auto p-2"
      >
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
  "clouds",
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
