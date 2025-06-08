import { useEffect, useState } from "react"
import { Button } from './ui/button'
import { useMap } from "react-map-gl/maplibre";
import EditorForm from "./forms/editor";
import randomName from "@scaleway/random-name";
import { X } from "lucide-react";
import { useStore } from "./cartographer";
import { useDraw } from "./controls";
import { localGet, localSet } from "@/lib/utils";

export default function Editor({ mapName, params, TYPES }) {
  const { map } = useMap()
  const draw = useDraw(s => s.draw)
  const [popup, setPopup] = useState()
  const { setEditorTable } = useStore()

  function handleClick(e) {
    if (!draw.getSelected().features.length) return
    const f = draw.getSelected().features[0]
    if (draw.getMode() !== 'simple_select' && draw.getMode() !== 'direct_select') return
    const feature = draw.get(f.id) || f
    setPopup(feature)
  }

  useEffect(() => {
    if (!map || !draw) return
    map.on('click', handleClick)
    return () => map.off('click', handleClick)
  }, [map, draw])

  useEffect(() => {
    if (!popup) setEditorTable(null)
  }, [popup])

  useEffect(() => {
    setEditorTable(null)
  }, [])

  useEffect(() => {
    if (!popup || !draw) return
    // duplicate of controls save function
    // const urlParams = new URLSearchParams(window.location.search);
    const mapId = mapName + "-" + params.get('id')
    const geojson = draw.getAll()
    if (!geojson.features.length) return
    localGet('maps').then(r => {
      r.onsuccess = () => {
        localSet("maps", {
          ...r.result, [mapId]: {
            geojson,
            name: r.result[mapId]?.name || randomName('', ' '),
            updated: Date.now(),
            map: mapName,
            config: r.result[mapId]?.config || {},
          }
        })
      }
    })
  }, [popup, draw])

  if (popup) {
    return (
      <div
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '20px',
          background: 'black',
          padding: '8px',
          zIndex: 10,
          maxWidth: "90vw",
          transition: 'bottom 0.5s ease-in-out',
        }}
        className="editor-table border"
      >
        <div className="flex justify-end">
          <Button variant="ghost" className="p-0 w-6 h-3 cursor-pointer" onClick={e => setPopup(null)}>
            <X />
          </Button>
        </div>
        <EditorForm feature={popup} mapName={mapName} draw={draw} setPopup={setPopup} popup={popup} params={params} TYPES={TYPES} />
      </div>
    );
  }

}
