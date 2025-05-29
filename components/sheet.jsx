import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from '@/components/ui/badge.jsx'
import Link from "next/link"
import { color, accent, genLink, getConsts } from "@/lib/utils.js"
import * as SVG from './svg.js'
import { useMap } from 'react-map-gl/maplibre'
import { useEffect } from "react"
import SolarSystemDiagram from "./solarSystem.jsx"
import seedrandom from 'seedrandom'

const MAX_GEN_LOCATIONS = 8

export default function SheetComponent({ drawerContent, setDrawerContent, myGroup, nearbyGroups, coordinates, name, selectedId, height, isGalaxy }) {
  const { map } = useMap()
  // const { UNIT } = getConsts(name)
  const GROUP_NAME = isGalaxy ? "Solar Systems" : "Locations"

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
        hamburger.style.bottom = "40%"
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

  if (!coordinates) return null
  const local = generateLocations(myGroup)
  const nearby = nearbyGroups.map(g => generateLocations(g))

  // console.log("local", local)
  // console.log("nearby", nearby)

  function handleMouseOver({ id }) {
    map.setFeatureState(
      { source: 'source', id },
      { hover: true }
    )
  }

  function handleMouseOut({ id }) {
    map.setFeatureState(
      { source: 'source', id },
      { hover: false }
    )
  }

  function handle(e) {
    e.preventDefault()
  }

  return (
    <Sheet open={!!drawerContent} onOpenChange={() => setDrawerContent(null)} modal={false} style={{ color: 'white' }} >
      <SheetContent side="bottom" style={{ maxHeight: '38vh', overflowY: 'auto' }} onPointerDownOutside={handle} id="bottom-sheet">
        <SheetHeader >
          <SheetTitle className="text-center">{coordinates ? `${isGalaxy ? "Y" : "lat"}: ${Math.floor(coordinates[1])}, ${isGalaxy ? "X" : "lng"}: ${Math.floor(coordinates[0])}` : 'unknown'}</SheetTitle>
          {nearby.length > 1 && <SheetDescription className="text-center" >{nearby.length} Nearby {GROUP_NAME}</SheetDescription>}
        </SheetHeader >

        <SolarSystemDiagram group={local} height={height} isGalaxy={isGalaxy} />
        <hr />
        {nearby.length > 0 && (
          <>
            <h1 className="text-center text-2xl my-4">Nearby {GROUP_NAME}</h1>
            {nearby.map((group, index) => (
              <div key={index}>
                <SolarSystemDiagram group={group} height={height} isGalaxy={isGalaxy} />
                {index + 1 !== nearby.length && <hr />}
              </div>
            ))}
          </>
        )}
      </SheetContent>
    </Sheet>
  )

  // return (
  //   <Sheet open={!!setDrawerContent} modal={false} style={{ color: 'white' }}>
  //     <SheetContent side="bottom" style={{ maxHeight: '38vh', overflowY: 'auto' }} className="map-sheet" onPointerDownOutside={handle}>
  //       <SheetHeader >
  //         <SheetTitle className="text-center">{coordinates ? `${UNIT === "ly" ? "Y" : "lat"}: ${Math.floor(coordinates[1])}, ${UNIT === "ly" ? "X" : "lng"}: ${Math.floor(coordinates[0])}` : 'unknown'}</SheetTitle>
  //         {locations?.length > 1 && <SheetDescription className="text-center" >Nearby Locations</SheetDescription>}
  //       </SheetHeader >
  //       <div className="flex flex-wrap justify-center">
  //         {locations?.map((d, index) => {
  //           const { properties, geometry } = d
  //           const params = new URLSearchParams({
  //             description: properties.description || "",
  //             name: properties.name,
  //             map: name,
  //           }).toString()
  //           const icon = SVG[d.properties.type]
  //           const remoteIcon = d.properties.icon
  //           const card = (
  //             <Card
  //               className="min-h-[80px] m-2 min-w-[150px] cursor-pointer"
  //               onMouseOver={() => handleMouseOver(d)}
  //               onMouseOut={() => handleMouseOut(d)}
  //             >
  //               <CardContent className={`p-2 text-center ${selected === properties.name ? 'bg-yellow-800' : 'hover:bg-yellow-950'}`}>
  //                 {properties.unofficial && <Badge variant="destructive" className="mx-auto">unofficial</Badge>}
  //                 <p className="font-bold text-xl text-center">{properties.name}</p>
  //                 {remoteIcon ?
  //                   <p className="text-center text-gray-400 flex justify-center">
  //                     <svg width="20" height="20" className="m-1">
  //                       <image href={remoteIcon} width="20" height="20" />
  //                     </svg>
  //                     {properties.type}
  //                   </p>
  //                   : <p className="text-center text-gray-400 flex justify-center"><span dangerouslySetInnerHTML={{ __html: icon }} style={{ fill: "white", margin: '.2em' }} />{properties.type}</p>
  //                 }
  //                 {properties.faction && <Badge className="mx-auto">{properties.faction}</Badge>}
  //                 {properties.destroyed && <Badge className="mx-auto">destroyed</Badge>}
  //                 {properties.capital && <Badge variant="destructive" className="mx-auto">capital</Badge>}
  //               </CardContent>
  //             </Card >
  //           )
  //           return properties.name === selected ? (
  //             <Link
  //               href={genLink(d, name, "href")}
  //               target={genLink(d, name, "target")}
  //               key={index}
  //             >
  //               {card}
  //             </Link>
  //           ) : <div key={index} onClick={() => {

  //             // duplicate of map pan()
  //             const arbitraryNumber = locations.length > 5 ? 9.5 : 10
  //             let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom())
  //             zoomFactor = Math.max(zoomFactor, 4)
  //             const latDiff = (map.getBounds().getNorth() - map.getBounds().getSouth()) / zoomFactor
  //             const lat = d.geometry.coordinates[1] - latDiff / 2

  //             map.easeTo({ center: [d.geometry.coordinates[0], lat], duration: 800 })
  //           }}>{card}</div>
  //         })}
  //       </div>
  //     </SheetContent >
  //   </Sheet >
  // )
}


function generateLocations(group) {
  const seed = group[0].geometry.coordinates.toString()
  const rng = seedrandom(seed)
  const random = () => rng()

  const numToGen = Math.floor(range(random, [1, MAX_GEN_LOCATIONS])) - group.length

  const locations = []
  const starLocation = group.find(l => l.properties.type === "star")
  locations.push(generateStar(seed + `${starLocation?.properties.name || ""}`))
  if (starLocation) {
    locations[0] = { ...locations[0], name: starLocation.properties.name }
  }

  for (const location of group) {
    const type = location.properties.type
    if (type === "star") continue
    locations.push({
      name: location.properties.name,
      type,
      variant: "red",
      tint: "red",
    })
  }

  for (let i = 0; i < numToGen; i++) {
    locations.push(generateLocation(seed + i))
  }

  return locations
}

const tintMap = {
  ice: "blue",
  terrestrial: "green",
  jovian: "brown",
  lava: "red",
  desert: "yellow",
  ocean: "blue",
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

function generateStar(seed) {
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

  const rand = random();
  const star = cumulativeWeights.find(item => rand <= item.cumulativeChance);

  const radius = range(random, planetData[star.variant].radius);
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
    planetSize,
    tint: tintMap[star.variant],
    schemeColor: star.scheme,
    baseColors: star.baseColor,
    temperature: range(random, planetData[star.variant].temperature || [0, 0]),
  };
}

function generateLocation(seed, isMoon) {
  const rng = seedrandom(seed)
  const random = () => rng()

  const types = ['barren', 'ice', 'terrestrial', 'jovian', 'lava', 'desert', 'ocean', 'dwarf', 'supermassive', 'asteroid']
  const rand = random()
  let type, ringed, sizeMod = 1
  if (isMoon) {
    const moonTypes = ['barren', 'ice', 'terrestrial', 'lava', 'desert', 'ocean', 'asteroid']
    type = moonTypes[Math.floor(rand * moonTypes.length)]
    sizeMod = 0.1
  } else {
    type = types[Math.floor(rand * types.length)]
  }

  const sub = (Math.floor(Math.abs(rand) * 100) % 10) / 10
  if (type === "dwarf") {
    const dwarf = ["barren", "ice"];
    const subIndex = Math.floor(sub * dwarf.length)
    type = dwarf[subIndex]
    sizeMod = 0.5
  } else if (type === "supermassive") {
    const supermassive = ["ice", "terrestrial", "jovian", "lava", "desert", "ocean"];
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
  barren: {
    gravity: [90, 1050],
    pressure: [0, 1],
    temperature: [-200, 350],
    radius: [800, 8000],
    year: [60, 130000],
    day: [250, 125000],
    ice: [0, 30],
    chemical: ["iron", "silicate", "carbon", "sulfur", "oxygen"]
  },
  ice: {
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
    hydro: [40, 60],
    cloud: [40, 80],
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
  lava: {
    gravity: [1000, 2400],
    pressure: [500, 100000],
    temperature: [400, 3000],
    radius: [4000, 9000],
    year: [200, 1000],
    day: [10, 35],
    // use hydro as a lava proxy, lower is more lava
    // TODO: this seems bugged
    hydro: [50, 64],
    cloud: [30, 100],
    chemical: ["oxygen", "iron", "silicate", "sulfur", "carbon", "hydrogen"]
  },
  desert: {
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
  ocean: {
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
