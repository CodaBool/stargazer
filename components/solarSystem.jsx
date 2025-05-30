'use client';

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ThreejsPlanet from "./threejsPlanet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { genLink } from "@/lib/utils";
import Link from "next/link";
import { RGBA_PVRTC_2BPPV1_Format } from "three";

const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/";

let sharedRenderer = null;
let sharedCanvas = null;

export default function SolarSystemDiagram({ group, height, isGalaxy, selectedId, map, name }) {
  const [squareSize, setSquareSize] = useState()
  const [activeBody, setActiveBody] = useState()
  const [moonBodies, setMoonBodies] = useState()

  useEffect(() => {
    const updateSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setSquareSize(Math.min(900, vmin * 0.95));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [])

  useEffect(() => {
    if (!activeBody) return
    console.log("opened", activeBody)
  }, [activeBody]);

  const closeDialog = func => {
    func(null)
  }

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

  return (
    <>
      <div className="w-full overflow-x-auto overflow-y-visible py-2">
        <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
          {group.map((body, index) => {
            const source = body.source?.id === selectedId ? body.source : undefined
            if (source) console.log("source", source)
            return (
              <div key={index} className="flex flex-col items-center relative min-w-[40px]">
                <img
                  src={`${isGalaxy ? svgBase + "lancer/" + (body.ringed ? "ringed_planet" : body.type) + ".svg" : svgBase + "lancer/moon.svg"}`}
                  alt={body.name}
                  onClick={() => setActiveBody(body)}
                  onMouseOver={() => handleMouseOver(source)}
                  onMouseOut={() => handleMouseOut(source)}
                  className="hover-grow-xl cursor-pointer"
                  style={{
                    width: 40 + "px",
                    height: 40 + "px",
                    filter: body.tint ? `drop-shadow(0 0 6px ${body.tint})` : undefined,
                  }}
                />
                {body.moons?.length > 0 && (
                  <div className="mt-2 flex flex-col items-center">
                    <img
                      src={svgBase + "lancer/moon.svg"}
                      className="hover-grow-xl cursor-pointer"
                      onClick={() => {
                        if (body.moons.length === 1) {
                          setActiveBody(body.moons[0])
                        } else {
                          setMoonBodies(body.moons)
                        }
                      }}
                      style={{ width: 30 + "px", height: 30 + "px" }}
                    />
                    <div className="text-ms opacity-70 mt-1 text-center">
                      {body.moons.length}x
                    </div>
                  </div>
                )}
                <div className="text-xs mt-2 text-center text-white opacity-80">
                  {body.name}
                </div>
                {source && (
                  <div className="text-xs mt-2 text-center text-white opacity-80">
                    {source.properties.unofficial && <Badge variant="destructive" className="mx-auto">unofficial</Badge>}
                    {source.properties.faction && <Badge className="mx-auto">{source.properties.faction}</Badge>}
                    {source.properties.destroyed && <Badge className="mx-auto">destroyed</Badge>}
                    {source.properties.capital && <Badge variant="destructive" className="mx-auto">capital</Badge>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={!!moonBodies} onOpenChange={open => !open && closeDialog(setMoonBodies)}>
        {moonBodies && (
          <DialogContent
            className="p-3 md:p-6"
            style={{
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize + 40}px`,
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              maxWidth: "95vw",
              maxHeight: "95vh",
            }}
          >
            <DialogTitle style={{ height: "2em", maxHeight: "2em" }}>Moons</DialogTitle>

            <div className={`flex flex-wrap justify-evenly content-start`}>
              {moonBodies.map((moon, i) => {
                // console.log("display moon", moon)
                return (
                  <img
                    src={svgBase + "lancer/" + moon.type + ".svg"}
                    alt={moon.name}
                    key={i}
                    onClick={() => setActiveBody(moon)}
                    style={{
                      filter: moon.tint ? `drop-shadow(0 0 6px ${moon.tint})` : undefined,
                      cursor: "pointer",
                      maxWidth: "50px", // Ensure images are small by default
                      margin: "8px", // Margins for spacing between images
                    }}
                  />
                )
              })}
            </div>
          </DialogContent>
        )}
      </Dialog >

      <Dialog open={!!activeBody} onOpenChange={(open) => !open && closeDialog(setActiveBody)}>
        {activeBody && (
          <DialogContent
            className="p-3 md:p-6"
            style={{
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize + 40}px`,
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              maxWidth: "95vw",
              maxHeight: "95vh",
            }}
          >
            <DialogTitle>{activeBody.name || activeBody.type + `${activeBody.variant ? ` (${activeBody.variant})` : ""}`}</DialogTitle>
            {activeBody.type !== "station" && activeBody.type !== "gate" ? (
              <ThreejsPlanet
                sharedCanvas={sharedCanvas}
                sharedRenderer={sharedRenderer}
                height={squareSize}
                type={activeBody.ringed ? "ring" : activeBody.type}
                pixels={800}
                // 4 comma separated hexes
                baseColors={activeBody.baseColors}
                // 4 comma separated hexes
                featureColors={activeBody.featureColors}
                // 4 comma separated alpha hexes
                layerColors={activeBody.layerColors}
                // star ([blue, orange, red, white, yellow], default orange)
                schemeColor={activeBody.schemeColor}
                // 3 comma separated alpha hexes
                atmosphere={activeBody.atmosphere}
                // ice & terrestrial (defaults true)
                clouds={activeBody.cloud}
                // ice & terrestrial (lower is more clouds)
                cloudCover={activeBody.cloud}
                // asteroid 1-9
                size={activeBody.size}
                // terrestrial, lower is more land
                land={activeBody.hydrosphere}
                // ring size 0-.2
                ringWidth={activeBody.ringSize}
                // ice (lower is more lakes)
                lakes={activeBody.ice}
                // lava (lower is more lava)
                rivers={activeBody.hydrosphere}
                // a number
                seed={activeBody.seed}
                planetSize={activeBody.planetSize}
              />
            ) : (
              <h1 className="text-center text-4xl">No preview available for this type</h1>
            )}
            {activeBody.source
              ? <div className="absolute top-[85px] left-[40px] flex flex-col items-center">
                <Link href={genLink(activeBody.source, name, "href")} className="mb-2">
                  {name === "lancer" && <Button className="cursor-pointer rounded" variant="outline">Discussion</Button>}
                  {name === "postwar" && <Button className="cursor-pointer">Wiki</Button>}
                  {name === "mousewars" && <Button className="cursor-pointer">Wiki</Button>}
                </Link>
                {activeBody.source.properties.unofficial && <Badge variant="destructive" className="">unofficial</Badge>}
                {activeBody.source.properties.faction && <Badge className="">{activeBody.source.properties.faction}</Badge>}
                {activeBody.source.properties.destroyed && <Badge className="">destroyed</Badge>}
                {activeBody.source.properties.capital && <Badge variant="destructive" className="">capital</Badge>}

                {activeBody.cloud && <Badge variant="destructive" className="">{1 - activeBody.cloud} cloud coverage</Badge>}
                {activeBody.hydrosphere && <Badge variant="destructive" className="">{activeBody.hydrosphere} hydrosphere</Badge>}
                {activeBody.ice && <Badge variant="destructive" className="">{activeBody.ice} ice coverage</Badge>}
                {activeBody.radius && <Badge variant="destructive" className="">{activeBody.radius.toFixed(2)} {activeBody.type === "star" ? "solar radii" : "km radius"}</Badge>}
                {activeBody.temperature && <Badge variant="destructive" className="">{activeBody.temperature}°C</Badge>}
                {activeBody.dominantChemical && <Badge variant="destructive" className="">Dominant Chemical: {activeBody.dominantChemical}</Badge>}
                {activeBody.daysInYear && <Badge variant="destructive" className="">{activeBody.daysInYear} days in year</Badge>}
                {activeBody.hoursInDay && <Badge variant="destructive" className="">{activeBody.hoursInDay} hours in day</Badge>}
                {activeBody.gravity && <Badge variant="destructive" className="">{activeBody.gravity} cm/sec²</Badge>}
                {activeBody.pressure && <Badge variant="destructive" className="">{activeBody.pressure} millibars</Badge>}
                {activeBody.moons && <Badge variant="destructive" className="">{activeBody.moons.length} moons</Badge>}
                {activeBody.modifier && <Badge variant="destructive" className="">{activeBody.modifier}</Badge>}
                {activeBody.isMoon && <Badge variant="destructive" className="">Moon</Badge>}
              </div>
              : <div className="absolute top-[85px] left-[40px] flex flex-col text-sm">
                {(typeof activeBody.cloud === "number" && (activeBody.type === "terrestrial" || activeBody.type === "ice")) && <p variant="destructive" className="mt-4">{(1 - activeBody.cloud).toFixed(2)} cloud coverage %</p>}
                {(typeof activeBody.hydrosphere === "number" && activeBody.type !== "ice") && <p className="mt-4">{activeBody.hydrosphere.toFixed(2)} hydrosphere %</p>}
                {(typeof activeBody.hydrosphere === "number" && activeBody.type === "ice") && <p className="mt-4">{(1 - activeBody.ice).toFixed(2)} hydrosphere %</p>}
                {typeof activeBody.ice === "number" && <p variant="destructive" className="mt-4">{activeBody.ice.toFixed(2)} ice coverage %</p>}
                {typeof activeBody.radius === "number" && <p variant="destructive" className="mt-4">{activeBody.radius.toFixed(2)} {activeBody.type === "star" ? "solar radii" : "km radius"}</p>}
                {typeof activeBody.temperature === "number" && <p variant="destructive" className="mt-4">{activeBody.temperature}°C</p>}
                {typeof activeBody.dominantChemical === "string" && <p variant="destructive" className="mt-4">Dominant Chemical: {activeBody.dominantChemical}</p>}
                {typeof activeBody.daysInYear === "number" && <p variant="destructive" className="mt-4">{activeBody.daysInYear} days in year</p>}
                {typeof activeBody.hoursInDay === "number" && <p variant="destructive" className="mt-4">{activeBody.hoursInDay} hours in day</p>}
                {typeof activeBody.gravity === "number" && <p variant="destructive" className="mt-4">Gavity: {activeBody.gravity} cm/sec²</p>}
                {activeBody.pressure > 0 && <p variant="destructive" className="mt-4">Pressure: {activeBody.pressure} millibars</p>}
                {activeBody.moons?.length > 0 && <p variant="destructive" className="mt-4">{activeBody.moons.length} moon{activeBody.moons.length === 1 ? "" : "s"}</p>}
                {typeof activeBody.modifier === "string" && <p variant="destructive" className="mt-4">{activeBody.modifier}</p>}
                {activeBody.isMoon && <p variant="destructive" className="mt-4">Moon</p>}
              </div>
            }
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
