"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import ThreejsPlanet from "./threejsPlanet";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { genLink, getIcon, SVG_BASE } from "@/lib/utils";
import Link from "next/link";
import { claimThreeCanvas } from "./threeHostRegistry.js";
import { BadgeList } from "./drawer";

export default function SolarSystemDiagram({
  group,
  width,
  height,
  params,
  map,
  name,
  passedLocationClick,
  display,
}) {
  const [activeBody, setActiveBody] = useState()
  const [moonBodies, setMoonBodies] = useState()
  const squareSize = Math.min(700, Math.min(width, height) * 0.9);
  const closeDialog = (setter) => setter();

  function handleMouseOver(feature) {
    if (feature.properties.fake || !map || (!feature.me?.id && !feature.id)) return;
    map.setFeatureState({ source: "source", id: feature.me?.id || feature.id }, { hover: true });
  }

  function handleMouseOut(feature) {
    if (feature.properties.fake || !map || (!feature.me?.id && !feature.id)) return;
    map.setFeatureState({ source: "source", id: feature.me?.id || feature.id }, { hover: false });
  }

  function getFilter(body) {
    return body?.properties?.tint ? `drop-shadow(0 0 6px ${body?.properties?.tint})` : undefined;
  }

  return (
    <>
      <div className="w-full overflow-x-auto overflow-y-visible py-2">
        <div className="flex items-baseline h-full space-x-6 px-4 justify-evenly">
          {group.map((body, index) => {
            const { properties, me } = body;
            const moons = Array.isArray(properties.moons) ? properties.moons : [];
            return (
              <div key={index} className="flex flex-col items-center relative min-w-[50px]">
                <div className="flex flex-wrap items-center">
                  <img
                    src={getIcon(me, properties.type, name)}
                    alt={properties.name}
                    onClick={() => {
                      if (me) {
                        if (params.get("quest")) {
                          document.querySelector("#quest-textbox").textContent = properties.name
                          window.questLink = {id: me.id, properties, type: me.geometry.type}
                        }
                        passedLocationClick(null, me, properties.fake ? { group, d: display } : {});
                        return;
                      }
                      setActiveBody(body);
                    }}
                    onMouseOver={() => handleMouseOver(body)}
                    onMouseOut={() => handleMouseOut(body)}
                    className="hover-grow-xl cursor-pointer"
                    style={{
                      width: "40px",
                      height: "40px",
                      filter: getFilter(body),
                    }}
                  />

                  {moons.length > 0 && (
                    <div className="flex flex-wrap items-center ms-1">
                      <img
                        src={SVG_BASE + "lancer/moon.svg"}
                        className="hover-grow-xl cursor-pointer"
                        onClick={() => {
                          if (moons.length === 1) setActiveBody({ properties: moons[0] });
                          else setMoonBodies(moons);
                        }}
                        style={{ width: "25px", height: "25px" }}
                        alt="Moons"
                      />
                      <div
                        className="text-ms opacity-70 text-center ms-1 cursor-pointer select-none"
                        onClick={() => {
                          if (moons.length === 1) setActiveBody({ properties: moons[0] });
                          else setMoonBodies(moons);
                        }}
                      >
                        {moons.length}x
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-xs text-center text-white lg:text-sm">
                  {!properties.fake && properties.name}
                </div>

                {body.faction && (
                  <div className="text-xs lg:text-sm text-center text-white opacity-80">
                    <Badge className="mx-auto">{body.faction}</Badge>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Moons list dialog */}
      <Dialog open={!!moonBodies} onOpenChange={(open) => !open && closeDialog(setMoonBodies)}>
        {Array.isArray(moonBodies) && (
          <DialogContent
            className="p-4 m-0 md:p-8"
            style={{
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize + 80}px`,
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              maxWidth: "95vw",
              maxHeight: "95vh",
            }}
          >
            <DialogTitle style={{ height: "2em", maxHeight: "2em" }}>Moons</DialogTitle>
            <div className="flex flex-wrap justify-evenly content-start overflow-auto">
              {moonBodies.map((moon, i) => (
                <img
                  src={getIcon(moon.me, moon.type, name)}
                  alt={"moon " + i}
                  key={i}
                  onClick={() => setActiveBody({ properties: moon })}
                  style={{
                    filter: getFilter({ properties: moon }),
                    cursor: "pointer",
                    maxWidth: "50px",
                    margin: "8px",
                  }}
                />
              ))}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Active body dialog */}
      <Dialog
        open={!!activeBody}
        onOpenChange={(open) => {
          if (open) claimThreeCanvas("modal", { force: true });
          else claimThreeCanvas("drawer", { force: true });
          if (!open) closeDialog(setActiveBody);
        }}
      >
        {activeBody && (
          <DialogContent
            className="p-2 m-0 md:p-4"
            style={{
              minWidth: `${squareSize}px`,
              minHeight: `${squareSize + 50}px`,
              width: `${squareSize}px`,
              height: `${squareSize}px`,
              maxWidth: "98vw",
              maxHeight: "98vh",
              backgroundColor: "black",
            }}
          >
            {(() => {
              const p = activeBody.properties || {};
              const title = `${p.name || ""}${p.variant ? ` (${p.variant})` : ""} ${(p.type || "unknown").replaceAll("_", " ")}`;

              return (
                <>
                  <DialogTitle>{title}</DialogTitle>

                  <ThreejsPlanet
                    hostKey="modal"
                    height={squareSize}
                    width={squareSize}
                    type={p.ringed ? "ringed_planet" : p.type}
                    pixels={Number(p.pixels) || 800}
                    baseColors={p.baseColors}
                    featureColors={p.featureColors}
                    layerColors={p.layerColors}
                    schemeColor={p.schemeColor}
                    atmosphereColors={p.atmosphereColors}
                    cloudPercent={p.cloudPercent}
                    size={p.size}
                    hydroPercent={p.hydroPercent}
                    ringSize={p.ringSize}
                    lavaPercent={p.lavaPercent}
                    seed={p.seed}
                    planetSize={p.planetSize}
                    disableListeners={false}
                    propStyle={{ margin: "0 auto" }}
                  />

                  {/* Left side info + link */}
                  {activeBody.me && !activeBody.userCreated ? (
                    <div className="absolute top-[85px] left-[40px] flex flex-col items-center">


                      {genLink(d, name, "has wiki") &&
                        <Link
                          href={genLink(d, name, "href")}
                          target="_blank"
                          className="mb-2"
                        >
                          <Button className="cursor-pointer">Wiki</Button>
                        </Link>
                      }

                      <div className="pointer-events-none">
                        {activeBody.unofficial && (
                          <Badge variant="destructive">unofficial</Badge>
                        )}
                        {activeBody.faction && (
                          <Badge>{activeBody.faction}</Badge>
                        )}
                        {activeBody.destroyed && <Badge>destroyed</Badge>}
                        {activeBody.capital && (
                          <Badge variant="destructive">capital</Badge>
                        )}

                        {typeof p.cloudPercent === "number" && (
                          <Badge variant="destructive">
                            {Math.floor(p.cloudPercent * 100)}% cloud coverage
                          </Badge>
                        )}
                        {typeof p.hydroPercent === "number" && (
                          <Badge variant="destructive">
                            {Math.floor(p.hydroPercent * 100)}% hydrosphere
                          </Badge>
                        )}
                        {typeof p.icePercent === "number" && (
                          <Badge variant="destructive">
                            {Math.floor(p.icePercent * 100)}% ice coverage
                          </Badge>
                        )}
                        {typeof p.diameter === "number" && (
                          <Badge variant="destructive">
                            {p.diameter.toFixed(2)} {p.type === "star" ? "solar radii" : "km"}
                          </Badge>
                        )}
                        {typeof p.temperature === "number" && (
                          <Badge variant="destructive">
                            {p.type === "star"
                              ? `${Math.floor(p.temperature) + 273}°K`
                              : `${Math.floor(p.temperature)}°C`}
                          </Badge>
                        )}
                        {typeof p.composition === "string" && p.composition && (
                          <Badge variant="destructive">
                            Composition: {p.composition}
                          </Badge>
                        )}
                        {typeof p.daysInYear === "number" && (
                          <Badge variant="destructive">{p.daysInYear} days in a year</Badge>
                        )}
                        {typeof p.hoursInDay === "number" && (
                          <Badge variant="destructive">{p.hoursInDay} hours in a day</Badge>
                        )}
                        {typeof p.gravity === "number" && (
                          <Badge variant="destructive">{p.gravity} cm/sec²</Badge>
                        )}
                        {typeof p.pressure === "number" && (
                          <Badge variant="destructive">{p.pressure} millibars</Badge>
                        )}
                        {Array.isArray(p.moons) && (
                          <Badge variant="destructive">{p.moons.length} moons</Badge>
                        )}
                        <BadgeList
                          list={p.tags}
                          variant="secondary"
                          label="Tags"
                          align="left"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="absolute top-[35px] flex flex-col text-xs pointer-events-none md:text-sm md:left-[35px] md:top-[65px] left-[18px]">
                      {typeof p.cloudPercent === "number" &&
                        (p.type === "terrestrial" ||
                          p.type === "ice_planet" ||
                          p.type === "ocean_planet") && (
                          <p className="mt-2">{Math.floor(p.cloudPercent * 100)} cloud coverage %</p>
                        )}
                      {typeof p.hydroPercent === "number" && (
                        <p className="mt-2">{Math.floor(p.hydroPercent * 100)} hydrosphere %</p>
                      )}
                      {typeof p.lavaPercent === "number" && p.type === "lava_planet" && (
                        <p className="mt-2">{Math.floor(p.lavaPercent * 100)} lava %</p>
                      )}
                      {typeof p.icePercent === "number" && (
                        <p className="mt-2">{Math.floor(p.icePercent * 100)} ice coverage %</p>
                      )}
                      {typeof p.diameter === "number" && (
                        <p className="mt-2">
                          {p.diameter.toFixed(2)} {p.type === "star" ? "solar radii" : "km"}
                        </p>
                      )}
                      {typeof p.temperature === "number" && (
                        <p className="mt-2">
                          {p.type === "star"
                            ? `${Math.floor(p.temperature) + 273}°K`
                            : `${Math.floor(p.temperature)}°C`}
                        </p>
                      )}
                      {typeof p.composition === "string" && p.composition && (
                        <p className="mt-2">Composition: {p.composition}</p>
                      )}
                      {typeof p.daysInYear === "number" && (
                        <p className="mt-2">{p.daysInYear} days in a year</p>
                      )}
                      {typeof p.hoursInDay === "number" && (
                        <p className="mt-2">{p.hoursInDay} hours in a day</p>
                      )}
                      {typeof p.gravity === "number" && (
                        <p className="mt-2">Gravity: {(p.gravity * 0.0010197162).toFixed(1)} g</p>
                      )}
                      {typeof p.pressure === "number" && p.pressure > 0 && (
                        <p className="mt-2">Pressure: {(p.pressure / 1000).toFixed(1)} bars</p>
                      )}
                      {Array.isArray(p.moons) && p.moons.length > 0 && (
                        <p className="mt-2">
                          {p.moons.length} moon{p.moons.length === 1 ? "" : "s"}
                        </p>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
