import { useEffect, useState } from "react"
import { Button } from './ui/button'
import { useMap } from "react-map-gl/maplibre";
import EditorForm from "./forms/editor";
import randomName from "@scaleway/random-name";
import { X } from "lucide-react";
import { useDraw } from "./controls";
import { getMaps, localSet, useStore } from "@/lib/utils";

export default function Editor({ mapName, params, TYPES, data, GEO_EDIT }) {
  const { map } = useMap()
  const draw = useDraw(s => s.draw)
  const [popup, setPopup] = useState()
  const { setEditorTable } = useStore()

  function handleClick(e) {
    if (!draw.getSelected().features.length) return
    const f = draw.getSelected().features[0]
    if (GEO_EDIT) console.log(f.properties.name)
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

    // dev mode
    let geojson
    if (GEO_EDIT) {
      geojson = data
      console.log("export", draw.getAll())
    } else {
      geojson = draw.getAll()
    }

    if (!geojson.features.length) return
    getMaps().then(maps => {
      localSet("maps", {
        ...maps, [mapId]: {
          geojson,
          name: maps[mapId]?.name || randomName('', ' '),
          updated: Date.now(),
          id: Number(params.get('id')),
          map: mapName,
          config: maps[mapId]?.config || {},
        }
      })
    })
  }, [popup, draw])

  // if (GEO_EDIT) return

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
