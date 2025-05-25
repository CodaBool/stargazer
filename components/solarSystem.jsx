import React from "react";

const svgBase = "https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/";

export default function SolarSystemDiagram({ bodies }) {

  console.log("system", bodies)
  return (
    <div className="w-full overflow-x-auto overflow-y-visible border-t border-b py-2 h-[28vh]">
      <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
        {bodies.map((body, index) => (
          <div key={index} className="flex flex-col items-center relative">
            <img
              src={`${body.icon ? svgBase + body.icon + ".svg" : svgBase + "lancer/moon.svg"}`}
              alt={body.name}
              style={{
                width: body.size + "px",
                height: body.size + "px",
                filter: body.tint ? `drop-shadow(0 0 6px ${body.tint})` : undefined,
              }}
            />
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
