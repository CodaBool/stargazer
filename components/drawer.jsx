import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge.jsx";
import { genLink, gridHelpers, svgBase } from "@/lib/utils.js";
import { fillMissingData, generateSystemAtClick } from "@/lib/fakeData.js";
import { useMap } from "@vis.gl/react-maplibre";
import SolarSystem from "./solarSystem.jsx";
import LocationSystem from "./locationSystem.jsx";
import { Book, Code, Crosshair, Drama, ExternalLink, MessageCircleWarning, StickyNote } from "lucide-react";
import ThreejsPlanet, { availableThreejsModels } from "./threejsPlanet";
import { claimThreeCanvas } from "./threeHostRegistry.js";
import { Button } from "./ui/button.jsx";
import { toast } from 'sonner'

export default function DrawerComponent({
  drawerContent,
  setDrawerContent,
  IS_GALAXY,
  coordinates,
  GENERATE_LOCATIONS,
  name,
  height,
  width,
  selectedId,
  mobile,
  d,
  myGroup,
  passedLocationClick,
  params,
  GEO_EDIT,
  GRID_DENSITY,
  COORD_OFFSET,
  SEARCH_SIZE,
  VIEW,
}) {
  const { map } = useMap();
  const GROUP_NAME = IS_GALAXY ? "Celestial Bodies" : "Nearby Locations";
  const squareSize = Math.min(IS_GALAXY ? 250 : 120, Math.min(width, height) * 0.3);

  const [display, setDisplay] = useState(() => fillMissingData(d)?.properties);

  useEffect(() => {
    setDisplay(fillMissingData(d)?.properties);
  }, [d]);

  useEffect(() => {
    // When drawer opens, prefer drawer ownership (but do not steal from modal)
    if (drawerContent) claimThreeCanvas("drawer");
  }, [drawerContent]);

  useEffect(() => {
    const el = document.querySelector(".editor-table");
    if (el) el.style.bottom = drawerContent ? "40%" : "20px";

    const hamburger = document.querySelector(".hamburger");
    const zoomControls = document.querySelector(".zoom-controls");
    if (!hamburger || !zoomControls) return;

    const isSmall = window.innerWidth < 1200;

    if (isSmall) {
      hamburger.style.bottom = drawerContent ? "45%" : "5em";
      zoomControls.style.bottom = drawerContent ? "55%" : "12em";
    } else {
      if (hamburger.style.bottom === "5em") hamburger.style.removeProperty("bottom");
      if (zoomControls.style.bottom === "12em") zoomControls.style.removeProperty("bottom");
      if (hamburger.style.bottom === "45%") hamburger.style.removeProperty("bottom");
      if (zoomControls.style.bottom === "55%") zoomControls.style.removeProperty("bottom");
    }
  }, [drawerContent]);

  const local = useMemo(() => {
    if (!d || !coordinates || !Array.isArray(myGroup)) return [];
    if (!GENERATE_LOCATIONS) return myGroup;
    if (d.geometry?.type !== "Point") return myGroup;

    // TODO: expose the *5 var here, it can be very useful for custom maps
    return generateSystemAtClick({
      lng: coordinates[0],
      lat: coordinates[1],
      SEARCH_SIZE,
      clickedFeature: d,
      VIEW: { maxBounds: VIEW.maxBounds },
      nearbyRealFeatures: myGroup,
      snapCellSizeDeg: SEARCH_SIZE * 5,
    })
  }, [
    d,
    coordinates,
    myGroup,
    GENERATE_LOCATIONS,
    VIEW?.maxBounds,
    SEARCH_SIZE,
  ]);

  function recenter() {
    if (!map || !coordinates || d.properties.fake) return;

    const arbitraryNumber = 9;
    let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom());
    zoomFactor = Math.max(zoomFactor, 4);

    const bounds = map.getBounds();
    const latDiff = (bounds.getNorth() - bounds.getSouth()) / zoomFactor;
    const lat = coordinates[1] - latDiff / 2;

    map.flyTo({ center: [coordinates[0], lat], duration: 800 });

    if (selectedId != null) {
      map.setFeatureState({ source: "source", id: selectedId }, { hover: true });
      setTimeout(() => {
        map.setFeatureState({ source: "source", id: selectedId }, { hover: false });
      }, 400);
    }
  }

  if (!coordinates || !d || !display || GEO_EDIT) return null;

  function foundryClick() {
    if (!params.get("iframe")) {
      toast.success(`Foundry only feature [${display?.source?.properties?.link}]`)
      return
    }
    window.parent.postMessage({type: "link", link: display?.source?.properties?.link}, "*")
  }

  let coordinatesPretty = `${coordinates[1].toFixed(2)}, ${coordinates[0].toFixed(2)}`;
  if (IS_GALAXY) {
    const { coordFromLngLat } = gridHelpers(name, GRID_DENSITY);
    coordinatesPretty = coordFromLngLat(coordinates[0], coordinates[1]).cell.label;
  } else {
    const offset = COORD_OFFSET || [0, 0];
    coordinatesPretty = `${(coordinates[1] + offset[0]).toFixed(1)}, ${(coordinates[0] + offset[1]).toFixed(1)}`;
  }

  const cloudPercent = typeof display.cloudPercent === "number" ? display.cloudPercent : 0;
  const iconType = display?.source?.properties?.type || display.type;
  const iconName = display?.source?.properties?.name || display.name || "Unknown";

  const starNum =
    typeof display?.source?.properties?.starType === "string"
      ? display.source.properties.starType.split(",").filter(Boolean).length
      : 0;

  return (
    <Drawer
      open={!!drawerContent}
      onOpenChange={() => setDrawerContent(null)}
      modal={false}
      snapPoints={[mobile ? 0.45 : IS_GALAXY ? 0.4 : 0.28, 0.92]}
    >
      <DrawerContent>
        <DrawerTitle />
        <div className="w-full flex flex-col items-center justify-center text-xs lg:text-base">
          {/* Canvas */}
          <div className="flex items-center justify-center z-[-1]">
            {drawerContent && IS_GALAXY && availableThreejsModels.includes(display.type) ? (
              <Suspense fallback={<div />}>
                <ThreejsPlanet
                  hostKey="drawer"
                  height={squareSize}
                  width={squareSize}
                  disableListeners={true}
                  type={display.ringed ? "ringed_planet" : display.type}
                  pixels={Number(display.pixels) || 800}
                  baseColors={display.baseColors}
                  featureColors={display.featureColors}
                  layerColors={display.layerColors}
                  schemeColor={display.schemeColor}
                  atmosphereColors={display.atmosphereColors}
                  clouds={display.clouds}
                  cloudPercent={display.cloudPercent}
                  hydroPercent={display.hydroPercent}
                  lavaPercent={display.lavaPercent}
                  ringSize={display.ringSize}
                  size={display.size}
                  planetSize={display.planetSize}
                  seed={display.seed}
                  propStyle={{ position: "absolute", top: 0 }}
                />
              </Suspense>
            ) : (
              <img
                src={`${svgBase + name}/${iconType}.svg`}
                alt={iconName}
                className="mt-[1.7em]"
                style={{
                  width: squareSize / 1.5 + "px",
                  height: squareSize / 1.5 + "px",
                  position: "absolute",
                  top: 0,
                  filter: display?.source?.properties?.tint
                    ? `drop-shadow(0 0 6px ${display.source.properties.tint})`
                    : undefined,
                }}
              />
            )}
          </div>

          {/* TOP – Coordinates */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10 text-xs lg:text-sm text-gray-100">
            <Crosshair
              size={mobile ? 14 : 20}
              onClick={recenter}
              className="inline mr-2 mb-1 cursor-pointer opacity-60"
            />
            {coordinatesPretty}
          </div>

          <div className="w-full flex flex-nowrap" style={{ height: `${squareSize}px` }}>
            {/* left */}
            <div
              className="w-full text-right p-0 lg:p-4 pb-5 flex flex-col-reverse"
              style={{ marginRight: `${Number(squareSize) + 10}px` }}
            >
              <div>
                {starNum === 2 && <Badge className="text-sm">binary</Badge>}
                {starNum === 3 && <Badge className="text-sm">trinary</Badge>}

                {typeof display?.source?.properties?.faction === "string" &&
                  display.source.properties.faction.split(",").map((f) => (
                    <Badge className="text-sm text-center mx-auto lg:mx-0" key={f.trim()}>
                      {f.trim()}
                    </Badge>
                  ))}

                {display?.source?.properties?.destroyed && (
                  <Badge variant="secondary" className="text-base">
                    Destroyed
                  </Badge>
                )}

                {display?.source?.properties?.unofficial && (
                  <Badge variant="destructive" className="text-base">
                    Unofficial
                  </Badge>
                )}
                {display?.source?.properties?.link && (
                  <Button variant="outline" size="icon" onClick={foundryClick}>
                    {(display?.source?.properties?.link.length === 29 && display?.source?.properties?.link.includes("JournalEntry.")) && (
                      <Book />
                    )}
                    {(display?.source?.properties?.link.length === 63 && display?.source?.properties?.link.includes(".JournalEntryPage.")) && (
                      <StickyNote />
                    )}
                    {display?.source?.properties?.link.includes("Macro.") && (
                      <Code />
                    )}
                    {display?.source?.properties?.link.includes("forien-quest-log.") && (
                      <MessageCircleWarning />
                    )}
                    {display?.source?.properties?.link.includes("Scene.") && (
                      <Drama />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* right */}
            {/* {(display?.source?._geometry?.type === "Point" && IS_GALAXY) &&
              <div className="w-full p-0 lg:p-4 pb-5">
                <div className="w-full h-full flex flex-col-reverse">
                  <div>
                    {typeof display.cloudPercent === "number" && (
                      <p>{(cloudPercent * 100).toFixed(0)}% cloud coverage</p>
                    )}

                    {typeof display.hydroPercent === "number" && (
                      <p>
                        {(
                          (display.type === "ice_planet"
                            ? 1 - (typeof display.icePercent === "number" ? display.icePercent : 0)
                            : display.hydroPercent) * 100
                        ).toFixed(0)}
                        % hydrosphere
                      </p>
                    )}

                    {typeof display.diameter === "number" && (
                      <p>
                        {display.diameter.toFixed(2)}{" "}
                        {display.type === "star" ? "solar radii" : "km"}
                      </p>
                    )}

                    {typeof display.temperature === "number" && display.type !== "star" && (
                      <p>{Math.floor(display.temperature)}°C</p>
                    )}

                    {typeof display.temperature === "number" && display.type === "star" && (
                      <p>{Math.floor(display.temperature) + 273}°K</p>
                    )}

                    {typeof display.dominantChemical === "string" &&
                      display.dominantChemical.length > 0 && (
                        <p>Dominant Chemical: {display.dominantChemical}</p>
                      )}

                    {typeof display.daysInYear === "number" && <p>{display.daysInYear} days/year</p>}
                    {typeof display.hoursInDay === "number" && <p>{display.hoursInDay} hours/day</p>}

                    {typeof display.gravity === "number" && (
                      <p>Gravity: {(display.gravity * 0.0010197162).toFixed(1)} g</p>
                    )}

                    {typeof display.pressure === "number" && display.pressure > 0 && (
                      <p>Pressure: {(display.pressure / 1000).toFixed(1)} bars</p>
                    )}

                    {Array.isArray(display.moons) && display.moons.length > 0 && (
                      <p>
                        {display.moons.length} moon{display.moons.length > 1 ? "s" : ""}
                      </p>
                    )}

                    {typeof display.modifier === "string" && display.modifier.length > 0 && (
                      <p>{display.modifier}</p>
                    )}

                    {display.isMoon && <p>Moon</p>}
                  </div>
                </div>
              </div>
            }*/}
          </div>

          {/* BOTTOM – Name/Type */}
          <div
            className="absolute left-1/2 flex transform -translate-x-1/2 items-center bg-[rgba(0, 0, 0, 0.75)]"
            style={{ top: `${Number(squareSize) - 5}px` }}
          >
            {!display.fake && !display.userCreated ? (
              <ExternalLink
                className="cursor-pointer me-1 opacity-60"
                size={mobile ? 14 : 19}
                onClick={() => window.open(genLink(d, name, "href"), "_blank")}
              />
            ) : null}

            {display?.source?.properties?.name || display.name}

            <span className="text-gray-400 ms-1">
              {" "}
              -{" "}
              {display.type === "star"
                ? display?.source?.properties?.starType || display.variant || "star"
                : String(display?.source?.properties?.type || display.type || "").replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {Array.isArray(local) && local.length > 0 && (
          <>
            <hr className="mt-6" />
            <DrawerDescription className="text-center text-xs md:text-sm my-2">
              {local.length} {GROUP_NAME}
            </DrawerDescription>

            {IS_GALAXY ? (
              <SolarSystem
                group={local}
                height={height}
                width={width}
                isGalaxy={IS_GALAXY}
                map={map}
                selectedId={selectedId}
                name={name}
                passedLocationClick={passedLocationClick}
                d={d}
              />
            ) : (
              <LocationSystem
                group={local}
                map={map}
                selectedId={selectedId}
                name={name}
                passedLocationClick={passedLocationClick}
              />
            )}
          </>
        )}

        {display?.description ||
        display?.source?.properties?.description ||
        display?.source?.properties?.locations ? (
          <>
            <hr className="my-2" />
            <div className="max-w-3xl mx-auto px-4 overflow-auto mb-28">
              <DrawerHeader className="m-0 p-0 mt-1 mb-3">
                <DrawerTitle className="text-xl font-bold text-center">
                  <span className="text-gray-500 text-sm"> drawer can be pulled up</span>
                </DrawerTitle>
              </DrawerHeader>

              {display?.source?.properties?.locations ? (
                <>
                  <p className="text-base lg:text-lg leading-relaxed break-words">
                    <b>Locations:</b>{" "}
                    <span className="text-md">{display.source.properties.locations}</span>
                  </p>
                  <hr className="my-2" />
                </>
              ) : null}

              <p className="text-base lg:text-lg leading-relaxed break-words select-text">
                {display?.description || display?.source?.properties?.description}
              </p>
            </div>
          </>
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}
