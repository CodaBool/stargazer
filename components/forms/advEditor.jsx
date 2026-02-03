"use client"

import { useCallback, useEffect, useRef, useState, cloneElement} from "react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CircleHelp,
  Image,
  Pencil,
  Save,
  Trash2,
  Plus,
  X,
  Link as Chain,
  Notebook,
  StickyNote,
  Code,
  Map,
  MessageCircleWarning,
  Undo2,
} from "lucide-react"
import {
  AVAILABLE_PROPERTIES,
  SVG_BASE,
  useStore,
  getIconHTML,
} from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import IconSelector from "../iconSelector"
import style from "@/app/contribute/[map]/md.module.css"
import "react-quill-new/dist/quill.bubble.css"
import sanitize from "sanitize-html"
import { useMemo } from "react"
import dynamic from "next/dynamic"
import { toast } from "sonner"
import { Controller, useForm } from "react-hook-form"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RgbaColorPicker } from "react-colorful"
import { CommaTagsField } from "./tagFields"

export default function AdvancedEditor({ children, IS_GALAXY, mapName, feature, editProp }) {
  return (
    <Dialog defaultOpen={true}>
      <DialogTrigger className="" asChild>{children}</DialogTrigger>
      <DialogContent className="">
        <DialogHeader>
          <DialogTitle>titl</DialogTitle>
          {/* <DialogDescription>*/}
            <FormComponent
              IS_GALAXY={IS_GALAXY}
              mapName={mapName}
              feature={feature}
              editProp={editProp}
            />
          {/* </DialogDescription>*/}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Save</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


export function FormComponent({
  feature,
  mapName,
  IS_GALAXY,
  editProp,
}) {
  const Quill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }),[])
  const type = feature?.properties?.type
  const form = useForm({
    defaultValues: feature?.properties ?? {},
  })

  const f = (name, node) => (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) =>
        cloneElement(node, {
          ...field,
          onChange: (v) => {
            const val = v?.target ? v.target.value : v
            field.onChange(val)
            editProp(val, name)
          },
        })
      }
    />
  )

  const checkbox = (name) =>
    f(
      name,
      <Checkbox
        checked={!!form.watch(name)}
        onCheckedChange={(v) => editProp(v, name)}
      />
    )

  return (
    <div className="space-y-6 text-sm">

      {/* ---------- common ---------- */}
      <Section title="Metadata">
        <Comma name="alias" label="Alias" form={form} editProp={editProp} />
        <Comma name="region" label="Region" form={form} editProp={editProp} />
        <Comma name="people" label="People" form={form} editProp={editProp} />
        {f("image", <Input placeholder="Image URL" />)}
        {f("caption", <Input placeholder="Caption" />)}
        {f("seed", <Input />)}
        {f("source", <Input />)}
        <Row label="Tint">
          <ColorGrid
            value={form.watch("tint")}
            count={1}
            onChange={(v) => editProp(v, "tint")}
          />
        </Row>
        <Row label="Unofficial">{checkbox("unofficial")}</Row>
        <Row label="Destroyed">{checkbox("destroyed")}</Row>
        <Row label="Capital">{checkbox("capital")}</Row>
        <Row label="Visible">{checkbox("visibility")}</Row>
        <Row label="Notes Visible">{checkbox("notesVisibility")}</Row>
      </Section>

      {/* ---------- notes ---------- */}
      <Section title="Notes">
        <Controller
          name="notes"
          control={form.control}
          render={({ field }) => (
            <Quill
              theme="bubble"
              value={field.value ?? ""}
              onChange={(v) => {
                field.onChange(v)
                editProp(v, "notes")
              }}
            />
          )}
        />
      </Section>

      {/* ---------- galaxy only ---------- */}
      {IS_GALAXY && (
        <>
          <Section title="Colors">
            <Row label="Base Colors">
              <ColorGrid
                value={form.watch("baseColors")}
                count={4}
                onChange={(v) => editProp(v, "baseColors")}
              />
            </Row>
            <Row label="Feature Colors">
              <ColorGrid
                value={form.watch("featureColors")}
                count={4}
                onChange={(v) => editProp(v, "featureColors")}
              />
            </Row>
            <Row label="Layer Colors">
              <ColorGrid
                value={form.watch("layerColors")}
                count={4}
                alpha
                onChange={(v) => editProp(v, "layerColors")}
              />
            </Row>
            {(type === "terrestrial" || type === "ocean_planet") && (
              <Row label="Atmosphere">
                <ColorGrid
                  value={form.watch("atmosphereColors")}
                  count={3}
                  alpha
                  onChange={(v) => editProp(v, "atmosphereColors")}
                />
              </Row>
            )}
          </Section>

          <Section title="Physics">
            {f("planetSize", <Input type="number" />)}
            {f("temperature", <Input type="number" />)}
            {f("diameter", <Input type="number" />)}
            {f("gravity", <Input type="number" />)}
            {f("pressure", <Input type="number" />)}
            {f("icePercent", <Input type="number" step="0.01" />)}
          </Section>

          <Section title="Custom Properties">
            <CustomFields
              properties={feature.properties}
              editProp={editProp}
            />
          </Section>
        </>
      )}
    </div>
  )
}

// function FormComponent({ IS_GALAXY, mapName, feature, editProp }) {
//   const [submitting, setSubmitting] = useState()
//   const form = useForm()
//   const Quill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }),[])


//   async function submit(body) {
//     // setSubmitting(true)
//     console.log("submit", body)
//   }

//   return (
//   <Form {...form}>
//     <form onSubmit={form.handleSubmit(submit)} className="container mx-auto">
//     </form>
//   </Form>
//   )
// }

export function EditorForm({
  feature,
  draw,
  setPopup,
  mapName,
  popup,
  params,
  TYPES,
}) {
  const { editorTable, setEditorTable } = useStore()
  const Quill = useMemo(
    () => dynamic(() => import("react-quill-new"), { ssr: false }),
    [],
  )
  const [deleteDialog, setDeleteDialog] = useState()
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [errorStroke, setErrorStroke] = useState()
  const [errorFill, setErrorFill] = useState()
  const [iconHTML, setIconHTML] = useState(null)
  const availableTypes = TYPES[feature.geometry.type.toLowerCase().trim()]
  const [newRow, setNewRow] = useState({
    key: "",
    value: "",
  })

  function handleInputChange(e) {
    setNewRow(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }
  function handleNotesBtn(e) {
    setIsAddingRow(true)
    setNewRow({ key: "notes", value: "" })
  }

  function deleteRow() {
    if (!draw || !deleteDialog?.i) return
    const newProperties = { ...feature.properties }
    const keyToDelete = Object.keys(newProperties)[deleteDialog.i]
    delete newProperties[keyToDelete]
    const latestFeature = draw.get(feature.id)
    const newFeature = { ...latestFeature, properties: newProperties }
    draw.add(newFeature)
    setPopup(newFeature)
    if (document.querySelector(".unsaved-text")) {
      document.querySelector(".unsaved-text").style.visibility = "visible"
    }
    setDeleteDialog(null)
  }

  function handleSave() {
    if (isAddingRow) {
      if (!newRow.key || !newRow.value || !draw) {
        setIsAddingRow(false)
        return
      }
      const latestFeature = draw.get(feature.id)
      const keyExists = Object.keys(feature.properties).includes(newRow.key)
      if (keyExists && newRow.key !== "notes") {
        toast.warning(`"${newRow.key}" Key already exists`)
        return
      }
      const newFeature = {
        ...latestFeature,
        properties: { ...feature.properties, [newRow.key]: newRow.value },
      }
      draw.add(newFeature)
      setPopup(newFeature)
      // Reset the form
      setNewRow({
        key: "",
        value: "",
      })

      // Switch back to "Add Row" mode
      setIsAddingRow(false)
    } else {
      setEditorTable(null)
    }
  }

  function handleCancel() {
    if (isAddingRow) {
      setIsAddingRow(false)
      setNewRow({ key: "", value: "" })
    } else {
      setEditorTable(null)
    }
  }

  function editProp(newVal, key) {
    const newProperties = { ...feature.properties }
    newProperties[key] = newVal
    // if (key === "type") {
    //   newProperties[key] = newVal.replaceAll(" ", "_")
    // }
    const latestFeature = draw.get(feature.id)
    const newFeature = { ...latestFeature, properties: newProperties }
    // console.log("new feature:", newFeature, "latest", latestFeature)
    draw.add(newFeature)
    setPopup(newFeature)
    setEditorTable(newFeature.properties)
    if (document.querySelector(".unsaved-text")) {
      document.querySelector(".unsaved-text").style.visibility = "visible"
    }
  }

  function selectIcon(icon) {
    let url = icon
    if (typeof icon === "object") {
      url = `${SVG_BASE}${icon.folder}/${icon.name}.svg`
    }
    // console.log("icon", icon, " | remote =", url)
    editProp(url, "icon")
    // close dialog
    // console.log("clicking button", document.querySelector('.icon-dialog').childNodes[2])
    document.querySelector(".icon-dialog").childNodes[2].click()
  }

  useEffect(() => {
    // error messages
    if (
      feature.geometry.type === "Polygon" ||
      feature.geometry.type === "Point"
    ) {
      if (!feature.properties.fill) {
        setErrorFill(true)
      } else {
        setErrorFill(null)
      }
    }
    if (
      feature.geometry.type.includes("LineString") ||
      feature.geometry.type.includes("Poly")
    ) {
      if (!feature.properties.stroke) {
        setErrorStroke(true)
      } else {
        setErrorStroke(null)
      }
    }

    // fetch icon as a promise
    if (popup.geometry.type === "Point") {
      getIconHTML(popup, mapName).then(r => {
        setIconHTML(r)
      })
    }
  }, [popup])

  function handleFillOrStroke(type, newVal) {
    if (type === "fill") {
      editProp(objToRgba(newVal), type)
    } else if (type === "stroke") {
      editProp(objToRgba(newVal), type)
    }
  }

  return (
    <div
      className="space-y-4 font-mono select-text editor-table"
      style={{ minWidth: "400px" }}
    >
      {popup.geometry.type === "Point" && iconHTML && (
        <div
          dangerouslySetInnerHTML={{ __html: iconHTML }}
          className="w-5 h-5 popup-preview overflow-hidden"
        ></div>
      )}
      {popup.geometry.type === "Polygon" && (
        <div className="popup-preview">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill={popup.properties.fill}
            stroke={popup.properties.stroke}
          >
            <rect x="4" y="4" width="19" height="19" strokeWidth="3" />
          </svg>
        </div>
      )}
      {popup.geometry.type.includes("LineString") && (
        <div className="popup-preview">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke={popup.properties.stroke}
          >
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
          </svg>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow className="text-center">
            <TableHead className="text-center">Key</TableHead>
            <TableHead className="text-center">Value</TableHead>
            <TableHead className="text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {editorTable &&
            Object.entries(feature.properties).map((arr, i) => {
              if (typeof arr[1] === "undefined" || arr[1] === null) return null
              const isNotes =
                arr[0] === "notes"
                  ? { padding: "2.6em", paddingTop: "0", bool: true }
                  : { bool: false }
              return (
                <TableRow
                  key={i}
                  style={{ height: isNotes.bool ? "120px" : "auto" }}
                >
                  <TableCell className="font-medium">{arr[0]}</TableCell>
                  <TableCell style={isNotes}>
                    {arr[0] === "type" && (
                      <Select
                        onValueChange={e => editProp(e, arr[0])}
                        defaultValue={editorTable[arr[0]]}
                      >
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTypes.map((type, index) => (
                            <SelectItem
                              key={index}
                              value={type}
                              selected={arr[1] === type}
                              className="cursor-pointer"
                            >
                              {type.replaceAll("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {arr[0] === "stroke" && (
                      <PopoverPicker
                        color={popup.properties.stroke}
                        onChange={newVal =>
                          handleFillOrStroke("stroke", newVal)
                        }
                      />
                    )}
                    {arr[0] === "fill" && (
                      <PopoverPicker
                        color={popup.properties.fill}
                        onChange={newVal => handleFillOrStroke("fill", newVal)}
                      />
                    )}
                    {arr[0] === "icon" && (
                      <img
                        src={arr[1]}
                        alt="Custom icon"
                        className="w-5 h-5 object-contain cursor-pointer"
                        onClick={() =>
                          document.querySelector(".icon-dialog-open").click()
                        }
                      />
                    )}
                    {isNotes.bool && (
                      <Quill
                        theme="bubble"
                        value={editorTable[arr[0]]}
                        onChange={e => editProp(e, arr[0])}
                        className="border border-gray-800"
                      />
                    )}
                    {arr[0] !== "type" &&
                      arr[0] !== "stroke" &&
                      arr[0] !== "fill" &&
                      arr[0] !== "icon" &&
                      arr[0] !== "notes" && (
                        <Input
                          value={editorTable[arr[0]]}
                          onChange={e => editProp(e.target.value, arr[0])}
                          className="h-8"
                          onKeyDown={e => {
                            if (e.key === "Enter") {
                              handleSave()
                            }
                          }}
                        />
                      )}
                  </TableCell>
                </TableRow>
              )
            })}

          {!editorTable &&
            Object.entries(feature.properties).map((arr, i) => {
              if (
                typeof arr[1] === "undefined" ||
                arr[1] === null ||
                typeof arr[1] === "object"
              )
                return null
              const isColor =
                arr[1]?.toString().startsWith("rgba") ||
                (arr[1]?.toString().startsWith("#") && arr[1]?.length === 7)
              const isNote = arr[0] === "notes"
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{arr[0]}</TableCell>
                  {arr[1]?.toString().startsWith("http") && (
                    <TableCell>
                      <svg width="20" height="20">
                        <image href={arr[1]} width="20" height="20" />
                      </svg>
                    </TableCell>
                  )}
                  {isColor && (
                    <TableCell>
                      {arr[0] === "stroke" ? (
                        <div
                          className="swatch w-5 h-5 border border-white"
                          style={{ backgroundColor: popup.properties.stroke }}
                        />
                      ) : (
                        <div
                          className="swatch w-5 h-5 border border-white"
                          style={{
                            backgroundColor: popup.properties.fill || "",
                          }}
                        />
                      )}
                    </TableCell>
                  )}
                  {arr[0] === "type" && (
                    <TableCell>{arr[1].replaceAll("_", " ")}</TableCell>
                  )}
                  {!isColor &&
                    !arr[1]?.toString().startsWith("http") &&
                    arr[0] !== "type" &&
                    !isNote && (
                      <TableCell>
                        {arr[1]?.length > 40
                          ? `${arr[1]?.substring(0, 40)}...`
                          : arr[1]}
                      </TableCell>
                    )}
                  {isNote && (
                    <TableCell>
                      <div
                        className={style.markdown}
                        dangerouslySetInnerHTML={{
                          __html: sanitizeContent(arr[1], sanitize),
                        }}
                      ></div>
                    </TableCell>
                  )}
                  <TableCell>
                    {arr[0] !== "type" && arr[0] !== "name" && (
                      <Trash2
                        className="cursor-pointer stroke-gray-400"
                        size={14}
                        onClick={() =>
                          setDeleteDialog({ key: arr[0], value: arr[1], i })
                        }
                      />
                    )}
                    <Dialog
                      open={!!deleteDialog}
                      onOpenChange={o => !o && setDeleteDialog(null)}
                    >
                      <DialogContent className="max-h-[600px]">
                        <DialogHeader>
                          <DialogTitle>
                            Confirm <b>delete</b> row <b>{deleteDialog?.key}</b>
                            ?
                          </DialogTitle>
                          <table className="w-full text-left my-4 select-text">
                            <tbody>
                              <tr>
                                <td className="border p-2">
                                  {deleteDialog?.key}
                                </td>
                                {deleteDialog?.key === "notes" ? (
                                  <td className="border p-2 max-w-[400px] overflow-auto">
                                    <div
                                      className={style.markdown}
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeContent(
                                          deleteDialog?.value,
                                          sanitize,
                                        ),
                                      }}
                                    ></div>
                                  </td>
                                ) : (
                                  <td className="border p-2 max-w-[400px] overflow-auto">
                                    {deleteDialog?.value}
                                  </td>
                                )}
                              </tr>
                            </tbody>
                          </table>
                          <div className="flex justify-between">
                            <Button
                              variant="destructive"
                              onClick={() => deleteRow()}
                              className="cursor-pointer rounded"
                            >
                              Delete
                            </Button>
                            <DialogClose asChild>
                              <Button
                                variant="secondary"
                                className="cursor-pointer rounded"
                              >
                                Cancel
                              </Button>
                            </DialogClose>
                          </div>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              )
            })}

          {isAddingRow && newRow.key !== "notes" && (
            <TableRow>
              <TableCell>
                <Input
                  name="key"
                  value={newRow.key}
                  onChange={handleInputChange}
                  placeholder="key"
                  className="h-8"
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSave()
                  }}
                />
              </TableCell>
              <TableCell>
                <Input
                  name="value"
                  value={newRow.value}
                  onChange={handleInputChange}
                  placeholder="value"
                  className="h-8"
                  onKeyDown={e => {
                    if (e.key === "Enter") handleSave()
                  }}
                />
              </TableCell>
            </TableRow>
          )}
          {isAddingRow && newRow.key === "notes" && (
            <TableRow style={{ height: "120px" }}>
              <TableCell
                colSpan={2}
                style={{
                  padding: "2.6em",
                  paddingTop: "0",
                  paddingLeft: "5em",
                }}
              >
                <Quill
                  theme="bubble"
                  value={newRow?.value}
                  onChange={val => setNewRow({ key: "notes", value: val })}
                  className="border border-gray-800"
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="text-center m-1">
        {errorStroke && <p className="text-red-500">Missing 'stroke' color</p>}
        {errorFill && <p className="text-red-500">Missing 'fill' color</p>}
      </div>
      {!isAddingRow && !editorTable ? (
        <>
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="cursor-pointer w-full h-[30px] mb-2"
                variant="secondary"
              >
                <CircleHelp
                  className="cursor-pointer stroke-gray-400 inline"
                  size={14}
                />{" "}
                Special Keys
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[1000px]">
              <DialogHeader>
                <DialogTitle>Special Properties</DialogTitle>
                <DialogDescription>
                  The keys below have special impact on the map
                </DialogDescription>
              </DialogHeader>

              <Table>
                <TableHeader>
                  <TableRow className="text-center">
                    <TableHead className="">Key</TableHead>
                    <TableHead className="text-center">Effect</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Required</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {Object.entries(AVAILABLE_PROPERTIES).map((obj, i) => (
                    <TableRow key={i}>
                      <TableCell className="">{obj[0]}</TableCell>
                      <TableCell>
                        <div
                          dangerouslySetInnerHTML={{
                            __html: obj[1].split("|")[0],
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {obj[1].split("|type=")[1]}
                      </TableCell>
                      {obj[1].includes("|required") && (
                        <TableCell
                          title="this field is required"
                          className="cursor-help text-center"
                        >
                          🚩
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DialogContent>
          </Dialog>
          <Button
            size="sm"
            onClick={() => {
              setNewRow({ key: "", value: "" })
              setIsAddingRow(true)
            }}
            className="cursor-pointer w-full h-[30px] mb-2"
            variant="secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Data
          </Button>

          {!feature.properties.notes && (
            <Button
              size="sm"
              onClick={handleNotesBtn}
              className="cursor-pointer w-full h-[30px] mb-2"
              variant="secondary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Notes
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setEditorTable(feature.properties)}
            className="cursor-pointer w-full h-[30px] mb-2"
            variant="secondary"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit Data
          </Button>
        </>
      ) : (
        <>
          <Button
            size="sm"
            onClick={handleSave}
            className="cursor-pointer w-full h-[30px]"
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="cursor-pointer w-full h-[30px]"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </>
      )}

      <IconSelector
        mapName={mapName.includes("lancer") ? "lancer" : mapName}
        onSelect={selectIcon}
        show={!isAddingRow && !editorTable && !feature.properties.icon}
      />
      {params.get("secret") && (
        <Link editProp={editProp} handleSave={handleSave} feature={feature} />
      )}
    </div>
  )
}

export const Link = ({ editProp, handleSave, feature }) => {
  const [documentId, setDocumentId] = useState()
  const [open, setOpen] = useState()
  const [hasQuests, setHasQuests] = useState()

  const handleSubmit = (tab, doc) => {
    if (feature.geometry.type !== "Point") {
      toast.warning(
        "Only Point locations can have links. Stay tuned for a future update to add more geometry link support.",
      )
      return
    }
    window.parent.postMessage({ type: "listen", tab, doc }, "*")
  }

  const saveUUID = value => {
    editProp(value || documentId || "", "link")
    handleSave()
    setOpen(false)
  }

  useEffect(() => {
    const listener = e => {
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
    window.parent.postMessage(
      { type: "modules", desc: "give me all active modules" },
      "*",
    )
    return () => {
      window.removeEventListener("message", listener)
    }
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
          Link a Foundry Document to this feature. A UUID can be entered
          manually or you can connect it by using the buttons.
        </p>
        <hr className="border my-4 border-gray-500" />
        <Input
          className="w-full mb-4"
          value={documentId || ""}
          placeholder="Foundry Document UUID"
          onChange={e => setDocumentId(e.target.value)}
        />
        {documentId && (
          <Button className="cursor-pointer w-full" onClick={saveUUID}>
            <Chain className="ml-[.6em] inline" />{" "}
            <span className="ml-[5px]">Link</span>
          </Button>
        )}
        <Button
          className="cursor-pointer w-full my-2 mt-6"
          variant="secondary"
          onClick={() => handleSubmit("journal", "journal")}
        >
          <Notebook className="ml-[.6em] inline" />{" "}
          <span className="ml-[5px]">Journal</span>
        </Button>
        <Button
          className="cursor-pointer w-full my-2"
          variant="secondary"
          onClick={() => handleSubmit("journal", "journal page")}
        >
          <StickyNote className="ml-[.6em] inline" />{" "}
          <span className="ml-[5px]">Journal Page</span>
        </Button>
        <Button
          className="cursor-pointer w-full my-2"
          variant="secondary"
          onClick={() => handleSubmit("macros", "macro")}
        >
          <Code className="ml-[.6em] inline" />{" "}
          <span className="ml-[5px]">Macro</span>
        </Button>
        <Button
          className="cursor-pointer w-full my-2"
          variant="secondary"
          onClick={() => handleSubmit("scenes", "scene")}
        >
          <Map className="ml-[.6em] inline" />{" "}
          <span className="ml-[5px]">Scene</span>
        </Button>
        {hasQuests && (
          <Button
            className="cursor-pointer w-full my-2"
            variant="secondary"
            onClick={() => handleSubmit(null, "quest")}
          >
            <MessageCircleWarning className="ml-[.6em] inline" />{" "}
            <span className="ml-[5px]">Quest</span>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export const PopoverPicker = ({ color, onChange, editProp }) => {
  const popover = useRef()
  const [isOpen, toggle] = useState(false)
  const close = useCallback(() => toggle(false), [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (popover.current && !popover.current.contains(event.target)) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [popover, close])

  return (
    <>
      {isOpen ? (
        <div className="popover" ref={popover}>
          <RgbaColorPicker color={rgbaToObj(color)} onChange={onChange} />
        </div>
      ) : (
        <div
          className="swatch w-5 h-5 cursor-pointer border border-white"
          style={{ backgroundColor: objToRgba(color) }}
          onClick={() => toggle(true)}
        />
      )}
    </>
  )
}

// duplicate of what's in @/app/contribute/[map]/[id]/page.jsx
export function sanitizeContent(html, sanitizeFunc) {
  if (!html) return ""

  return sanitizeFunc(html, {
    // Start from defaults, then remove dangerous tags you forbade with DOMPurify
    allowedTags: sanitizeFunc.defaults.allowedTags.filter(
      tag => !["img", "svg", "math", "script", "table", "iframe"].includes(tag),
    ),
    // Allow normal attributes + link attributes
    allowedAttributes: {
      ...sanitizeFunc.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || ""

        // If not relative and not your trusted domain, wrap through /link
        if (
          href &&
          !href.startsWith("/") &&
          !href.startsWith("https://stargazer.vercel.app/")
        ) {
          const qs = new URLSearchParams({ url: href }).toString()
          return {
            tagName,
            attribs: {
              ...attribs,
              href: `/link?${qs}`,
            },
          }
        }

        return { tagName, attribs }
      },
    },
  })
}

function Section({ title, children }) {
  return (
    <div className="space-y-3 border-b pb-4">
      <h3 className="font-semibold text-xs uppercase opacity-70">
        {title}
      </h3>
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

function Comma({ name, label, form, editProp }) {
  return (
    <div>
      <Label>{label}</Label>
      <CommaTagsField
        control={form.control}
        name={name}
        onImmediateChange={(v) => editProp(v, name)}
      />
    </div>
  )
}

/* ------------------ custom arbitrary fields ------------------ */

function CustomFields({ properties, editProp }) {
  const [key, setKey] = useState("")
  const [val, setVal] = useState("")

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input placeholder="key" value={key} onChange={(e) => setKey(e.target.value)} />
        <Input placeholder="value" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button
          size="icon"
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

const rgbaToObj = (rgba) => {
  if (!rgba) return { r: 255, g: 255, b: 255, a: 1 }
  if (typeof rgba === "object") return rgba
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]+)?\)/)
  return m
    ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] ? +m[4] : 1 }
    : { r: 255, g: 255, b: 255, a: 1 }
}

const objToRgba = (o) =>
  typeof o === "object"
    ? `rgba(${o.r}, ${o.g}, ${o.b}, ${o.a})`
    : o

const rgbToHex = ({ r, g, b }) =>
  "#" +
  [r, g, b]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")

const rgbaToHexA = ({ r, g, b, a }) =>
  "#" +
  [r, g, b, Math.round(a * 255)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")

const splitCsv = (v, count) =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .slice(0, count)
    .concat(Array(count).fill("#ffffff"))
    .slice(0, count)

/* ------------------ inline color grid ------------------ */

function ColorGrid({
  value,
  count,
  alpha = false,
  onChange,
}) {
  const colors = splitCsv(value, count)

  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map((c, i) => (
        <SingleColor
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

function SingleColor({ value, alpha, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  const rgba = rgbaToObj(value)

  return (
    <div ref={ref} className="relative">
      <div
        className="w-6 h-6 border cursor-pointer"
        style={{ background: objToRgba(rgba) }}
        onClick={() => setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-2 bg-black p-2 border">
          <RgbaColorPicker
            color={rgba}
            onChange={(obj) => {
              const v = alpha ? rgbaToHexA(obj) : rgbToHex(obj)
              onChange(v)
            }}
          />
        </div>
      )}
    </div>
  )
}
