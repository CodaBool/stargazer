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
  const [squareSize, setSquareSize] = useState(0);
  const [activeBody, setActiveBody] = useState(null)

  useEffect(() => {
    const updateSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      setSquareSize(Math.min(900, vmin * 0.95));
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleClick = (body) => {
    setActiveBody(body);
  };

  const closeDialog = () => {
    setActiveBody(null);
  };

  return (
    <>
      <div className="w-full overflow-x-auto overflow-y-visible py-2 h-[14vh]">
        <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
          {group.map((body, index) => (
            <div key={index} className="flex flex-col items-center relative">
              <img
                src={`${body.icon ? svgBase + body.icon + ".svg" : svgBase + "lancer/moon.svg"}`}
                alt={body.name}
                onClick={() => handleClick(body)}
                style={{
                  width: body.size || 50 + "px",
                  height: body.size || 50 + "px",
                  filter: body.tint ? `drop-shadow(0 0 6px ${body.tint})` : undefined,
                  cursor: "pointer",
                }}
              />
              {Array.isArray(body.moons) && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 flex flex-col items-center space-y-2">
                  {body.moons.map((moon, mi) => (
                    <div key={mi} className="flex flex-col items-center">
                      <img
                        src={`${moon.type ? svgBase + moon.type + ".svg" : svgBase + "lancer/moon.svg"}`}
                        alt={moon.name}
                        style={{ width: (body.size / 1.5) + "px", height: moon.size + "px" }}
                      />
                      <div className="text-[10px] text-white opacity-70 text-center mt-1 whitespace-nowrap">
                        {moon.name || "moon"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="text-xs mt-2 text-center text-white opacity-80 whitespace-nowrap">
                {body.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!activeBody} onOpenChange={(open) => !open && closeDialog()}>
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
            {/* <h1>testing nodes</h1> */}
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
              <h1 className="text-center text-4xl">this type is not supported yet</h1>
            )}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
