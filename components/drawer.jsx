import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Suspense, useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge.jsx"
import { genLink, gridHelpers, svgBase } from "@/lib/utils.js"
import { generateSystemAtClick } from "@/lib/fakeData.js"
import { useMap } from "@vis.gl/react-maplibre"
import SolarSystem from "./solarSystem.jsx"
import LocationSystem from "./locationSystem.jsx"
import {
  Book,
  Code,
  Crosshair,
  Drama,
  ExternalLink,
  MessageCircleWarning,
  StickyNote,
} from "lucide-react"
import ThreejsPlanet, { availableThreejsModels } from "./threejsPlanet"
import { Button } from "./ui/button.jsx"
import { toast } from "sonner"
import Link from "next/link.js"
import sanitize from "sanitize-html"
import style from "@/app/contribute/[map]/md.module.css"

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
  const { map } = useMap()
  const GROUP_NAME = IS_GALAXY ? "Celestial Bodies" : "Nearby Locations"

  const [ui, setUi] = useState(() => ({
    display: null,
    local: [],
    size: 120,
    snaps: [0.28, 0.92],
  }))

  function isValidHttpUrl(string) {
    if (typeof string === "string" && string.startsWith("http")) return true
  }

  // ✅ HOOKS MUST ALWAYS RUN: compute this BEFORE any return
  const coordinatesPretty = useMemo(() => {
    if (!coordinates) return ""
    if (IS_GALAXY) {
      // TODO: plug your gridHelpers back in here if you want
      return `${coordinates[1].toFixed(2)}, ${coordinates[0].toFixed(2)}`
    }
    const offset = COORD_OFFSET || [0, 0]
    return `${(coordinates[1] + offset[0]).toFixed(1)}, ${(coordinates[0] + offset[1]).toFixed(1)}`
  }, [coordinates, IS_GALAXY, COORD_OFFSET])

  // Single “feature change” effect -> single setState
  useEffect(() => {
    if (!d || !coordinates || !Array.isArray(myGroup) || GEO_EDIT) {
      setUi(s => ({ ...s, display: null, local: [] }))
      return
    }

    const rawProps = d.properties || null
    const usingThreejsRaw =
      IS_GALAXY && availableThreejsModels.includes(rawProps?.type)
    const sizeRaw = Math.max(60, height * (usingThreejsRaw ? 0.2 : 0.08))
    const snapsRaw = [
      mobile ? 0.45 : usingThreejsRaw ? (height < 700 ? 0.6 : 0.4) : 0.28,
      0.92,
    ]

    // If not a Point, just show real props + group (no fake system concept)
    if (d.geometry?.type !== "Point" || !IS_GALAXY) {
      setUi({
        display: rawProps,
        local: myGroup || [],
        size: sizeRaw,
        snaps: snapsRaw,
      })
      return
    }

    // ✅ ALWAYS fill gaps on clicked + nearby reals,
    // and only optionally generate fake neighbors based on GENERATE_LOCATIONS.
    const { bodies, selected } = generateSystemAtClick({
      lng: coordinates[0],
      lat: coordinates[1],
      SEARCH_SIZE,
      VIEW: { maxBounds: VIEW?.maxBounds },
      clickedFeature: d,
      nearbyRealFeatures: myGroup,
      snapCellSizeDeg: SEARCH_SIZE * 5,

      // ✅ NEW: fake points only when toggle is on
      generateFakes: !!GENERATE_LOCATIONS,
    })

    const display = selected?.properties || rawProps
    const usingThreejs =
      IS_GALAXY && availableThreejsModels.includes(display?.type)
    const size = Math.max(60, height * (usingThreejs ? 0.2 : 0.08))
    const snaps = [
      mobile ? 0.45 : usingThreejs ? (height < 700 ? 0.6 : 0.4) : 0.28,
      0.92,
    ]

    setUi({ display, local: bodies, size, snaps })

  }, [
    d,
    coordinates?.[0],
    coordinates?.[1],
    myGroup,
    GENERATE_LOCATIONS,
    VIEW?.maxBounds,
    SEARCH_SIZE,
    GEO_EDIT,
    IS_GALAXY,
    height,
    mobile,
  ])

  // Drawer open/close DOM nudges
  useEffect(() => {
    const el = document.querySelector(".editor-table")
    if (el) el.style.bottom = drawerContent ? "40%" : "20px"

    const hamburger = document.querySelector(".hamburger")
    const zoomControls = document.querySelector(".zoom-controls")
    if (!hamburger || !zoomControls) return

    const isSmall = window.innerWidth < 1200
    if (isSmall) {
      hamburger.style.bottom = drawerContent ? "45%" : "5em"
      zoomControls.style.bottom = drawerContent ? "55%" : "12em"
    } else {
      hamburger.style.removeProperty("bottom")
      zoomControls.style.removeProperty("bottom")
    }
  }, [drawerContent])

  const display = ui.display
  const local = ui.local
  const snaps = ui.snaps
  const size = ui.size

  // ✅ now safe to return early; all hooks already executed
  if (!coordinates || !d || !display || GEO_EDIT) return null

  const foundryClick = () => {
    if (!params.get("iframe")) {
      toast.success(`Foundry only feature [${display.link}]`)
      return
    }
    window.parent.postMessage({ type: "link", link: display.link }, "*")
  }

  function recenter() {
    if (!map || !coordinates || display?.fake) return

    const arbitraryNumber = 9
    let zoomFactor = Math.pow(2, arbitraryNumber - map.getZoom())
    zoomFactor = Math.max(zoomFactor, 4)

    const bounds = map.getBounds()
    const latDiff = (bounds.getNorth() - bounds.getSouth()) / zoomFactor
    const lat = coordinates[1] - latDiff / 2

    map.flyTo({ center: [coordinates[0], lat], duration: 800 })

    if (selectedId != null) {
      map.setFeatureState({ source: "source", id: selectedId }, { hover: true })
      setTimeout(
        () =>
          map.setFeatureState(
            { source: "source", id: selectedId },
            { hover: false },
          ),
        400,
      )
    }
  }

  const starNum =
    typeof display.starType === "string"
      ? display.starType.split(",").filter(Boolean).length
      : 0

  return (
    <Drawer
      open={!!drawerContent}
      onOpenChange={() => setDrawerContent(null)}
      modal={false}
      snapPoints={snaps}
      activeSnapPoint={snaps[0]}
    >
      <DrawerContent>
        <DrawerTitle />
        <div className="w-full flex flex-col items-center justify-center text-xs lg:text-base select-text">
          {/* Canvas */}
          <div className="flex items-center justify-center z-10">
            {availableThreejsModels.includes(display.type) ? (
              <Suspense fallback={<div />}>
                <ThreejsPlanet
                  hostKey="drawer"
                  height={size}
                  width={size}
                  disableListeners={true}
                  type={display.type}
                  pixels={Number(display.pixels) || 800}
                  baseColors={display.baseColors}
                  featureColors={display.featureColors}
                  layerColors={display.layerColors}
                  schemeColor={display.schemeColor}
                  atmosphereColors={display.atmosphereColors}
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
                src={`${svgBase + name}/${display.type}.svg`}
                alt={display.type}
                className="mt-[1.7em]"
                style={{
                  width: size / 1.5 + "px",
                  height: size / 1.5 + "px",
                  position: "absolute",
                  paddingBottom: "5px",
                  top: 0,
                  filter: display.tint
                    ? `drop-shadow(0 0 6px ${display.tint})`
                    : undefined,
                }}
              />
            )}
          </div>

          {/* TOP – Coordinates */}
          <div

            className="
              absolute top-0 left-1/2 -translate-x-1/2 z-10
              text-xs lg:text-sm
              text-white
            "
            style={{
              textShadow: `
                0 0 3px black,
                0 0 6px black,
                1px 1px 0 black,
                -1px -1px 0 black
              `
            }}
          >
            <Crosshair
              size={mobile ? 14 : 20}
              onClick={recenter}
              className="inline mr-2 mb-1 cursor-pointer bg-black/40 rounded-full border-white/80"
            />
            {coordinatesPretty}
          </div>

          <div
            className="w-full flex flex-nowrap check-me-please"
            style={{ height: `${size}px` }}
          >
            {/* left */}
            <div
              className="w-full text-right p-0 lg:p-4 pb-5 flex flex-col-reverse"
              style={{ marginRight: `${Number(size) + 40}px` }}
            >
              <div className="flex flex-col gap-2 items-end">
                <div className="flex flex-wrap gap-2 justify-end">
                  {starNum === 2 && <Badge className="text-sm">binary</Badge>}
                  {starNum === 3 && <Badge className="text-sm">trinary</Badge>}
                  <BadgeList list={display.factions} label="Factions" />
                </div>

                <div className="flex flex-col gap-2 text-right text-sm">
                  <BadgeList list={display.alias} label="Alias" />

                  <BadgeList list={display.locations} label="locations" />

                  <BadgeList list={display.people} label="People" />

                  <BadgeList list={display.region} label="Region" />

                  {display.link && (
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={foundryClick}
                    >
                      {display.link.length === 29 &&
                        display.link.includes("JournalEntry.") && <Book />}
                      {display.link.length === 63 &&
                        display.link.includes(".JournalEntryPage.") && (
                          <StickyNote />
                        )}
                      {display.link.includes("Macro.") && <Code />}
                      {display.link.includes("forien-quest-log.") && (
                        <MessageCircleWarning />
                      )}
                      {display.link.includes("Scene.") && <Drama />}
                      {!display.link.includes("JournalEntry") &&
                        !display.link.includes("JournalEntryPage") &&
                        !display.link.includes("Macro.") &&
                        !display.link.includes("forien-quest-log.") &&
                        !display.link.includes("Scene.") && <ExternalLink />}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* right */}
            <div className="w-full p-0 lg:p-4 pb-5">
              <div className="flex flex-col gap-4 text-left max-w-md">
                {typeof display.source === "string" &&
                  display.source.length > 0 && (
                    <div className="flex flex-col gap-1 text-xs">
                    <span className="uppercase tracking-wide text-[0.65rem]"
                      style={{
                        textShadow: `
                          0 0 3px black,
                          0 0 6px black,
                          1px 1px 0 black,
                          -1px -1px 0 black
                        `
                      }}
                    >
                      source
                      </span>
                      {isValidHttpUrl(display.source) ? (
                        <Link
                          href={display.source}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-300"
                        >
                          Open source
                          <ExternalLink size={mobile ? 14 : 16} />
                        </Link>
                      ) : (
                        <span style={{
                          textShadow: `
                            0 0 3px black,
                            0 0 6px black,
                            1px 1px 0 black,
                            -1px -1px 0 black
                          `
                        }}>{display.source}</span>
                      )}
                    </div>
                  )}
                <BadgeList
                  list={display.composition}
                  variant="secondary"
                  label="Composition"
                  align="left"
                />

                <BadgeList
                  list={display.tags}
                  variant="secondary"
                  label="Tags"
                  align="left"
                />
              </div>
            </div>
          </div>

          {/* BOTTOM – Name/Type */}
          <div
            className="absolute left-1/2 flex transform -translate-x-1/2 items-center bg-[rgba(0, 0, 0, 0.75)]"
            style={{ top: `${Number(size) - 5}px` }}
          >
            {!display.fake &&
            !display.userCreated &&
            genLink(d, name, "wiki") ? (
              <ExternalLink
                className="cursor-pointer me-1 opacity-60"
                size={mobile ? 14 : 19}
                onClick={() => window.open(genLink(d, name, "href"), "_blank")}
              />
            ) : null}

            {display.name}

            <span className="text-gray-400 ms-1">
              {" "}
              -{" "}
              {display.type === "star"
                ? display.starType || display.variant || "star"
                : String(display.type || "").replace(/_/g, " ")}
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
                display={display}
                height={height}
                width={width}
                isGalaxy={IS_GALAXY}
                params={params}
                map={map}
                selectedId={selectedId}
                name={name}
                passedLocationClick={passedLocationClick}
              />
            ) : (
              <LocationSystem
                group={local}
                map={map}
                params={params}
                selectedId={selectedId}
                name={name}
                passedLocationClick={passedLocationClick}
              />
            )}
          </>
        )}

        <hr className="my-2" />
        <div className="w-full mx-auto px-4 overflow-auto mb-28 space-y-6 container">
          <DrawerHeader className="m-0 p-0 mt-1">
            <DrawerTitle className="text-xl font-bold text-center">
              <span className="text-gray-500 text-sm">
                {" "}
                drawer can be pulled up
              </span>
            </DrawerTitle>
          </DrawerHeader>

          {display.image && (
            <div className="flex flex-col items-center gap-2">
              <img
                src={display.image}
                alt={display.caption || display.name}
                className="max-h-72 w-full object-contain rounded border border-white/10"
              />
              {display.caption && (
                <p className="text-center text-xs italic text-gray-300">
                  {display.caption}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {renderPercentBar(
              display.cloudPercent,
              "Cloud Cover",
              "linear-gradient(90deg,#6366f1,#a855f7)",
            )}
            {renderPercentBar(
              display.hydroPercent,
              "Hydrosphere",
              "linear-gradient(90deg,#22d3ee,#0ea5e9)",
            )}
            {renderPercentBar(
              display.icePercent,
              "Ice",
              "linear-gradient(90deg,#bae6fd,#e0f2fe)",
            )}
            {renderPercentBar(
              display.lavaPercent,
              "Lava Coverage",
              "linear-gradient(90deg,#fb923c,#ea580c)",
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {typeof display.temperature !== "undefined" && (
              <div>
                <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                  Temperature
                </dt>
                <dd>
                  {display.type === "star"
                    ? `${display.temperature + 273.15}°K`
                    : `${Math.floor(Number(display.temperature))}°C`}
                </dd>
              </div>
            )}
            {typeof display.diameter !== "undefined" && (
              <div>
                <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                  Diameter
                </dt>
                <dd>
                  {display.diameter}{" "}
                  {display.type === "star" ? "solar radii" : "km"}
                </dd>
              </div>
            )}
            {typeof display.gravity !== "undefined" && (
              <div>
                <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                  Gravity
                </dt>
                <dd>{(display.gravity * 0.0010197162).toFixed(1)} g</dd>
              </div>
            )}
            {typeof display.pressure !== "undefined" &&
              display.pressure > 0 && (
                <div>
                  <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                    Pressure
                  </dt>
                  <dd>{(display.pressure / 1000).toFixed(1)} bars</dd>
                </div>
              )}
            {typeof display.hoursInDay !== "undefined" && (
              <div>
                <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                  Hours / Day
                </dt>
                <dd>{display.hoursInDay}</dd>
              </div>
            )}
            {typeof display.daysInYear !== "undefined" && (
              <div>
                <dt className="text-gray-400 uppercase text-[0.6rem] tracking-wide">
                  Days / Year
                </dt>
                <dd>{display.daysInYear}</dd>
              </div>
            )}
          </dl>

          {display.description && (
            <section>
              <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                Description
              </p>
              <div
                className={style.markdown}
                style={{
                  lineHeight: "1.625",
                  overflowWrap: "break-word",
                  userSelect: "text",
                  fontSize: "1.1em",
                }}
                dangerouslySetInnerHTML={{
                  __html: sanitizeContent(display.description, sanitize),
                }}
              ></div>
            </section>
          )}

          {display.notes && (
            <section>
              <p className="text-sm uppercase tracking-wide text-gray-400 mb-2">
                Notes
              </p>
              <div
                className={style.markdown}
                dangerouslySetInnerHTML={{
                  __html: sanitizeContent(display.notes, sanitize),
                }}
              ></div>
            </section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const renderPercentBar = (value, label, color = "#38bdf8") => {
  if (
    typeof value === "undefined" ||
    value === null ||
    Number.isNaN(Number(value)) ||
    value === 0
  )
    return null
  const percent = Math.max(0, Math.min(1, Number(value)))
  return (
    <div className="flex flex-col gap-1">
      {" "}
      <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-wide text-gray-400">
        {" "}
        <span>{label}</span> <span>{Math.round(percent * 100)}%</span>{" "}
      </div>{" "}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-900/60">
        {" "}
        <div
          className="h-full rounded-full"
          style={{ width: `${percent * 100}%`, background: color }}
        />{" "}
      </div>{" "}
    </div>
  )
}
export function BadgeList({ list, variant = "secondary", label, align = "right" }) {
  if (!list) return

  const m =
    typeof list === "string"
      ? list
          .split(",")
          .map(value => value.trim())
          .filter(Boolean)
      : typeof list === "object" && Array.isArray(list)
        ? list.filter(Boolean)
        : []


  return (
    <div className={`flex flex-col gap-2 text-${align} text-sm`}>
      <span className="uppercase tracking-wide text-[0.65rem]" style={{
        textShadow: `
          0 0 3px black,
          0 0 6px black,
          1px 1px 0 black,
          -1px -1px 0 black
        `
      }}>
        {label}
      </span>
      <div
        className={`flex flex-wrap gap-2 justify-${align === "left" ? "start" : "end"} mt-1`}
      >
        {m.map(f => {
          let v = variant
          if (f === "destroyed" || f === "unofficial") v = "destructive"
          if (f === "capital") v = ""
          return (
            <Badge variant={v} className="text-sm" key={f}>
              {f}
            </Badge>
          )
        })}
      </div>
    </div>
  )
}
function sanitizeContent(html, sanitizeFunc) {
  if (!html) return ""

  return sanitizeFunc(html, {
    // Start from defaults, then remove dangerous tags you forbade with DOMPurify
    allowedTags: sanitizeFunc.defaults.allowedTags.filter(
      tag => !["img", "svg", "math", "script", "table", "iframe"].includes(tag),
    ),
    // Allow normal attributes + link attributes
    allowedAttributes: {
      ...sanitizeFunc.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
    },
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href || ""

        // If not relative and not your trusted domain, wrap through /link
        if (
          href &&
          !href.startsWith("/") &&
          !href.startsWith("https://stargazer.vercel.app/")
        ) {
          const qs = new URLSearchParams({ url: href }).toString()
          return {
            tagName,
            attribs: {
              ...attribs,
              href: `/link?${qs}`,
            },
          }
        }

        return { tagName, attribs }
      },
    },
  })
}
