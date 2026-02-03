"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form"
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
  MessageCircleWarning,
  Menu,
  Trash2,
} from "lucide-react"
import { SVG_BASE, getIconHTML } from "@/lib/utils"
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { CommaTagsField, SelectTagsField } from "./tagFields"
import { useForm, Controller } from "react-hook-form"

export default function EditorForm({ feature, draw, setPopup, mapName, popup, params, TYPES, iconIndex, IS_GALAXY }) {
  const Quill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), [])
  const [iconHTML, setIconHTML] = useState(null)

  const availableTypes = TYPES?.[feature.geometry.type.toLowerCase().trim()] ?? []
  const starTypes = STAR_VARIANT_WEIGHTS.map(s => s[0])

  // Build default values from current feature.properties (strings only; RHF can still hold other primitives)
  const defaultValues = useMemo(() => {
    const props = feature?.properties ?? {}
    const out = {}
    for (const [k, v] of Object.entries(props)) {
      if (typeof v === "undefined" || v === null) continue
      if (typeof v === "object") continue
      out[k] = v
    }
    return out
  }, [feature?.id]) // reset when feature changes

  const form = useForm({
    mode: "onChange",
    defaultValues,
  })

  // Reset form when the feature changes (important for correct values)
  useEffect(() => {
    form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feature?.id])

  function editProp(newVal, key) {
    const newProperties = { ...feature.properties }
    newProperties[key] = newVal
    const latestFeature = draw.get(feature.id)
    const newFeature = { ...latestFeature, properties: newProperties }
    draw.add(newFeature)
    setPopup(newFeature)

    const unsaved = document.querySelector(".unsaved-text")
    if (unsaved) unsaved.style.visibility = "visible"
  }

  function selectIcon(icon) {
    let url = icon
    if (typeof icon === "object") {
      url = `${SVG_BASE}${icon.folder}/${icon.name}.svg`
    }
    editProp(url, "icon")
    document.querySelector(".icon-dialog")?.childNodes?.[2]?.click()
  }

  useEffect(() => {
    // fetch icon as a promise
    if (popup.geometry.type === "Point") {
      getIconHTML(popup, mapName).then((r) => setIconHTML(r))
    }
  }, [popup, feature, mapName])

  const {name, type, fill, stroke, starType, icon, description, link, faction} = feature.properties

  return (
    <Form {...form}>
      <form className="space-y-4 font-mono select-text editor-table mt-4" style={{ minWidth: "400px", maxWidth: "50vw" }}>
        <Table>

          <TableBody>

            {/* name */}
            <TableRow>
              <TableCell className="font-medium">Name</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="name"
                  defaultValue={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          className="h-8"

                          value={field.value ?? ""}
                          onChange={(e) => {
                            if (e.target.value?.trim()?.length === 0) {
                              form.setError("name", true)
                            } else {
                              field.onChange(e.target.value)
                              editProp(e.target.value, "name")
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TableCell>
            </TableRow>
            {/* type*/}
            <TableRow>
              <TableCell className="font-medium">Type</TableCell>
              <TableCell>
                <FormField
                  control={form.control}
                  name="type"
                  defaultValue={type}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) => {
                            field.onChange(val)
                            editProp(val, "type")
                          }}
                        >
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTypes.map((type, index) => (
                              <SelectItem key={index} value={type} className="cursor-pointer">
                                <img
                                  src={`${SVG_BASE}${mapName}/${type}.svg`}
                                  alt={`${type} icon`}
                                  className="inline-block w-4 h-4 mr-2 object-contain align-middle"
                                />
                                {type.replaceAll("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TableCell>
            </TableRow>
            {/* starType*/}
            {type === "star" && (
              <TableRow>
                <TableCell className="font-medium">Star Type</TableCell>
                <TableCell>
                    <SelectTagsField
                      control={form.control}
                      name="starType"
                      options={starTypes}
                      placeholder="Star Type"
                      onImmediateChange={(csv) => editProp(csv, "starType")}
                    />
                </TableCell>
              </TableRow>
            )}
            {/* fill*/}
            {(feature.geometry.type === "Point" || feature.geometry.type.includes("Poly")) && (
              <TableRow>
                <TableCell className="font-medium">Fill</TableCell>
                <TableCell>
                  <PopoverPicker
                    name="fill"
                    control={form.control}
                    onImmediateChange={(rgba) => editProp(rgba, "fill")}
                  />
                </TableCell>
              </TableRow>

            )}
            {/* stroke*/}
            {(feature.geometry.type.includes("LineString") || feature.geometry.type.includes("Poly")) && (
              <TableRow>
                <TableCell className="font-medium">Stroke</TableCell>
                <TableCell>
                  <PopoverPicker
                    name="stroke"
                    control={form.control}
                    onImmediateChange={(rgba) => editProp(rgba, "stroke")}
                  />
                </TableCell>
              </TableRow>
            )}
            {/* icon*/}
            <TableRow>
              <TableCell className="font-medium">Icon</TableCell>
              <TableCell className="flex items-center justify-between">

                {!icon && popup.geometry.type === "Point" && iconHTML && (
                  <div
                    dangerouslySetInnerHTML={{ __html: iconHTML }}
                    className="w-5 h-5 popup-preview overflow-hidden cursor-pointer"
                    onClick={() => {
                      console.log("click")
                      document.querySelector(".icon-dialog-open")?.click()
                    }}
                  />
                )}

                {!icon && popup.geometry.type === "Polygon" && (
                  <div className="popup-preview cursor-pointer" onClick={() => document.querySelector(".icon-dialog-open")?.click()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={popup.properties.fill} stroke={popup.properties.stroke}>
                      <rect x="4" y="4" width="19" height="19" strokeWidth="3" />
                    </svg>
                  </div>
                )}

                {!icon && popup.geometry.type.includes("LineString") && (
                  <div className="popup-preview cursor-pointer" onClick={() => document.querySelector(".icon-dialog-open")?.click()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" stroke={popup.properties.stroke}>
                      <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
                    </svg>
                  </div>
                )}

                <IconSelector
                  mapName={mapName.includes("lancer") ? "lancer" : mapName}
                  onSelect={selectIcon}
                  iconIndex={iconIndex}
                >
                  <img
                    src={icon || "#"}
                    style={{ opacity: icon ? 1 : 0 }}
                    alt="Custom icon"
                    className="w-5 h-5 object-contain cursor-pointer icon-dialog-open"
                  />
                </IconSelector>
                {icon && <Trash2 className="cursor-pointer text-gray-400" size={22} onClick={() => editProp("", "icon")}
                  />}

              </TableCell>
            </TableRow>
            {/* link*/}
            {params.get("secret") && (
              <></>
            )}
            {/* faction*/}
            <TableRow>
              <TableCell className="font-medium">Factions</TableCell>
              <TableCell>
                <CommaTagsField
                  control={form.control}
                  name="faction"
                  placeholder="Tunnel Snakes"
                  onImmediateChange={(csv) => editProp(csv, "faction")}
                />
              </TableCell>
            </TableRow>
            {/* locations*/}
            <TableRow>
              <TableCell className="font-medium">Locations</TableCell>
              <TableCell>
                <CommaTagsField
                  control={form.control}
                  name="locations"
                  placeholder="Power Plant"
                  onImmediateChange={(csv) => editProp(csv, "location")}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <label className="block text-sm font-medium mb-1">description</label>
        <Controller
          name="description"
          control={form.control}
          render={({ field }) => (
            <Quill
              theme="bubble"
              value={field.value ?? ""}
              onChange={(val) => {
                field.onChange(val)
                editProp(val, "description")
              }}
              className="border border-gray-800"
            />
          )}
        />

        <div className="text-center m-1">
          {form.formState.errors.name && <p className="text-red-500">name is required</p>}
        </div>


        <AdvancedEditor IS_GALAXY={IS_GALAXY} mapName={mapName} feature={feature} editProp={editProp}>
          <Button type="button" variant="secondary" className="cursor-pointer w-full h-[30px]">
            <Menu className="mr-2 h-4 w-4" />
            See More
          </Button>
        </AdvancedEditor>

        {params.get("secret") && <Link editProp={editProp} feature={feature} />}
      </form>
    </Form>
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
        if (e.data.modules.includes("forien-quest-log")) {
          setHasQuests(true)
        }
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
          size="sm"
          onClick={() => setOpen(!open)}
          className="cursor-pointer w-full h-[30px]"
          variant="secondary"
        >
          <Chain className="mr-2" />
          Link to Foundry
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

export function PopoverPicker({ name, control, onImmediateChange }) {
  const popover = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (popover.current && !popover.current.contains(event.target)) close()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [close])

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const value = field.value ?? "rgba(255,255,255,1)"

        return isOpen ? (
          <div className="popover" ref={popover}>
            <RgbaColorPicker
              color={rgbaToObj(value)}
              onChange={(nextObj) => {
                const nextValue = objToRgba(nextObj)
                field.onChange(nextValue)
                onImmediateChange?.(nextValue)
              }}
            />
          </div>
        ) : (
          <div
            className="swatch w-5 h-5 cursor-pointer border border-white"
            style={{ backgroundColor: objToRgba(value) }}
            onClick={() => setIsOpen(true)}
          />
        )
      }}
    />
  )
}

const rgbaToObj = (rgba) => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)/
  const result = rgba.match(rgbaRegex)
  return result
    ? { r: parseInt(result[1], 10), g: parseInt(result[2], 10), b: parseInt(result[3], 10), a: parseFloat(result[4]) }
    : { r: 255, g: 255, b: 255, a: 1 }
}

const objToRgba = (rgba) => {
  if (!rgba) return "rgba(255,255,255,1)"
  if (typeof rgba !== "object") return rgba
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
}
