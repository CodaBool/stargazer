'use client';

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import ThreejsPlanet from "./threejsPlanet";

const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/";

let sharedRenderer = null;
let sharedCanvas = null;

export default function SolarSystemDiagram({ group, height }) {
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
  }, []);

  const closeDialog = func => {
    func(null)
  }

  return (
    <>
      <div className="w-full overflow-x-auto overflow-y-visible py-2">
        <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
          {group.map((body, index) => (
            <div key={index} className="flex flex-col items-center relative min-w-[40px]">
              <img
                src={`${body.icon ? svgBase + body.icon + ".svg" : svgBase + "lancer/moon.svg"}`}
                alt={body.name}
                onClick={() => setActiveBody(body)}
                style={{
                  width: 40 + "px",
                  height: 40 + "px",
                  filter: body.tint ? `drop-shadow(0 0 6px ${body.tint})` : undefined,
                  cursor: "pointer",
                }}
              />
              {body.moons?.length > 0 && (
                <div className="mt-2 flex flex-col items-center">
                  <img
                    src={svgBase + "lancer/moon.svg"}
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
            </div>
          ))}
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
                console.log("display moon", moon)
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
            <DialogTitle>{activeBody.name}</DialogTitle>
            {activeBody.threejs?.type !== "station" && activeBody.threejs?.type !== "gate" ? (
              <ThreejsPlanet
                sharedCanvas={sharedCanvas}
                sharedRenderer={sharedRenderer}
                height={squareSize}
                type={activeBody.threejs.type}
                pixels={800}
                baseColors={activeBody.threejs.baseColors}
                featureColors={activeBody.threejs.featureColors}
                layerColors={activeBody.threejs.layerColors}
                schemeColor={activeBody.threejs.schemeColor}
                atmosphere={activeBody.atmosphere}
                clouds={activeBody.threejs.clouds}
                cloudCover={activeBody.threejs.cloudCover}
                size={activeBody.threejs.size}
                land={activeBody.threejs.land}
                ringWidth={activeBody.ringWidth}
                lakes={activeBody.lakes}
                rivers={activeBody.rivers}
                seed={activeBody.seed}
              />
            ) : (
              <h1 className="text-center text-4xl">No preview available for this type</h1>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
