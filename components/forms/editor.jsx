"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RgbaColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  Link as Chain,
  Notebook,
  StickyNote,
  Code,
  Map,
  Plus,
  MessageCircleWarning,
  Menu,
  Trash2,
  X,
  Book,
  Drama,
} from "lucide-react"
import { SVG_BASE, getIconHTML, debounce } from "@/lib/utils"
import AdvancedEditor from "@/components/forms/advEditor"
import { STAR_VARIANT_WEIGHTS } from "@/lib/fakeData.js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import IconSelector from "../iconSelector"
import "react-quill-new/dist/quill.bubble.css"
import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { Badge } from "../ui/badge"

export default function EditorForm({
  feature,
  draw,
  setPopup,
  mapName,
  popup,
  params,
  TYPES,
  iconIndex,
  IS_GALAXY,
}) {
  const Quill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const [iconHTML, setIconHTML] = useState(null)

  // local UI state
  const [values, setValues] = useState(() => feature?.properties ?? {})
  const [nameError, setNameError] = useState(false)

  const availableTypes = TYPES?.[feature.geometry.type.toLowerCase().trim()] ?? []
  const starTypes = STAR_VARIANT_WEIGHTS.map((s) => s[0])

  useEffect(() => {
    setValues(feature?.properties ?? {})
    setNameError(false)
  }, [feature?.id])

  function editProp(newVal, key) {
    const f = draw.get(feature.id)
    const newProperties = { ...f.properties }
    if (typeof newVal === "undefined") {
      console.log("DELETE!", key)
      delete newProperties[key]
    } else {
      newProperties[key] = newVal
    }
    const newFeature = { ...f, properties: newProperties }
    console.log(newFeature.properties)
    draw.add(newFeature)
    setPopup(newFeature)

    // console.log("saved", newFeature.properties)

    const unsaved = document.querySelector(".unsaved-text")
    if (unsaved) unsaved.style.visibility = "visible"
  }

  // one debouncer for noisy fields (text + quill)
  const debouncedRef = useRef(null)
  if (!debouncedRef.current) {
    debouncedRef.current = debounce((val, key) => editProp(val, key), 180)
  }

  const setProp = (key, val, { immediate = false } = {}) => {
    setValues((prev) => ({ ...prev, [key]: val }))
    if (immediate) editProp(val, key)
    else debouncedRef.current(val, key)
  }

  function selectIcon(icon) {
    let url = icon
    if (typeof icon === "object") {
      url = `${SVG_BASE}${icon.folder}/${icon.name}.svg`
    }
    setProp("icon", url, { immediate: true })
    document.querySelector(".icon-dialog")?.childNodes?.[2]?.click()
  }

  useEffect(() => {
    if (popup.geometry.type === "Point") {
      getIconHTML(popup, mapName).then((r) => setIconHTML(r))
    }
  }, [popup, feature, mapName])

  function foundryClick() {
    window.parent.postMessage({type: "link", link: feature.properties.link, notify: `Link = ${feature.properties.link}`}, "*")
  }

  const type = values.type

  return (
    <form
      className="space-y-4 font-mono select-text editor-table mt-4"
      style={{ minWidth: "400px", maxWidth: "50vw" }}
    >
      <Table>
        <TableBody>
          {/* name */}
          <TableRow>
            <TableCell className="font-medium">Name</TableCell>
            <TableCell>
              <Input
                className="h-8"
                value={values.name ?? ""}
                onChange={(e) => {
                  const v = e.target.value
                  setValues((p) => ({ ...p, name: v }))
                  if (v.trim().length === 0) {
                    setNameError(true)
                    return
                  }
                  setNameError(false)
                  // debounce name (text)
                  debouncedRef.current(v, "name")
                }}
              />
            </TableCell>
          </TableRow>

          {/* type */}
          <TableRow>
            <TableCell className="font-medium">Type</TableCell>
            <TableCell>
              <Select
                value={values.type ?? ""}
                onValueChange={(val) => setProp("type", val, { immediate: true })}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTypes.map((t, index) => (
                    <SelectItem key={index} value={t} className="cursor-pointer">
                      <img
                        src={`${SVG_BASE}${mapName}/${t}.svg`}
                        alt={`${t} icon`}
                        className="inline-block w-4 h-4 mr-2 object-contain align-middle"
                      />
                      {t.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>

          {/* starType */}
          {type === "star" && (
            <TableRow>
              <TableCell className="font-medium">Star Type</TableCell>
              <TableCell>
                <SelectTagsFieldSimple
                  value={values.starType ?? ""}
                  options={starTypes}
                  placeholder="Star Type"
                  onChange={(csv) => setProp("starType", csv, { immediate: true })}
                />
              </TableCell>
            </TableRow>
          )}

          {/* fill */}
          {(feature.geometry.type === "Point" || feature.geometry.type.includes("Poly")) && (
            <TableRow>
              <TableCell className="font-medium">Fill</TableCell>
              <TableCell>
                <PopoverPickerSimple
                  value={values.fill}
                  onChange={(rgba) => setProp("fill", rgba, { immediate: true })}
                />
              </TableCell>
            </TableRow>
          )}

          {/* stroke */}
          {(feature.geometry.type.includes("LineString") || feature.geometry.type.includes("Poly")) && (
            <TableRow>
              <TableCell className="font-medium">Stroke</TableCell>
              <TableCell>
                <PopoverPickerSimple
                  value={values.stroke}
                  onChange={(rgba) => setProp("stroke", rgba, { immediate: true })}
                />
              </TableCell>
            </TableRow>
          )}

          {/* icon */}
          <TableRow>
            <TableCell className="font-medium">Icon</TableCell>
            <TableCell className="flex items-center justify-between">
              {!values.icon && popup.geometry.type === "Point" && iconHTML && (
                <div
                  dangerouslySetInnerHTML={{ __html: iconHTML }}
                  className="w-5 h-5 popup-preview overflow-hidden cursor-pointer"
                  onClick={() => document.querySelector(".icon-dialog-open")?.click()}
                />
              )}

              {!values.icon && (popup.geometry.type === "Polygon" || popup.geometry.type.includes("LineString")) && (
                <img
                  src={`${SVG_BASE}${mapName}/${popup.properties.type}.svg`}
                  alt="type icon"
                  className="inline-block w-4 h-4 mr-2 object-contain align-middle cursor-pointer popup-preview"
                  onClick={() => document.querySelector(".icon-dialog-open")?.click()}
                />
              )}

              <IconSelector
                mapName={mapName.includes("lancer") ? "lancer" : mapName}
                onSelect={selectIcon}
                iconIndex={iconIndex}
              >
                <img
                  src={values.icon || "#"}
                  style={{ opacity: values.icon ? 1 : 0 }}
                  alt="Custom icon"
                  className="w-5 h-5 object-contain cursor-pointer icon-dialog-open"
                />
              </IconSelector>

              {values.icon && (
                <Trash2
                  className="cursor-pointer text-gray-400"
                  size={22}
                  onClick={() => setProp("icon", "", { immediate: true })}
                />
              )}
            </TableCell>
          </TableRow>


          {/* Foundry */}
          {params.get("id") === "foundry" && (
            <TableRow>
              <TableCell className="font-medium">Foundry</TableCell>
              <TableCell className="flex items-center justify-between">
                {!feature.properties.link && (
                  <Link editProp={editProp} feature={feature} />
                )}

                {feature.properties.link && (
                  <>
                    <Button variant="outline" size="icon" type="button" className="flex-7 h-[32px]" onClick={foundryClick}>
                      {(feature.properties.link?.length === 29 && feature.properties.link?.includes("JournalEntry.")) && (
                        <Book />
                      )}
                      {(feature.properties.link?.length === 63 && feature.properties.link?.includes(".JournalEntryPage.")) && (
                        <StickyNote />
                      )}
                      {feature.properties.link?.includes("Macro.") && (
                        <Code />
                      )}
                      {feature.properties.link?.includes("forien-quest-log.") && (
                        <MessageCircleWarning />
                      )}
                      {feature.properties.link?.includes("Scene.") && (
                        <Drama />
                      )}
                    </Button>
                    <Trash2
                      className="cursor-pointer text-gray-400 flex-1"
                      size={22}
                      onClick={() => setProp("link", "", { immediate: true })}
                    />
                  </>
                )}

                {/* <p>{feature.properties.link}{feature.properties.link}{feature.properties.link}</p>*/}
              </TableCell>
            </TableRow>
          )}

          {/* faction */}
          <TableRow>
            <TableCell className="font-medium">Factions</TableCell>
            <TableCell>
              <CommaTagsFieldSimple
                value={values.faction ?? ""}
                placeholder="Tunnel Snakes"
                onChange={(csv) => setProp("faction", csv, { immediate: true })}
              />
            </TableCell>
          </TableRow>

          {/* locations */}
          <TableRow>
            <TableCell className="font-medium">Locations</TableCell>
            <TableCell>
              <CommaTagsFieldSimple
                value={values.locations ?? ""}
                placeholder="Power Plant"
                onChange={(csv) => setProp("locations", csv, { immediate: true })}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <label className="block text-sm font-medium mb-1">description</label>
      <Quill
        theme="bubble"
        value={values.description ?? ""}
        onChange={(val) => setProp("description", val)} // debounced
        className="border border-gray-800"
      />

      <div className="text-center m-1">
        {nameError && <p className="text-red-500">name is required</p>}
      </div>

      <AdvancedEditor IS_GALAXY={IS_GALAXY} mapName={mapName} feature={feature} editProp={editProp}>
        <Button type="button" variant="secondary" className="cursor-pointer w-full h-[30px]">
          <Menu className="mr-2 h-4 w-4" />
          See More
        </Button>
      </AdvancedEditor>
    </form>
  )
}

export const Link = ({ editProp, feature }) => {
  const [documentId, setDocumentId] = useState()
  const [open, setOpen] = useState()
  const [hasQuests, setHasQuests] = useState()

  const handleSubmit = (tab, doc) => {
    if (feature.geometry.type !== "Point") {
      toast.warning("Only Point locations can have links. Stay tuned for a future update to add more geometry link support.")
      return
    }
    window.parent.postMessage({ type: "listen", tab, doc }, "*")
  }

  const saveUUID = (value) => {
    const v = value || documentId || ""
    editProp(v, "link")
    setOpen(false)
  }

  useEffect(() => {
    const listener = (e) => {
      if (e.data.type === "uuid") {
        setDocumentId(e.data.uuid)
        saveUUID(e.data.uuid)
      } else if (e.data.type === "modules") {
        if (e.data.modules.includes("forien-quest-log")) setHasQuests(true)
      }
    }
    window.addEventListener("message", listener)
    window.parent.postMessage({ type: "modules", desc: "give me all active modules" }, "*")
    return () => window.removeEventListener("message", listener)
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          onClick={() => setOpen(!open)}
          size="icon"
          variant="outline"
          type="button"
          className="flex-7 h-[32px]"
        >
          <Chain />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col">
        <p className="mb-3 text-gray-400">
          Link a Foundry Document to this feature. A UUID can be entered manually or you can connect it by using the buttons.
        </p>
        <hr className="border my-4 border-gray-500" />
        <Input
          className="w-full mb-4"
          value={documentId || ""}
          placeholder="Foundry Document UUID"
          onChange={(e) => setDocumentId(e.target.value)}
        />
        {documentId && (
          <Button className="cursor-pointer w-full" onClick={() => saveUUID()}>
            <Chain className="ml-[.6em] inline" /> <span className="ml-[5px]">Link</span>
          </Button>
        )}
        <Button className="cursor-pointer w-full my-2 mt-6" variant="secondary" onClick={() => handleSubmit("journal", "journal")}>
          <Notebook className="ml-[.6em] inline" /> <span className="ml-[5px]">Journal</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit("journal", "journal page")}>
          <StickyNote className="ml-[.6em] inline" /> <span className="ml-[5px]">Journal Page</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit("macros", "macro")}>
          <Code className="ml-[.6em] inline" /> <span className="ml-[5px]">Macro</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit("scenes", "scene")}>
          <Map className="ml-[.6em] inline" /> <span className="ml-[5px]">Scene</span>
        </Button>
        {hasQuests && (
          <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit(null, "quest")}>
            <MessageCircleWarning className="ml-[.6em] inline" /> <span className="ml-[5px]">Quest</span>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

/* ------------------ color picker (no RHF) ------------------ */

export function PopoverPickerSimple({ value, onChange }) {
  const popover = useRef(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      if (popover.current && !popover.current.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const v = value ?? "rgba(255,255,255,1)"

  return isOpen ? (
    <div className="popover" ref={popover}>
      <RgbaColorPicker
        color={rgbaToObj(v)}
        onChange={(nextObj) => {
          const nextValue = objToRgba(nextObj)
          onChange?.(nextValue)
        }}
      />
    </div>
  ) : (
    <div
      className="swatch w-5 h-5 cursor-pointer border border-white"
      style={{ backgroundColor: objToRgba(v) }}
      onClick={() => setIsOpen(true)}
    />
  )
}

/* ------------------ comma tags (simple) ------------------ */

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

export function CommaTagsFieldSimple({
  value,
  placeholder = "Type values, separated by commas",
  normalize = (s) => s.trim(),
  onChange,
}) {
  const [draft, setDraft] = useState("")
  const tags = uniq(parseCsv(value))

  function commit(nextTags) {
    onChange?.(toCsv(nextTags))
  }

  function addFromDraft() {
    const incoming = draft
      .split(",")
      .map((t) => normalize(t))
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
                <X size={14} />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

/* ------------------ single select -> csv (simple) ------------------ */

function SelectTagsFieldSimple({ value, options, placeholder = "Select", onChange }) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange?.(v)}>
      <SelectTrigger className="w-full cursor-pointer">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o} className="cursor-pointer">
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ------------------ rgba utils ------------------ */

const rgbaToObj = (rgba) => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)/
  const result = rgba.match(rgbaRegex)
  return result
    ? {
        r: parseInt(result[1], 10),
        g: parseInt(result[2], 10),
        b: parseInt(result[3], 10),
        a: parseFloat(result[4]),
      }
    : { r: 255, g: 255, b: 255, a: 1 }
}

const objToRgba = (rgba) => {
  if (!rgba) return "rgba(255,255,255,1)"
  if (typeof rgba !== "object") return rgba
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
}
