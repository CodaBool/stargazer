import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import ThreejsPlanet from "./threejsPlanet"

const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/"

export default function SolarSystemDiagram({ group, height }) {


  console.log("diagram", group)
  return (
    <div className="w-full overflow-x-auto overflow-y-visible py-2 h-[14vh]">
      <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
        {group.map((body, index) => (
          <div key={index} className="flex flex-col items-center relative">
            <Dialog>
              <DialogTrigger className="" >
                <img
                  src={`${body.icon ? svgBase + body.icon + ".svg" : svgBase + "lancer/moon.svg"}`}
                  alt={body.name}
                  style={{
                    width: body.size || 50 + "px",
                    height: body.size || 50 + "px",
                    filter: body.tint ? `drop-shadow(0 0 6px ${body.tint})` : undefined,
                  }}
                />
              </DialogTrigger>
              <DialogContent className="" style={{ minWidth: '95vw', height: (height * .8) + "px" }}>
                <DialogTitle>{body.name}</DialogTitle>
                {(body.threejs.type !== "station" && body.threejs.type !== "gate" && body.threejs.type !== "abbb") ? (
                  <ThreejsPlanet
                    height={height * .75}
                    type={body.threejs.type}
                    pixels={800}
                    baseColors={body.threejs.baseColors}
                    featureColors={body.threejs.featureColors}
                    layerColors={body.threejs.layerColors}
                    schemeColor={body.threejs.schemeColor}
                    atmosphere={body.atmosphere}
                    clouds={body.threejs.clouds}
                    cloudCover={body.threejs.cloudCover}
                    size={body.threejs.size}
                    land={body.threejs.land}
                    ringWidth={body.ringWidth}
                    lakes={body.lakes}
                    rivers={body.rivers}
                    seed={body.seed}
                  />
                )
                  :
                  <h1>this type is not supported yet</h1>}
              </DialogContent>
            </Dialog>
            {typeof body.moons === "array" && (
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
  );
}
