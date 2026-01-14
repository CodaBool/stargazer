"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RgbaColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CircleHelp, Image, Pencil, Plus, Save, Trash2, Link as Chain, Notebook, StickyNote, Code, Map, MessageCircleWarning } from "lucide-react"
import { AVAILABLE_PROPERTIES, SVG_BASE, useStore, getIconHTML } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import IconSelector from "../iconSelector"

export default function EditorForm({ feature, draw, setPopup, mapName, popup, params, TYPES }) {
  const { editorTable, setEditorTable } = useStore()
  const [isAddingRow, setIsAddingRow] = useState(false)
  const [errorStroke, setErrorStroke] = useState()
  const [errorFill, setErrorFill] = useState()
  const [iconHTML, setIconHTML] = useState(null);

  const [newRow, setNewRow] = useState({
    key: "",
    value: "",
  })

  const availableTypes = TYPES[feature.geometry.type.toLowerCase().trim()]

  function handleInputChange(e) {
    setNewRow((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function deleteRow(index) {
    if (!draw) return
    const newProperties = { ...feature.properties }
    const keyToDelete = Object.keys(newProperties)[index]
    delete newProperties[keyToDelete]
    const latestFeature = draw.get(feature.id)
    const newFeature = { ...latestFeature, properties: newProperties }
    draw.add(newFeature)
    setPopup(newFeature)
    if (document.querySelector(".unsaved-text")) {
      document.querySelector(".unsaved-text").style.visibility = 'visible'
    }
  }

  function handleSave() {
    if (isAddingRow) {
      if (!newRow.key || !newRow.value || !draw) {
        setIsAddingRow(false)
        return
      }
      const latestFeature = draw.get(feature.id)
      const keyExists = Object.keys(feature.properties).includes(newRow.key);
      if (keyExists) {
        toast.warning(`"${newRow.key}" Key already exists`)
        return
      }
      const newFeature = { ...latestFeature, properties: { ...feature.properties, [newRow.key]: newRow.value } }
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

  function handleEdit() {
    setEditorTable(feature.properties)
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
      document.querySelector(".unsaved-text").style.visibility = 'visible'
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
    document.querySelector('.icon-dialog').childNodes[2].click()
  }

  useEffect(() => {
    // error messages
    if (feature.geometry.type === "Polygon" || feature.geometry.type === "Point") {
      if (!feature.properties.fill) {
        setErrorFill(true)
      } else {
        setErrorFill(null)
      }
    }
    if (feature.geometry.type.includes("LineString") || feature.geometry.type.includes("Poly")) {
      if (!feature.properties.stroke) {
        setErrorStroke(true)
      } else {
        setErrorStroke(null)
      }
    }

    // fetch icon as a promise
    if (popup.geometry.type === 'Point') {
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
  useEffect(() => {
    setEditorTable(null)
  }, [])

  return (
    <div className="space-y-4 font-mono select-text editor-table">
      {popup.geometry.type === 'Point' && iconHTML && (
        <div dangerouslySetInnerHTML={{ __html: iconHTML }} className="w-5 h-5 popup-preview overflow-hidden"></div>
      )}
      {popup.geometry.type === 'Polygon' && (
        <div className="popup-preview">
          <svg width="24" height="24" viewBox="0 0 24 24" fill={popup.properties.fill} stroke={popup.properties.stroke}>
            <rect x="4" y="4" width="19" height="19" strokeWidth="3" />
          </svg>
        </div>
      )}
      {popup.geometry.type.includes("LineString") && (
        <div className="popup-preview">
          <svg width="24" height="24" viewBox="0 0 24 24" stroke={popup.properties.stroke}>
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
          {editorTable && (
            Object.entries(feature.properties).map((arr, i) => {
              if (typeof arr[1] === "undefined" || arr[1] === null) return null
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{arr[0]}</TableCell>
                  <TableCell>
                    {arr[0] === "type" && <Select onValueChange={e => editProp(e, arr[0])} defaultValue={editorTable[arr[0]]}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTypes.map((type, index) => (
                          <SelectItem key={index} value={type} selected={arr[1] === type} className="cursor-pointer">
                            {type.replaceAll("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select >}
                    {arr[0] === "stroke" && <PopoverPicker color={popup.properties.stroke} onChange={newVal => handleFillOrStroke("stroke", newVal)} />}
                    {arr[0] === "fill" && <PopoverPicker color={popup.properties.fill} onChange={newVal => handleFillOrStroke("fill", newVal)} />}
                    {arr[0] === "icon" && <img
                      src={arr[1]}
                      alt="Custom icon"
                      className="w-5 h-5 object-contain cursor-pointer"
                      onClick={() => document.querySelector(".icon-dialog-open").click()}
                    />}
                    {arr[0] !== "type" && arr[0] !== "stroke" && arr[0] !== "fill" && arr[0] !== "icon" &&
                      <Input value={editorTable[arr[0]]} onChange={e => editProp(e.target.value, arr[0])} className="h-8"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSave()
                          }
                        }}
                      />
                    }
                  </TableCell>
                </TableRow>
              )
            })
          )}

          {!editorTable && (
            Object.entries(feature.properties).map((arr, i) => {
              if (typeof arr[1] === "undefined" || arr[1] === null) return null
              const isColor = arr[1]?.toString().startsWith("rgba") || (arr[1]?.toString().startsWith("#") && arr[1]?.length === 7)
              return (
                <TableRow key={i}>
                  <TableCell className="font-medium">{arr[0]}</TableCell>
                  {arr[1]?.toString().startsWith("http") &&
                    <TableCell>
                      <svg width="20" height="20">
                        <image href={arr[1]} width="20" height="20" />
                      </svg>
                    </TableCell>
                  }
                  {isColor &&
                    <TableCell>
                      {arr[0] === "stroke"
                        ?
                        <div
                          className="swatch w-5 h-5 border border-white"
                          style={{ backgroundColor: popup.properties.stroke }}
                        />
                        :
                        <div
                          className="swatch w-5 h-5 border border-white"
                          style={{ backgroundColor: popup.properties.fill }}
                        />
                      }
                    </TableCell>
                  }
                  {arr[0] === "type" &&
                    <TableCell>{arr[1].replaceAll("_", " ")}</TableCell>
                  }
                  {(!isColor && !arr[1]?.toString().startsWith("http") && arr[0] !== "type") &&
                    // <TableCell>{arr[1]}</TableCell>
                    <TableCell>{arr[1]?.length > 40 ? `${arr[1]?.substring(0, 40)}...` : arr[1]}</TableCell>
                  }
                  <TableCell>
                    <Dialog className="">
                      <DialogTrigger>
                        {arr[0] !== "type" && arr[0] !== "name" && (
                          <Trash2 className="cursor-pointer stroke-gray-400" size={14} />
                        )}
                      </DialogTrigger>
                      <DialogContent className="max-h-[600px]">
                        <DialogHeader>
                          <DialogTitle>Confirm <b>delete</b> row <b>{arr[0]}</b>?</DialogTitle>
                          <table className="w-full text-left my-4 select-text">
                            <tbody>
                              <tr>
                                <td className="border p-2">{arr[0]}</td>
                                <td className="border p-2 max-w-[400px] overflow-auto">{arr[1]}</td>
                              </tr>
                            </tbody>
                          </table>
                          <div className="flex justify-between">
                            <Button variant="destructive" onClick={() => deleteRow(i)} className="cursor-pointer rounded">
                              Delete
                            </Button>
                            <DialogClose asChild>
                              <Button variant="secondary" className="cursor-pointer rounded">
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
            })
          )}

          {isAddingRow && (
            <TableRow>
              <TableCell>
                <Input
                  name="key"
                  value={newRow.key}
                  onChange={handleInputChange}
                  placeholder="key"
                  className="h-8"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave()
                    }
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave()
                    }
                  }}
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
      <Dialog>
        <DialogTrigger asChild >
          <Button size="sm" className="cursor-pointer w-full h-[30px] mb-2" variant="secondary">
            <CircleHelp className="cursor-pointer stroke-gray-400 inline" size={14} /> Special Keys
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
                    <div dangerouslySetInnerHTML={{ __html: obj[1].split("|")[0] }} />
                  </TableCell>
                  <TableCell className="text-center">{obj[1].split("|type=")[1]}</TableCell>
                  {obj[1].includes("|required") && <TableCell title="this field is required" className="cursor-help text-center">🚩</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
      {(!isAddingRow && !editorTable) ?
        <>
          <Button size="sm" onClick={() => setIsAddingRow(true)} className="cursor-pointer w-full h-[30px] mb-2" variant="secondary">
            <Plus className="mr-2 h-4 w-4" />
            Add Data
          </Button>
          <Button size="sm" onClick={handleEdit} className="cursor-pointer w-full h-[30px] mb-2" variant="secondary">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Data
          </Button>

        </>
        :
        <Button size="sm" onClick={handleSave} className="cursor-pointer w-full h-[30px]">
          <Save className="mr-2 h-4 w-4" />
          Save
        </Button>
      }

      <IconSelector mapName={mapName.includes("lancer") ? "lancer" : mapName} onSelect={selectIcon} show={(!isAddingRow && !editorTable && !feature.properties.icon)} />
      {params.get("secret") && <Link editProp={editProp} handleSave={handleSave} feature={feature} />}
    </div >
  )
}

export const Link = ({ editProp, handleSave, feature }) => {
  const [documentId, setDocumentId] = useState()
  const [open, setOpen] = useState()
  const [hasQuests, setHasQuests] = useState()

  const handleSubmit = (tab, doc) => {
    if (feature.geometry.type !== "Point") {
      toast.warning("Only Point locations can have links. Stay tuned for a future update to add more geometry link support.")
      return
    }
    window.parent.postMessage({ type: 'listen', tab, doc }, '*')
  }

  const saveUUID = value => {
    editProp(value || documentId || "", "link")
    handleSave()
    setOpen(false)
  }

  useEffect(() => {
    const listener = e => {
      if (e.data.type === 'uuid') {
        setDocumentId(e.data.uuid)
        saveUUID(e.data.uuid)
      } else if (e.data.type === "modules") {
        if (e.data.modules.includes("forien-quest-log")) {
          setHasQuests(true)
        }
      }
    }
    window.addEventListener('message', listener)
    window.parent.postMessage({type: "modules", desc: "give me all active modules"}, "*")
    return () => {
      window.removeEventListener('message', listener)
    }
  }, [])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" onClick={() => setOpen(!open)} className="cursor-pointer w-full h-[30px]" variant="secondary">
          <Chain className="mr-2" />
          Link to Foundry
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex flex-col">
        <p className='mb-3 text-gray-400'>Link a Foundry Document to this feature. A UUID can be entered manually or you can connect it by using the buttons.</p>
        <hr className='border my-4 border-gray-500' />
        <Input className="w-full mb-4" value={documentId || ""} placeholder="Foundry Document UUID" onChange={(e) => setDocumentId(e.target.value)} />
        {documentId &&
          <Button className="cursor-pointer w-full" onClick={saveUUID}>
            <Chain className="ml-[.6em] inline" /> <span className="ml-[5px]">Link</span>
          </Button>
        }
        <Button className="cursor-pointer w-full my-2 mt-6" variant="secondary" onClick={() => handleSubmit('journal', "journal")}>
          <Notebook className="ml-[.6em] inline" /> <span className="ml-[5px]">Journal</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit('journal', "journal page")}>
          <StickyNote className="ml-[.6em] inline" /> <span className="ml-[5px]">Journal Page</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit('macros', "macro")}>
          <Code className="ml-[.6em] inline" /> <span className="ml-[5px]">Macro</span>
        </Button>
        <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit('scenes', "scene")}>
          <Map className="ml-[.6em] inline" /> <span className="ml-[5px]">Scene</span>
        </Button>
        {hasQuests && <Button className="cursor-pointer w-full my-2" variant="secondary" onClick={() => handleSubmit(null, "quest")}>
          <MessageCircleWarning className="ml-[.6em] inline" /> <span className="ml-[5px]">Quest</span>
        </Button>}
      </PopoverContent>
    </Popover>

  );
};

export const PopoverPicker = ({ color, onChange, editProp }) => {
  const popover = useRef();
  const [isOpen, toggle] = useState(false)
  const close = useCallback(() => toggle(false), []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popover.current && !popover.current.contains(event.target)) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popover, close]);

  return (
    <>
      {isOpen
        ? <div className="popover" ref={popover}>
          <RgbaColorPicker color={rgbaToObj(color)} onChange={onChange} />
        </div>
        : <div
          className="swatch w-5 h-5 cursor-pointer border border-white"
          style={{ backgroundColor: objToRgba(color) }}
          onClick={() => toggle(true)}
        />
      }
    </>
  );
};

const rgbaToObj = (rgba) => {
  if (!rgba) return
  if (typeof rgba === "object") return rgba
  const rgbaRegex = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)/;
  const result = rgba?.match(rgbaRegex);
  // const result = rgba?.match(/rgba?\((\d+), (\d+), (\d+), (\d+\.?\d*)\)/);
  // console.log("result", result, rgba)
  return result ? {
    r: parseInt(result[1], 10),
    g: parseInt(result[2], 10),
    b: parseInt(result[3], 10),
    a: parseFloat(result[4])
  } : undefined;
}

const objToRgba = (rgba) => {
  if (!rgba) return
  if (typeof rgba !== "object") return rgba
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`
};
