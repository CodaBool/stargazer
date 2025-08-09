import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useEffect } from "react"
import { Button } from "./ui/button"
import { Badge } from '@/components/ui/badge.jsx'
import Link from "next/link"
import { genLink, svgBase } from "@/lib/utils.js"
import { useMap } from '@vis.gl/react-maplibre'
import SolarSystemDiagram from "./solarSystem.jsx"
import LocationSystem from "./locationSystem.jsx"
import seedrandom from 'seedrandom'
import { Crosshair, Link as LinkIcon } from "lucide-react"

const MAX_GEN_LOCATIONS = 8

export default function DrawerComponent({ drawerContent, setDrawerContent, IS_GALAXY, coordinates, GENERATE_LOCATIONS, name, height, selectedId, mobile, d, myGroup }) {
  const { map } = useMap()
  const GROUP_NAME = IS_GALAXY ? "Celestial Bodies" : "Locations"

  useEffect(() => {
    // move editor table
    const el = document.querySelector(".editor-table")
    if (el) {
      if (drawerContent) {
        el.style.bottom = "40%"
      } else {
        el.style.bottom = "20px"
      }
    }

    // move the hamburger + zoom controls if on a small screen
    const hamburger = document.querySelector(".hamburger")
    const zoomControls = document.querySelector(".zoom-controls")
    if (hamburger && zoomControls && window.innerWidth < 1200) {
      if (drawerContent) {
        hamburger.style.bottom = "45%"
        zoomControls.style.bottom = "55%"
      } else if (!drawerContent) {
        hamburger.style.bottom = "0.5em"
        zoomControls.style.bottom = "7em"
      }
    } else if (hamburger && zoomControls && window.innerWidth > 1200) {
      if (hamburger.style.bottom === "0.5em") {
        hamburger.style.removeProperty("bottom")
        zoomControls.style.removeProperty("bottom")
      }
    }
  }, [drawerContent])

  if (!coordinates || !d) return null

  // console.log("drawer", myGroup, d)
  let local = myGroup
  if (GENERATE_LOCATIONS) {
    local = generateLocations(myGroup, coordinates, d)
  }
  const target = fillMissingData(d)

  function recenter() {
    map.easeTo({ center: coordinates, duration: 800 })
    map.setFeatureState(
      { source: 'source', id: selectedId },
      { hover: true }
    )
    setTimeout(() => {
      map.setFeatureState(
        { source: 'source', id: selectedId },
        { hover: false }
      )
    }, 400)
  }

  return (
    <Drawer
      open={!!drawerContent}
      onOpenChange={() => setDrawerContent(null)}
      modal={false}
      snapPoints={[0.4, 0.6]}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center" asChild>
            <div>
              <p className="text-gray-400">
                <Crosshair size={mobile ? 14 : 20} onClick={() => recenter()} className="inline mr-2 mb-1 cursor-pointer opacity-60" />
                {`${Math.floor(coordinates[1])},${Math.floor(coordinates[0])}`}
              </p>
              <div className="flex justify-center mt-2">
                <Link href={genLink(target.source, name, "href")} className="block w-6 opacity-60" target={`${name === "lancer" ? "_self" : "_blank"}`}>
                  <LinkIcon className="cursor-pointer" size={mobile ? 14 : 19} />
                </Link>
                {target.source.properties.name} <span className=" text-gray-400">- {target.source.properties.type}</span>
              </div>
            </div>
          </DrawerTitle>
        </DrawerHeader>

        <div className="min-w-64 p-2">
          <div className="flex justify-center w-full">
            <img src={`${svgBase + name + "/" + target.source.properties.type + '.svg'}`} alt={target.source.properties.type} width="70px" height="70px" align="left" />



          </div>
          {target.source.properties.description &&
            <div className="max-w-prose mx-auto px-4 text-sm m-4">
              <p className="text-justify">
                {target.source.properties.description}
              </p>
            </div>
          }

          <div className="flex flex-col items-center">
            {target.source.properties.unofficial && <Badge variant="destructive" className="mx-auto">Unofficial</Badge>}
            {target.source.properties.faction && <Badge variant="secondary" className="mx-auto">{target.source.properties.faction}</Badge>}
            {target.source.properties.destroyed && <Badge variant="secondary" className="mx-auto">Destroyed</Badge>}
          </div>
        </div>
        {myGroup.length > 0 ? (
          <>
            <hr className="my-4" />
            <DrawerDescription className="text-center text-xs md:text-sm mb-2" >{local.length} Nearby {GROUP_NAME}</DrawerDescription>
            {IS_GALAXY
              ? <SolarSystemDiagram group={local} height={height} isGalaxy={IS_GALAXY} map={map} selectedId={selectedId} name={name} />
              : <LocationSystem group={local} map={map} selectedId={selectedId} name={name} />
            }
          </>
        )
          :
          IS_GALAXY &&
          <>
            <hr className="my-4" />
            <DrawerDescription className="text-center text-xs md:text-sm mb-2" >{local.length} Nearby {GROUP_NAME}</DrawerDescription>
            {IS_GALAXY
              ? <SolarSystemDiagram group={local} height={height} isGalaxy={IS_GALAXY} map={map} selectedId={selectedId} name={name} />
              : <LocationSystem group={local} map={map} selectedId={selectedId} name={name} />
            }
          </>
        }
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer >
  )
}

// [{
//   geometry
//   id
//   groupCenter: [lng, lat]
//   properties
// }]
function generateLocations(group, coordinates, location) {
  const seed = coordinates.toString()
  const rng = seedrandom(seed)
  const random = () => rng()

  const numToGen = Math.floor(range(random, [1, MAX_GEN_LOCATIONS])) - group.length
  const locations = []
  const g = group.find(l => !!l.groupCenter)

  // always have a star
  const groupHasStar = group.find(l => l.properties.type === "star") || location.properties.type === "star"
  if (!groupHasStar) {
    locations.push(generateStar(seed, null, g?.groupCenter))
  }

  for (const location of group) {
    const type = location.properties.type
    if (type === "star") continue
    let planetSize = 1
    if (type === "gate" || type === "station") {
      planetSize = 2.5
    }
    locations.push({
      name: location.properties.name,
      type,
      planetSize,
      tint: "gray",
      source: location,
      groupCenter: g?.groupCenter,
    })
  }

  for (let i = 0; i < numToGen; i++) {
    locations.push({
      groupCenter: g?.groupCenter,
      ...generateLocation(seed + i)
    })
  }

  // console.log("locations", locations)

  return locations
}
function fillMissingData(d) {
  const seed = d.geometry.coordinates.toString()
  const rng = seedrandom(seed)
  const random = () => rng()

  let starData
  if (d.properties.type === "star") {
    starData = generateStar(seed + `${d?.properties.name || ""}`, d)
  }

  let planetSize = 1
  if (d.properties.type === "gate" || d.properties.type === "station") {
    planetSize = 2.5
  }
  return {
    ...starData,
    name: d.properties.name,
    type: d.properties.type,
    planetSize,
    tint: "gray",
    source: d,
  }
}

const tintMap = {
  ice_planet: "blue",
  terrestrial: "green",
  jovian: "brown",
  lava_planet: "red",
  desert_planet: "yellow",
  ocean_planet: "blue",
  gate: "purple",
  "red dwarf": "red",
  "white dwarf": "white",
  "red giant": "red",
  "red supergiant": "red",
  "blue giant": "blue",
  "blue supergiant": "blue",
  // "neutron": "blue",
  "red": "red",
  "blue": "blue",
  "orange": "orange",
  "yellow": "yellow",
}

function generateStar(seed, location, groupCenter) {
  const rng = seedrandom(seed);
  const random = () => rng();

  const weightedTypes = [
    { type: 'star', variant: 'red dwarf', chance: 50, scheme: "red", baseColor: "c20000" },
    { type: 'star', variant: 'orange', chance: 5, scheme: "orange", baseColor: "fc8c03" },
    { type: 'star', variant: 'yellow', chance: 5, scheme: "yellow", baseColor: "ffeb91" },
    { type: 'star', variant: 'white dwarf', chance: 10, scheme: "white", baseColor: "b3b3b3" },
    { type: 'star', variant: 'red giant', chance: 5, scheme: "red", baseColor: "c20000" },
    { type: 'star', variant: 'red supergiant', chance: 4, scheme: "red", baseColor: "c20000" },
    { type: 'star', variant: 'blue giant', chance: 5, scheme: "blue", baseColor: "4753fc" },
    { type: 'star', variant: 'blue supergiant', chance: 3, scheme: "blue", baseColor: "4753fc" },
    { type: 'star', variant: 'red', chance: 5, scheme: "red", baseColor: "c20000" },
    { type: 'star', variant: 'blue', chance: 5, scheme: "blue", baseColor: "4753fc" },
  ];

  const totalChance = weightedTypes.reduce((sum, item) => sum + item.chance, 0);
  let cumulativeChance = 0;
  const cumulativeWeights = weightedTypes.map(item => {
    cumulativeChance += item.chance / totalChance;
    return { ...item, cumulativeChance };
  });

  const rand = random()
  let star
  console.log("generate star", location)
  if (location?.starType) {
    star = weightedTypes.find(item => item.variant === location.starType)
  } else {
    star = cumulativeWeights.find(item => rand <= item.cumulativeChance)
  }

  let radius
  if (location?.radius) {
    radius = location.radius
  } else {
    radius = range(random, planetData[star.variant].radius)
  }

  const clampedRadius = Math.min(Math.max(radius, 0), 1500); // Clamp 0–1500

  // Custom size band mapping
  let planetSize;
  if (clampedRadius < 0.5) {
    planetSize = 4
    if (star.variant === "white dwarf") {
      planetSize = 12
    }
  } else if (clampedRadius < 1) {
    planetSize = 3;
  } else if (clampedRadius < 5) {
    planetSize = 2;
  } else {
    planetSize = 1;
  }

  return {
    type: 'star',
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
  const rng = seedrandom(seed)
  const random = () => rng()

  const types = ['barren_planet', 'ice_planet', 'terrestrial', 'jovian', 'lava_planet', 'desert_planet', 'ocean_planet', 'dwarf', 'supermassive', 'asteroid']
  const rand = random()
  let type, ringed, sizeMod = 1
  if (isMoon) {
    const moonTypes = ['barren_planet', 'ice_planet', 'terrestrial', 'lava_planet', 'desert_planet', 'ocean_planet', 'asteroid']
    type = moonTypes[Math.floor(rand * moonTypes.length)]
    sizeMod = 0.3
  } else {
    type = types[Math.floor(rand * types.length)]
  }

  const sub = (Math.floor(Math.abs(rand) * 100) % 10) / 10
  if (type === "dwarf") {
    const dwarf = ["barren_planet", "ice_planet"];
    const subIndex = Math.floor(sub * dwarf.length)
    type = dwarf[subIndex]
    sizeMod = 0.5
  } else if (type === "supermassive") {
    const supermassive = ["ice_planet", "terrestrial", "jovian", "lava_planet", "desert_planet", "ocean_planet"];
    const subIndex = Math.floor(sub * supermassive.length);
    type = supermassive[subIndex]
    sizeMod = 2
  } else if (type === "asteroid") {
    const size = Math.floor(range(random, planetData[type].radius))
    return {
      type,
      radius: size,
      size: 1 + (size / planetData[type].radius[1]) * 8,
      planetSize: 0.9,
      daysInYear: Math.floor(range(random, planetData[type].year)),
      dominantChemical: pickWeightedChemical(type, random),
    }
  }

  const radius = Math.floor(range(random, planetData[type].radius)) * sizeMod
  if (type === "jovian") ringed = checkRings(radius, random)

  let planetSize;
  if (radius < 4000) {
    planetSize = 2.6
  } else if (radius < 5000) {
    planetSize = 1.6
  } else if (radius < 10000) {
    planetSize = 1.4
  } else {
    planetSize = 1.2
  }
  if (type === "station" || type === "gate" || type === "asteroid") {
    planetSize = 1.5
  }

  return {
    type,
    radius,
    ringed,
    planetSize,
    tint: tintMap[type] || "gray",
    gravity: Math.floor(range(random, planetData[type].gravity || [0, 0])),
    pressure: Math.floor(range(random, planetData[type].pressure || [0, 0])),
    temperature: Math.floor(range(random, planetData[type].temperature || [0, 0])),
    daysInYear: Math.floor(range(random, planetData[type].year || [0, 0])),
    hoursInDay: Math.floor(range(random, planetData[type].day || [0, 0])),
    // used for lava on lava planet, and land for terrestrial
    hydrosphere: range(random, planetData[type].hydro || [0, 0]) / 100,
    cloud: range(random, planetData[type].cloud || [0, 0]) / 100,
    ringSize: range(random, planetData[type].ringSize || [0, 0]),
    ice: range(random, planetData[type].ice || [0, 0]) / 100,
    dominantChemical: pickWeightedChemical(type, random),
    moons: isMoon ? [] : generateMoons(radius, random, seed),
    modifier: sizeMod !== 1 ? sizeMod === 2 ? "supermassive" : sizeMod === 0.5 ? "dwarf" : "moon" : "",
    isMoon: !!isMoon,
  }
}

function generateMoons(radius, random, seed) {
  const moonData = []
  if (radius < 4000) return moonData
  let moons = 0;
  let extraRadius = radius - 4000;
  while (extraRadius > 0 && moons < 100) {
    if (random() < 0.5) moons++
    extraRadius -= 1000
  }
  for (let i = 0; i < moons; i++) {
    moonData.push(generateLocation(seed + i, true))
  }
  return moonData
}

function checkRings(radius, random) {
  if (radius < 10000) return false
  // const chance = 1 + (radius - 10000) / 200000
  const chance = 0.2 + (radius - 10000) / 200000
  const subChance = (Math.floor(Math.abs(random()) * 100) % 10) / 10
  return subChance < chance;
}

// Planet data structure
const planetData = {
  barren_planet: {
    gravity: [90, 1050],
    pressure: [0, 1],
    temperature: [-200, 350],
    radius: [800, 8000],
    year: [60, 130000],
    day: [250, 125000],
    ice: [0, 30],
    chemical: ["iron", "silicate", "carbon", "sulfur", "oxygen"]
  },
  ice_planet: {
    gravity: [300, 1320],
    pressure: [7, 5802],
    temperature: [-250, -14],
    radius: [4200, 11000],
    year: [250, 125000],
    day: [12, 60],
    cloud: [40, 90],
    ice: [35, 75],
    chemical: ["ammonia", "methane", "oxygen", "carbon", "nitrogen", "sulfur"]
  },
  terrestrial: {
    gravity: [600, 1400],
    pressure: [78, 5820],
    temperature: [1, 30],
    radius: [4224, 8382],
    year: [290, 800],
    day: [13, 40],
    // lower is more land
    hydro: [50, 60],
    cloud: [50, 70],
    ice: [0, 10],
    chemical: ["silicate", "iron", "oxygen", "carbon", "nitrogen", "sulfur", "hydrogen", "helium"]
  },
  jovian: {
    gravity: [500, 1800],
    pressure: [1000, 200000],
    temperature: [-160, 1200],
    radius: [7800, 120000],
    year: [600, 98000],
    day: [5, 30],
    cloud: [50, 100],
    ringSize: [0, 0.2],
    ice: [0, 0],
    chemical: ["hydrogen", "helium", "methane", "ammonia", "sulfur", "carbon", "oxygen"]
  },
  lava_planet: {
    gravity: [1000, 2400],
    pressure: [500, 100000],
    temperature: [400, 3000],
    radius: [4000, 9000],
    year: [200, 1000],
    day: [10, 35],
    // use hydro as a lava proxy, lower is more lava
    // TODO: this seems bugged, the percentage does not work as expected
    hydro: [50, 64],
    cloud: [30, 100],
    chemical: ["oxygen", "iron", "silicate", "sulfur", "carbon", "hydrogen"]
  },
  desert_planet: {
    gravity: [700, 1600],
    pressure: [50, 2000],
    temperature: [30, 90],
    radius: [4000, 9000],
    year: [300, 3000],
    day: [20, 50],
    hydro: [0, 5],
    cloud: [5, 50],
    ice: [0, 2],
    chemical: ["silicate", "oxygen", "iron", "carbon", "sulfur"]
  },
  ocean_planet: {
    gravity: [800, 1600],
    pressure: [500, 3000],
    temperature: [-10, 40],
    radius: [5000, 10000],
    year: [250, 1000],
    day: [12, 30],
    hydro: [60, 95],
    cloud: [25, 80],
    ice: [0, 30],
    chemical: ["oxygen", "hydrogen", "carbon", "nitrogen", "ammonia", "methane", "sulfur", "iron"]
  },
  asteroid: {
    radius: [10, 500],
    year: [150, 10000],
    chemical: ["oxygen", "hydrogen", "carbon", "nitrogen", "silicate", "methane", "sulfur", "iron", "copper"],
  },
  gate: {
    radius: [200, 400],
  },
  station: {
    radius: [10, 500],
    year: [150, 10000],
  },
  "red dwarf": {
    temperature: [2500, 3500],
    radius: [0.1, 0.7],
  },
  "white dwarf": {
    temperature: [8000, 40000],
    radius: [0.001, 0.1],
  },
  "red giant": {
    temperature: [3000, 6000],
    radius: [10, 150],
  },
  "red supergiant": {
    temperature: [3500, 4500],
    radius: [30, 1500],
  },
  "blue giant": {
    temperature: [10000, 50000],
    radius: [5, 10],
  },
  "blue supergiant": {
    temperature: [10000, 50000],
    radius: [10, 40],
  },
  // "neutron": {
  //   temperature: [1000000, 5000000],
  //   radius: [8, 14],
  // },
  "red": {
    temperature: [2000, 4000],
    radius: [1, 5],
  },
  "blue": {
    temperature: [30000, 60000],
    radius: [2, 16],
  },
  "orange": {
    temperature: [2000, 4000],
    radius: [1, 5],
  },
  "yellow": {
    temperature: [2000, 4000],
    radius: [1, 5],
  }
}

function range(rng, [min, max]) {
  return +(rng() * (max - min) + min).toFixed(2);
}

export function pickWeightedChemical(type, rng) {
  const options = planetData[type].chemical || [0, 0];
  return options[Math.floor(rng() * options.length)];
}
