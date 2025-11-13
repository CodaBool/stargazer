import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge.jsx";
import Link from "next/link";
import { genLink, gridHelpers, svgBase } from "@/lib/utils.js";
import { useMap } from "@vis.gl/react-maplibre";
import SolarSystemDiagram from "./solarSystem.jsx";
import LocationSystem from "./locationSystem.jsx";
import seedrandom from "seedrandom";
import { Crosshair, ExternalLink } from "lucide-react";
import ThreejsPlanet, { availableThreejsModels } from "./threejsPlanet";

const MAX_GEN_LOCATIONS = 8;
let sharedRenderer = null;
let sharedCanvas = null;

export default function DrawerComponent({
  drawerContent,
  setDrawerContent,
  IS_GALAXY,
  coordinates,
  GENERATE_LOCATIONS,
  name,
  height,
  selectedId,
  mobile,
  d,
  myGroup,
  passedLocationClick,
  GEO_EDIT,
  GRID_DENSITY,
}) {
  const { map } = useMap();
  const GROUP_NAME = IS_GALAXY ? "Celestial Bodies" : "Nearby Locations";

  const [squareSize, setSquareSize] = useState();
  const [display, setDisplay] = useState(fillMissingData(d));

  useEffect(() => {
    // move editor table
    const el = document.querySelector(".editor-table");
    if (el) {
      if (drawerContent) {
        el.style.bottom = "40%";
      } else {
        el.style.bottom = "20px";
      }
    }

    // move the hamburger + zoom controls if on a small screen
    const hamburger = document.querySelector(".hamburger");
    const zoomControls = document.querySelector(".zoom-controls");
    if (hamburger && zoomControls && window.innerWidth < 1200) {
      if (drawerContent) {
        hamburger.style.bottom = "45%";
        zoomControls.style.bottom = "55%";
      } else if (!drawerContent) {
        hamburger.style.bottom = "0.5em";
        zoomControls.style.bottom = "7em";
      }
    } else if (hamburger && zoomControls && window.innerWidth > 1200) {
      if (hamburger.style.bottom === "0.5em") {
        hamburger.style.removeProperty("bottom");
        zoomControls.style.removeProperty("bottom");
      }
    }
  }, [drawerContent]);

  useEffect(() => {
    setDisplay(fillMissingData(d));
  }, [d]);

  useEffect(() => {
    const updateSize = () => {
      const vmin = Math.min(window.innerWidth, window.innerHeight);
      if (IS_GALAXY) {
        setSquareSize(Math.min(250, vmin * 0.3));
      } else {
        setSquareSize(Math.min(120, vmin * 0.3));
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  if (!coordinates || !d) return null;

  let local = myGroup;
  if (GENERATE_LOCATIONS && d.geometry.type === "Point") {
    local = generateLocations(myGroup, d);
  }

  function recenter() {
    // duplicate of what's in map.jsx pan
    // this is to compensate for drawer size and raise the flyto coordinates
    const arbitraryNumber = 9;
    let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom());
    zoomFactor = Math.max(zoomFactor, 4);
    const latDiff =
      (map.getBounds().getNorth() - map.getBounds().getSouth()) / zoomFactor;
    let lat = coordinates[1] - latDiff / 2;

    map.flyTo({ center: [coordinates[0], lat], duration: 800 });
    map.setFeatureState({ source: "source", id: selectedId }, { hover: true });
    setTimeout(() => {
      map.setFeatureState(
        { source: "source", id: selectedId },
        { hover: false },
      );
    }, 400);
  }

  if (!display || GEO_EDIT) return null;

  let coordinatesPretty = `${coordinates[1].toFixed(2)}, ${coordinates[0].toFixed(2)}`;
  if (IS_GALAXY) {
    const { coordFromLngLat } = gridHelpers(name, GRID_DENSITY);
    coordinatesPretty = coordFromLngLat(coordinates[0], coordinates[1]).cell
      .label;
  }

  const starNum = display.source?.properties?.starType?.split(",").length;

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
            {IS_GALAXY ? (
              availableThreejsModels.includes(display.type) ? (
                <Suspense fallback={<div></div>}>
                  <ThreejsPlanet
                    sharedCanvas={sharedCanvas}
                    sharedRenderer={sharedRenderer}
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
                  src={`${svgBase + name}/${display.source.properties.type}.svg`}
                  alt={display.source.properties.name}
                  className="mt-[1.7em]"
                  style={{
                    width: squareSize / 1.5 + "px",
                    height: squareSize / 1.5 + "px",
                    position: "absolute",
                    top: 0,
                    filter: display.source.properties.tint
                      ? `drop-shadow(0 0 6px ${display.source.properties.tint})`
                      : undefined,
                  }}
                />
              )
            ) : (
              <img
                src={`${svgBase + name}/${display.source.properties.type}.svg`}
                alt={display.source.properties.name}
                className="mt-[1.7em]"
                style={{
                  width: squareSize / 1.5 + "px",
                  height: squareSize / 1.5 + "px",
                  position: "absolute",
                  top: 0,
                  filter: display.source.properties.tint
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

          <div
            className="w-full flex flex-nowrap"
            style={{ height: `${squareSize}px` }}
          >
            {/* left */}
            <div
              className="w-full text-right p-0 lg:p-4 pb-5 flex flex-col-reverse"
              style={{
                marginRight: `${(Number(squareSize) + 10).toString()}px`,
              }}
            >
              <div>
                {starNum === 2 && <Badge className="text-sm">binary</Badge>}
                {starNum === 3 && <Badge className="text-sm">trinary</Badge>}
                {display.source.properties.faction &&
                  display.source.properties.faction.split(",").map(f => (
                    <Badge
                      className="text-sm text-center mx-auto lg:mx-0"
                      key={f}
                    >
                      {f}
                    </Badge>
                  ))}
                {display.source.properties.destroyed && (
                  <Badge variant="secondary" className="text-base">
                    Destroyed
                  </Badge>
                )}
                {display.source.properties.unofficial && (
                  <Badge variant="destructive" className="text-base">
                    Unofficial
                  </Badge>
                )}
              </div>
            </div>

            {/* right */}

            <div className="w-full p-0 lg:p-4 pb-5">
              <div className="w-full h-full flex flex-col-reverse">
                <div>
                  {typeof display.cloudPercent === "number" && <p>{cloudPercent.toFixed(2) * 100}% cloud coverage</p>}
                  {typeof display.hyrdoPercent === "number" && <p>{(display.type === "ice_planet" ? (1 - display.icePercent) : display.hyrdoPercent).toFixed(2) * 100}% hydrosphere</p>}
                  {typeof display.icePercent === "number" && display.type === "ice_planet" && <p>{((1-display.hyrdoPercent) * 100).toFixed(1)}% ice coverage</p>}
                  {typeof display.radius === "number" && <p>{display.radius.toFixed(2)} {display.type === "star" ? "solar radii" : "km radius"}</p>}
                  {(typeof display.temperature === "number" && display.type !== "star") && <p>{Math.floor(display.temperature)}°C</p>}
                  {(typeof display.temperature === "number" && display.type === "star") && <p>{Math.floor(display.temperature) + 273}°K</p>}
                  {typeof display.dominantChemical === "string" && <p>Dominant Chemical: {display.dominantChemical}</p>}
                  {typeof display.daysInYear === "number" && <p>{display.daysInYear} days/year</p>}
                  {typeof display.hoursInDay === "number" && <p>{display.hoursInDay} hours/day</p>}
                  {typeof display.gravity === "number" && <p>Gravity: {(display.gravity * 0.0010197162).toFixed(1)} g</p>}
                  {typeof display.pressure === "number" && display.pressure > 0 && <p>Pressure: {(display.pressure / 1000).toFixed(1)} bars</p>}
                  {Array.isArray(display.moons) && display.moons.length > 0 && <p>{display.moons.length} moon{display.moons.length > 1 ? "s" : ""}</p>}
                  {typeof display.modifier === "string" && <p>{display.modifier}</p>}
                  {display.isMoon && <p>Moon</p>}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM – Name/Type */}
          <div
            className={`absolute left-1/2 flex transform -translate-x-1/2 items-center bg-[rgba(0, 0, 0, 0.75)]`}
            style={{ top: `${(Number(squareSize) - 5).toString()}px` }}
          >
            <Link
              href={genLink(display.source, name, "href")}
              className="opacity-60"
              target={name === "lancer" ? "_self" : "_blank"}
            >
              <ExternalLink
                className="cursor-pointer me-1"
                size={mobile ? 14 : 19}
              />
            </Link>
            {display.source.properties.name}
            <span className="text-gray-400  ms-1">
              {" "}
              -{" "}
              {display.type === "star"
                ? display.source.properties.starType || `${display.variant}`
                : display.source.properties.type.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {local.length > 0 && (
          <>
            <hr className="mt-6" />
            <DrawerDescription className="text-center text-xs md:text-sm my-2">
              {local.length} {GROUP_NAME}
            </DrawerDescription>
            {IS_GALAXY ? (
              <SolarSystemDiagram
                group={local}
                height={height}
                isGalaxy={IS_GALAXY}
                map={map}
                selectedId={selectedId}
                name={name}
                passedLocationClick={passedLocationClick}
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

        {(display.source.properties.description ||
          display.source.properties.locations) && (
          <>
            <hr className="my-2" />
            <div className="max-w-3xl mx-auto px-4 overflow-auto mb-28">
              <DrawerHeader className="m-0 p-0 mt-1 mb-3">
                <DrawerTitle className="text-xl font-bold text-center">
                  <span className="text-gray-500 text-sm">
                    {" "}
                    drawer can be pulled up
                  </span>
                </DrawerTitle>
              </DrawerHeader>
              {display.source.properties.locations && (
                <>
                  <p className="text-base lg:text-lg leading-relaxed break-words">
                    <b>Locations:</b>{" "}
                    <span className="text-md">
                      {display.source.properties.locations}
                    </span>
                  </p>
                  <hr className="my-2" />
                </>
              )}
              <p className="text-base lg:text-lg leading-relaxed break-words">
                {display.source.properties.description}
              </p>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// [{
//   geometry
//   id
//   groupCenter: [lng, lat]
//   properties
// }]
function generateLocations(group, location) {
  const seed = genSeed(location);
  const rng = seedrandom(seed);
  const random = () => rng();

  const numToGen =
    Math.floor(range(random, [1, MAX_GEN_LOCATIONS])) - group.length;
  const locations = [];
  const g = group.find(l => !!l.groupCenter);

  // always have a star
  const groupHasStar =
    group.find(l => l.properties.type === "star") ||
    location.properties.type === "star";
  if (!groupHasStar) {
    locations.push(generateStar(seed, null, g?.groupCenter));
  }

  for (const location of group) {
    const type = location.properties.type;

    // If the star is already accounted for, include it too.
    let planetSize = 1;
    // console.log("planet", location)

    if (type === "gate" || type === "station") {
      planetSize = 2.5;
    } else if (type === "star") {
      // make dwarf stars small on the canvas
      // console.log("planet size", location.radius)
      planetSize = location.radius < 1 ? 12 : 1;
    }

    locations.push({
      name: location.properties.name,
      type,
      planetSize,
      tint: tintMap[type] || "gray",
      source: location,
      groupCenter: g?.groupCenter,
    });
  }

  for (let i = 0; i < numToGen; i++) {
    console.log("gen", i, generateLocation(seed + i))
    locations.push({
      groupCenter: g?.groupCenter,
      ...generateLocation(seed + i),
    });
  }

  return locations;
}
function fillMissingData(d) {
  if (!d) return;
  let starData = {};
  if (d.properties.type === "star") {
    starData = generateStar(genSeed(d), d);
  }

  if (d.properties.type === "gate" || d.properties.type === "station") {
    starData.planetSize = 1.1;
  }


  // if (d.properties.hyrdoPercent) {
  //   starData.hyrdoPercent = d.properties.hyrdoPercent;
  // }
  // if (d.properties.cloudPercent) {
  //   starData.cloudPercent = d.properties.cloudPercent;
  // }

  // pixels
  // baseColors
  // featureColors
  // layerColors
  // atmosphereColors
  // schemeColor
  // cloudPercent
  // ringSize
  // hyrdoPercent
  // lavaPercent
  // seed
  // planetSize


  console.log("return", "name", d.properties.name, {
    ...starData,
    ...d.properties,
    planetSize: starData?.planetSize || 1,
    tint: "gray",
    source: d,
  })

  return {
    ...starData,
    ...d.properties,
    // name: d.properties.name,
    // type: d.properties.type,
    planetSize: starData?.planetSize || 1,
    tint: "gray",
    source: d,
  };
}

function genSeed(d) {
  return `${d.properties.name}_${d.geometry.coordinates.map(c => c.toString()).join(",")}`;
}

const tintMap = {
  "ice_planet": "blue",
  terrestrial: "green",
  jovian: "brown",
  "lava_planet": "red",
  "desert_planet": "yellow",
  "ocean_planet": "blue",
  gate: "purple",
  // "neutron": "blue",
  blue: "blue",
  orange: "orange",
  red: "red",
  white: "white",
  yellow: "yellow",
  "orange dwarf": "orange",
  "red dwarf": "red",
  "white dwarf": "white",
  "yellow dwarf": "yellow",
  "blue giant": "blue",
  "orange giant": "orange",
  "red giant": "red",
  "yellow giant": "yellow",
};

function generateStar(seed, location, groupCenter) {
  const rng = seedrandom(seed);
  const random = () => rng();

  // these numbers were pulled from my butt
  const weightedTypes = [
    {
      type: "star",
      variant: "blue",
      chance: 3,
      scheme: "blue",
      baseColor: "4753fc",
    },
    {
      type: "star",
      variant: "orange",
      chance: 5,
      scheme: "orange",
      baseColor: "fc8c03",
    },
    {
      type: "star",
      variant: "red",
      chance: 6,
      scheme: "red",
      baseColor: "c20000",
    },
    {
      type: "star",
      variant: "white",
      chance: 3,
      scheme: "white",
      baseColor: "b3b3b3",
    },
    {
      type: "star",
      variant: "yellow",
      chance: 4,
      scheme: "yellow",
      baseColor: "ffeb91",
    },
    {
      type: "star",
      variant: "blue giant",
      chance: 3,
      scheme: "blue",
      baseColor: "4753fc",
    },
    {
      type: "star",
      variant: "orange giant",
      chance: 5,
      scheme: "orange",
      baseColor: "fc8c03",
    },
    {
      type: "star",
      variant: "red giant",
      chance: 12,
      scheme: "red",
      baseColor: "c20000",
    },
    {
      type: "star",
      variant: "yellow giant",
      chance: 4,
      scheme: "yellow",
      baseColor: "ffeb91",
    },
    {
      type: "star",
      variant: "orange dwarf",
      chance: 10,
      scheme: "orange",
      baseColor: "fc8c03",
    },
    {
      type: "star",
      variant: "red dwarf",
      chance: 27,
      scheme: "red",
      baseColor: "c20000",
    },
    {
      type: "star",
      variant: "white dwarf",
      chance: 8,
      scheme: "white",
      baseColor: "b3b3b3",
    },
    {
      type: "star",
      variant: "yellow dwarf",
      chance: 10,
      scheme: "yellow",
      baseColor: "ffeb91",
    },
  ];

  const totalChance = weightedTypes.reduce((sum, item) => sum + item.chance, 0);
  let cumulativeChance = 0;
  const cumulativeWeights = weightedTypes.map(item => {
    cumulativeChance += item.chance / totalChance;
    return { ...item, cumulativeChance };
  });

  const rand = random();
  let star;
  // console.log("location", location)
  if (location?.properties?.starType) {
    const starType = location.properties.starType.includes(",")
      ? location.properties.starType.split(",")[0].trim()
      : location.properties.starType;
    star = weightedTypes.find(item => item.variant === starType);
  } else {
    star = cumulativeWeights.find(item => rand <= item.cumulativeChance);
  }

  // console.log("star", star)

  let radius;
  if (location?.properties?.radius) {
    radius = location.radius;
  } else {
    radius = range(random, planetData[star.variant].radius);
  }

  // const clampedRadius = Math.min(Math.max(radius, 0), 1500); // Clamp 0–1500

  let planetSize = 1.2;
  if (star.variant.includes("dwarf")) {
    planetSize = 3;
  } else if (star.variant.includes("giant")) {
    planetSize = 0.9;
  }

  return {
    type: "star",
    radius,
    variant: star.variant,
    groupCenter: groupCenter,
    planetSize,
    source: location,
    tint: tintMap[star.variant],
    schemeColor: star.scheme,
    baseColors: star.baseColor,
    temperature: range(random, planetData[star.variant].temperature || [0, 0]),
  };
}

function generateLocation(seed, isMoon) {
  const rng = seedrandom(seed);
  const random = () => rng();

  const types = [
    "barren_planet",
    "ice_planet",
    "terrestrial",
    "jovian",
    "lava_planet",
    "desert_planet",
    "ocean_planet",
    "dwarf",
    "supermassive",
    "asteroid",
  ];
  const rand = random();
  let type,
    ringed,
    sizeMod = 1;
  if (isMoon) {
    const moonTypes = [
      "barren_planet",
      "ice_planet",
      "terrestrial",
      "lava_planet",
      "desert_planet",
      "ocean_planet",
      "asteroid",
    ];
    type = moonTypes[Math.floor(rand * moonTypes.length)];
    sizeMod = 0.3;
  } else {
    type = types[Math.floor(rand * types.length)];
  }

  const sub = (Math.floor(Math.abs(rand) * 100) % 10) / 10;
  if (type === "dwarf") {
    const dwarf = ["barren_planet", "ice_planet"];
    const subIndex = Math.floor(sub * dwarf.length);
    type = dwarf[subIndex];
    sizeMod = 0.5;
  } else if (type === "supermassive") {
    const supermassive = [
      "ice_planet",
      "terrestrial",
      "jovian",
      "lava_planet",
      "desert_planet",
      "ocean_planet",
    ];
    const subIndex = Math.floor(sub * supermassive.length);
    type = supermassive[subIndex];
    sizeMod = 2;
  } else if (type === "asteroid") {
    const size = Math.floor(range(random, planetData[type].radius));
    return {
      type,
      radius: size,
      size: 1 + (size / planetData[type].radius[1]) * 8,
      planetSize: 0.9,
      daysInYear: Math.floor(range(random, planetData[type].year)),
      dominantChemical: pickWeightedChemical(type, random),
    };
  }

  const radius = Math.floor(range(random, planetData[type].radius)) * sizeMod;
  if (type === "jovian") ringed = checkRings(radius, random);

  let planetSize;
  if (radius < 4000) {
    planetSize = 2.6;
  } else if (radius < 5000) {
    planetSize = 1.6;
  } else if (radius < 10000) {
    planetSize = 1.4;
  } else {
    planetSize = 1.2;
  }
  if (type === "station" || type === "gate" || type === "asteroid") {
    planetSize = 1.5;
  }
  if (type === "ice_planet") {
    planetSize = 1.5;
  }
  if (type === "ice_planet") {
    console.log("gen for ice", range(random, planetData[type].hyrdoPercent))
  }
  const hydroPercent = range(random, planetData[type].hyrdoPercent || [0, 0])

  return {
    type,
    radius,
    ringed,
    planetSize,
    tint: tintMap[type] || "gray",
    gravity: Math.floor(range(random, planetData[type].gravity || [0, 0])),
    pressure: Math.floor(range(random, planetData[type].pressure || [0, 0])),
    temperature: Math.floor(
      range(random, planetData[type].temperature || [0, 0]),
    ),
    daysInYear: Math.floor(range(random, planetData[type].year || [0, 0])),
    hoursInDay: Math.floor(range(random, planetData[type].day || [0, 0])),
    // used for lava on lava planet, and land for terrestrial
    hydroPercent,
    lavaPercent: range(random, planetData[type].lavaPercent || [0, 0]),
    cloudPercent: range(random, planetData[type].cloudPercent || [0, 0]),
    ringSize: range(random, planetData[type].ringSize || [0, 0]),
    icePercent: type === "ice_planet" ? 1-hydroPercent : range(random, planetData[type].icePercent || [0, 0]),
    dominantChemical: pickWeightedChemical(type, random),
    moons: isMoon ? [] : generateMoons(radius, random, seed),
    modifier:
      sizeMod !== 1
        ? sizeMod === 2
          ? "supermassive"
          : sizeMod === 0.5
            ? "dwarf"
            : "moon"
        : "",
    isMoon: !!isMoon,
  };
}

function generateMoons(radius, random, seed) {
  const moonData = [];
  if (radius < 4000) return moonData;
  let moons = 0;
  let extraRadius = radius - 4000;
  while (extraRadius > 0 && moons < 100) {
    if (random() < 0.5) moons++;
    extraRadius -= 1000;
  }
  for (let i = 0; i < moons; i++) {
    moonData.push(generateLocation(seed + i, true));
  }
  return moonData;
}

function checkRings(radius, random) {
  if (radius < 10000) return false;
  // const chance = 1 + (radius - 10000) / 200000
  const chance = 0.2 + (radius - 10000) / 200000;
  const subChance = (Math.floor(Math.abs(random()) * 100) % 10) / 10;
  return subChance < chance;
}

// TODO: go back and add fluff data like ice to desert planet
// Planet data structure
const planetData = {
  "barren_planet": {
    gravity: [90, 1050],
    pressure: [0, 1],
    temperature: [-200, 350],
    radius: [800, 8000],
    year: [60, 130000],
    day: [250, 125000],
    icePercent: [0, .3],
    chemical: ["iron", "silicate", "carbon", "sulfur", "oxygen"],
  },
  "ice_planet": {
    gravity: [300, 1320],
    pressure: [7, 5802],
    temperature: [-250, -14],
    radius: [4200, 11000],
    year: [250, 125000],
    day: [12, 60],
    cloudPercent: [0.2, 0.6],
    hyrdoPercent: [0.3, 0.7],
    chemical: ["ammonia", "methane", "oxygen", "carbon", "nitrogen", "sulfur"],
  },
  terrestrial: {
    gravity: [600, 1400],
    pressure: [78, 5820],
    temperature: [1, 30],
    radius: [4224, 8382],
    year: [290, 800],
    day: [13, 40],
    cloudPercent: [0.3, 0.6],
    hyrdoPercent: [0.9, 0.99],
    icePercent: [0, .1], // flavor
    chemical: [
      "silicate",
      "iron",
      "oxygen",
      "carbon",
      "nitrogen",
      "sulfur",
      "hydrogen",
      "helium",
    ],
  },
  jovian: {
    gravity: [500, 1800],
    pressure: [1000, 200000],
    temperature: [-160, 1200],
    radius: [7800, 120000],
    year: [600, 98000],
    day: [5, 30],
    ringSize: [0, 0.2],
    chemical: [
      "hydrogen",
      "helium",
      "methane",
      "ammonia",
      "sulfur",
      "carbon",
      "oxygen",
    ],
  },
  "lava_planet": {
    gravity: [1000, 2400],
    pressure: [500, 100000],
    temperature: [400, 3000],
    radius: [4000, 9000],
    year: [200, 1000],
    day: [10, 35],
    lavaPercent: [0.5, 0.6],
    chemical: ["oxygen", "iron", "silicate", "sulfur", "carbon", "hydrogen"],
  },
  "desert_planet": {
    gravity: [700, 1600],
    pressure: [50, 2000],
    temperature: [30, 90],
    radius: [4000, 9000],
    year: [300, 3000],
    day: [20, 50],
    hyrdoPercent: [0, 0.1], // flavor
    icePercent: [0, 0.2], // flavor
    chemical: ["silicate", "oxygen", "iron", "carbon", "sulfur"],
  },
  "ocean_planet": {
    gravity: [800, 1600],
    pressure: [500, 3000],
    temperature: [-10, 40],
    radius: [5000, 10000],
    year: [250, 1000],
    day: [12, 30],
    hyrdoPercent: [0.6, 0.95],
    cloudPercent: [0.25, 0.7],
    icePercent: [0,.3], // flavor
    chemical: [
      "oxygen",
      "hydrogen",
      "carbon",
      "nitrogen",
      "ammonia",
      "methane",
      "sulfur",
      "iron",
    ],
  },
  asteroid: {
    radius: [10, 500],
    year: [150, 8000],
    chemical: [
      "oxygen",
      "hydrogen",
      "carbon",
      "nitrogen",
      "silicate",
      "methane",
      "sulfur",
      "iron",
      "copper",
    ],
  },
  gate: {
    radius: [200, 400],
  },
  station: {
    radius: [10, 500],
    year: [150, 10000],
  },
  "red dwarf": {
    temperature: [2500, 4000],
    radius: [0.1, 0.5],
  },
  "orange dwarf": {
    temperature: [3900, 5200],
    radius: [0.7, 0.96],
  },
  "yellow dwarf": {
    temperature: [5300, 6000],
    radius: [0.8, 1.15],
  },
  "white dwarf": {
    temperature: [4000, 150000],
    radius: [0.008, 0.02],
  },
  "red giant": {
    temperature: [2200, 3200],
    radius: [100, 200],
  },
  "orange giant": {
    temperature: [3500, 5000],
    radius: [10, 100],
  },
  "yellow giant": {
    temperature: [5000, 7000],
    radius: [30, 1000],
  },
  "blue giant": {
    temperature: [10000, 50000],
    radius: [2, 25],
  },
  red: {
    temperature: [2500, 4000],
    radius: [0.6, 1.0],
  },
  orange: {
    temperature: [3700, 5200],
    radius: [0.7, 0.9],
  },
  yellow: {
    temperature: [5000, 6000],
    radius: [0.8, 1.2],
  },
  white: {
    temperature: [7500, 10000],
    radius: [0.8, 1.3],
  },
  blue: {
    temperature: [10000, 50000],
    radius: [1.8, 6.6],
  },
};

function range(rng, [min, max]) {
  return +(rng() * (max - min) + min).toFixed(2);
}

export function pickWeightedChemical(type, rng) {
  const options = planetData[type].chemical || [0, 0];
  return options[Math.floor(rng() * options.length)];
}
