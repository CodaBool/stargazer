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

export default function SheetComponent({ setDrawerOpen, drawerOpen, locations, coordinates, name, selected, width }) {
  const { map } = useMap()
  const { UNIT } = getConsts(name)
  const sel = locations?.find(loc => loc.properties.name === selected)
  if (sel) console.log(selected, "system",)

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

  useEffect(() => {

    // move editor table
    const el = document.querySelector(".editor-table")
    if (el) {
      if (drawerOpen) {
        el.style.bottom = "40%"
      } else {
        el.style.bottom = "20px"
      }
    }

    // move the hamburger + zoom controls if on a small screen
    const hamburger = document.querySelector(".hamburger")
    const zoomControls = document.querySelector(".zoom-controls")
    if (hamburger && zoomControls && window.innerWidth < 1200) {
      if (drawerOpen) {
        hamburger.style.bottom = "40%"
        zoomControls.style.bottom = "55%"
      } else if (!drawerOpen) {
        hamburger.style.bottom = "0.5em"
        zoomControls.style.bottom = "7em"
      }
    } else if (hamburger && zoomControls && window.innerWidth > 1200) {
      if (hamburger.style.bottom === "0.5em") {
        hamburger.style.removeProperty("bottom")
        zoomControls.style.removeProperty("bottom")
      }
    }
  }, [drawerOpen])

  if (!sel) {
    return null
  }
  const system = generateSystem(selected + sel?.geometry.coordinates.toString())

  return (
    <Sheet onOpenChange={setDrawerOpen} open={drawerOpen} modal={false} style={{ color: 'white' }}>
      <SheetContent side="bottom" style={{ maxHeight: '38vh', overflowY: 'auto', minHeight: '38vh' }} className="map-sheet" onPointerDownOutside={handle}>
        <SheetHeader >
          <SheetTitle className="text-center">{coordinates ? `${UNIT === "ly" ? "Y" : "lat"}: ${Math.floor(coordinates[1])}, ${UNIT === "ly" ? "X" : "lng"}: ${Math.floor(coordinates[0])}` : 'unknown'}</SheetTitle>
          {locations?.length > 1 && <SheetDescription className="text-center" >Nearby Locations</SheetDescription>}
        </SheetHeader >
        <SolarSystemDiagram bodies={system} />
        <SolarSystemDiagram bodies={[
          {
            type: "lancer/ringed_planet",
            name: "ring guy",
            size: 80,
            tint: "red",
            moons: [
              { name: "moon 1", size: 12 },
              { name: "moon 2", size: 12 },
              { name: "moon 3", size: 12 },
              { name: "moon 4", size: 12 },
              { name: "moon 5", size: 12 },
              { name: "moon 6", size: 12 },
            ],
          },
        ]} />
        {/* <SolarSystemDiagram bodies={[
          {
            type: "lancer/ringed_planet",
            name: "ring guy",
            size: 80,
            tint: "red",
            moons: [
              { name: "moon 1", size: 12 },
              { name: "moon 2", size: 12 },
              { name: "moon 3", size: 12 },
              { name: "moon 4", size: 12 },
              { name: "moon 5", size: 12 },
              { name: "moon 6", size: 12 },
            ],
          },
          {
            type: "lancer/sun",
            name: "bing guy",
            size: 20,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/asteroid",
            name: "bing guy",
            size: 30,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/gate",
            name: "bing guy",
            size: 40,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/jovian",
            name: "bing guy",
            size: 50,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/star",
            name: "bing guy",
            size: 60,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/terrestrial",
            name: "bing guy",
            size: 70,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/station",
            name: "bing guy",
            size: 80,
            tint: "green",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          },
          {
            type: "lancer/moon",
            name: "sing guy",
            size: 90,
            tint: "yellow",
            // moons: [{ type: "ringed", name: "moon 1", size: 12 }],
          }
        ]} /> */}
      </SheetContent>
    </Sheet>
  )

  return (
    <Sheet onOpenChange={setDrawerOpen} open={drawerOpen} modal={false} style={{ color: 'white' }}>
      <SheetContent side="bottom" style={{ maxHeight: '38vh', overflowY: 'auto' }} className="map-sheet" onPointerDownOutside={handle}>
        <SheetHeader >
          <SheetTitle className="text-center">{coordinates ? `${UNIT === "ly" ? "Y" : "lat"}: ${Math.floor(coordinates[1])}, ${UNIT === "ly" ? "X" : "lng"}: ${Math.floor(coordinates[0])}` : 'unknown'}</SheetTitle>
          {locations?.length > 1 && <SheetDescription className="text-center" >Nearby Locations</SheetDescription>}
        </SheetHeader >
        <div className="flex flex-wrap justify-center">
          {locations?.map((d, index) => {
            const { properties, geometry } = d
            const params = new URLSearchParams({
              description: properties.description || "",
              name: properties.name,
              map: name,
            }).toString()
            const icon = SVG[d.properties.type]
            const remoteIcon = d.properties.icon
            const card = (
              <Card
                className="min-h-[80px] m-2 min-w-[150px] cursor-pointer"
                onMouseOver={() => handleMouseOver(d)}
                onMouseOut={() => handleMouseOut(d)}
              >
                <CardContent className={`p-2 text-center ${selected === properties.name ? 'bg-yellow-800' : 'hover:bg-yellow-950'}`}>
                  {properties.unofficial && <Badge variant="destructive" className="mx-auto">unofficial</Badge>}
                  <p className="font-bold text-xl text-center">{properties.name}</p>
                  {remoteIcon ?
                    <p className="text-center text-gray-400 flex justify-center">
                      <svg width="20" height="20" className="m-1">
                        <image href={remoteIcon} width="20" height="20" />
                      </svg>
                      {properties.type}
                    </p>
                    : <p className="text-center text-gray-400 flex justify-center"><span dangerouslySetInnerHTML={{ __html: icon }} style={{ fill: "white", margin: '.2em' }} />{properties.type}</p>
                  }
                  {properties.faction && <Badge className="mx-auto">{properties.faction}</Badge>}
                  {properties.destroyed && <Badge className="mx-auto">destroyed</Badge>}
                  {properties.capital && <Badge variant="destructive" className="mx-auto">capital</Badge>}
                </CardContent>
              </Card >
            )
            return properties.name === selected ? (
              <Link
                href={genLink(d, name, "href")}
                target={genLink(d, name, "target")}
                key={index}
              >
                {card}
              </Link>
            ) : <div key={index} onClick={() => {

              // duplicate of map pan()
              const arbitraryNumber = locations.length > 5 ? 9.5 : 10
              let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom())
              zoomFactor = Math.max(zoomFactor, 4)
              const latDiff = (map.getBounds().getNorth() - map.getBounds().getSouth()) / zoomFactor
              const lat = d.geometry.coordinates[1] - latDiff / 2

              map.easeTo({ center: [d.geometry.coordinates[0], lat], duration: 800 })
            }}>{card}</div>
          })}
        </div>
      </SheetContent >
    </Sheet >
  )
}


function generateSystem(seed) {
  const rng = seedrandom(seed);
  const random = () => rng();

  const numPlanets = Math.floor(random() * 9) + 2;
  const planets = []

  for (let i = 0; i < numPlanets; i++) {
    planets.push(generatePlanet(seed + i))
  }

  return planets
}

const iconMap = {
  barren: "lancer/",
  ice: "lancer/",
  terrestrial: "lancer/terrestrial",
  jovian: "lancer/jovian",
  lava: "lancer/",
  desert: "lancer/",
  ocean: "lancer/",
  dwarf: "lancer/",
  supermassive: "lancer/",
  asteroids: "lancer/",
}


// ocean (1-7)
// desert (1-2)
// lava (1-3)
// ice
// barren

function generatePlanet(seed) {
  const rng = seedrandom(seed)
  const random = () => rng();

  const types = ['barren', 'ice', 'terrestrial', 'jovian', 'lava', 'desert', 'ocean', 'dwarf', 'supermassive', 'asteroids']
  const rand = random()
  let type = types[Math.floor(rand * types.length)]

  let sizeMod = 1
  if (type === "dwarf") {
    const sub = (Math.floor(Math.abs(rand) * 100) % 10) / 10
    const dwarf = ["barren", "ice"];
    const subIndex = Math.floor(sub * dwarf.length)
    type = dwarf[subIndex]
    // console.log("Dwarf sub-roll:", type)
    sizeMod = 0.5
  } else if (type === "supermassive") {
    const sub = (Math.floor(Math.abs(rand) * 100) % 10) / 10
    const supermassive = ["ice", "terrestrial", "jovian", "lava", "desert", "ocean"];
    const subIndex = Math.floor(sub * supermassive.length);
    type = supermassive[subIndex]
    // console.log("Supermassive sub-roll:", type)
    sizeMod = 2
  } else if (type === "asteroids") {
    return {
      type,
      radius: Math.floor(range(random, planetData[type].radius)),
      icon: "lancer/asteroid",
      daysInYear: Math.floor(range(random, planetData[type].year)),
      dominantChemical: pickWeightedChemical(type, random),
    }
  }

  const radius = Math.floor(range(random, planetData[type].radius)) * sizeMod
  const ringed = checkRings(radius, random)
  return {
    type,
    radius,
    ringed,
    icon: ringed ? "lancer/ringed_planet" : iconMap[type],
    gravity: Math.floor(range(random, planetData[type].gravity)),
    pressure: Math.floor(range(random, planetData[type].pressure)),
    temperature: Math.floor(range(random, planetData[type].temperature)),
    daysInYear: Math.floor(range(random, planetData[type].year)),
    hoursInDay: Math.floor(range(random, planetData[type].day)),
    hydrosphere: Math.floor(range(random, planetData[type].hydro)),
    cloud: Math.floor(range(random, planetData[type].cloud)),
    ice: Math.floor(range(random, planetData[type].ice)),
    dominantChemical: pickWeightedChemical(type, random),
    moons: generateMoons(radius, random),
    modifier: sizeMod !== 1 ? sizeMod === 2 ? "supermassive" : "dwarf" : "",
  }
}

function generateMoons(radius, random) {
  if (radius < 4000) return 0;

  let moons = 1;
  let extraRadius = radius - 4000;
  while (extraRadius > 0 && moons < 200) {
    if (random() < 0.5) moons++;
    extraRadius -= 1000;
  }
  return moons;
}

function checkRings(radius, random) {
  if (radius < 10000) return false
  const chance = 0.1 + (radius - 10000) / 200000
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
    hydro: [0, 0],
    cloud: [0, 0],
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
    hydro: [0, 0],
    cloud: [0, 20],
    ice: [20, 100],
    chemical: ["ammonia", "methane", "oxygen", "carbon", "nitrogen", "sulfur"]
  },
  terrestrial: {
    gravity: [600, 1400],
    pressure: [78, 5820],
    temperature: [1, 30],
    radius: [4224, 8382],
    year: [290, 800],
    day: [13, 40],
    hydro: [30, 90],
    cloud: [15, 100],
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
    hydro: [0, 0],
    cloud: [50, 100],
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
    hydro: [0, 0],
    cloud: [30, 100],
    ice: [0, 0],
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
    hydro: [80, 100],
    cloud: [30, 100],
    ice: [0, 30],
    chemical: ["oxygen", "hydrogen", "carbon", "nitrogen", "ammonia", "methane", "sulfur", "iron"]
  },
  asteroids: {
    radius: [10, 500],
    year: [150, 10000],
    chemical: ["silicate", "oxygen", "hydrogen", "carbon", "nitrogen", "platinum", "iron", "nickel", "magnesium"]
  },
}

function range(rng, [min, max]) {
  return +(rng() * (max - min) + min).toFixed(2);
}

export function pickWeightedChemical(type, rng) {
  const options = planetData[type].chemical;
  return options[Math.floor(rng() * options.length)];
}
