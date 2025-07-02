'use client';
import { genLink, svgBase } from "@/lib/utils";
import { Badge } from "./ui/badge"
import { useEffect, useRef } from "react";

export default function SolarSystemDiagram({ group, selectedId, map, name }) {
  const selectedRef = useRef(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
      });
    }
  }, [selectedId]);

  function handleMouseOver(d) {
    if (!d) return
    map.setFeatureState(
      { source: 'source', id: d.id },
      { hover: true }
    )
  }

  function handleMouseOut(d) {
    if (!d) return
    map.setFeatureState(
      { source: 'source', id: d.id },
      { hover: false }
    )
  }


  function panTo(feat) {
    if (feat.geometry.type !== "Point") return
    const coordinates = feat.geometry.coordinates

    // try to compensate for sheet height
    let lng = coordinates[0]
    let lat = coordinates[1]
    const arbitraryNumber = 9.7
    // const arbitraryNumber = locations?.length > 5 ? 9.5 : 10
    let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom())
    zoomFactor = Math.max(zoomFactor, 4)
    const latDiff = (map.getBounds().getNorth() - map.getBounds().getSouth()) / zoomFactor
    lat = coordinates[1] - latDiff / 2

    map.flyTo({ center: [lng, lat], duration: 800 })
  }

  return (
    <>
      <div className="w-full overflow-x-auto overflow-y-visible py-2">
        <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
          {group.map((body, index) => {
            const selected = (body.id === selectedId) && typeof selectedId !== "undefined"
            return (
              <div key={index} ref={selected ? selectedRef : null} className="flex flex-col items-center relative min-w-[40px]">
                <img
                  src={`${svgBase + name}/${body.properties.type}.svg`}
                  alt={body.properties.name}
                  onClick={() => {
                    if (selected) {
                      window.open(genLink(body, name, "href"), '_blank');
                    } else {
                      panTo(body)
                    }
                  }}
                  onMouseOver={() => handleMouseOver(body)}
                  onMouseOut={() => handleMouseOut(body)}
                  className={`hover-grow-xl cursor-pointer ${selected ? 'animate-pulse' : ''}`}
                  style={{
                    width: 40 + "px",
                    height: 40 + "px",
                    filter: body.properties.tint ? `drop-shadow(0 0 6px ${body.properties.tint})` : undefined,
                  }}
                />
                <div className="text-xs mt-2 text-center text-white md:text-sm">
                  {body.properties.name}
                </div>
                <div className="text-xs mt-2 text-center text-white opacity-80">
                  {selected && <Badge variant="brightOrange" className="mx-auto">Selected</Badge>}
                  {body.properties.unofficial && <Badge variant="destructive" className="mx-auto">unofficial</Badge>}
                  {body.properties.faction && <Badge className="mx-auto">{body.properties.faction}</Badge>}
                  {body.properties.destroyed && <Badge className="mx-auto">destroyed</Badge>}
                  {body.properties.capital && <Badge variant="destructive" className="mx-auto">capital</Badge>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}
