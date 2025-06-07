'use client'
import maplibregl, {
  MapMouseEvent,
  LngLat,
  LngLatBounds,
} from 'maplibre-gl'
import { useMap, Layer, Source, Popup } from 'react-map-gl/maplibre'
import { useEffect, useState } from 'react'
import { getColorExpression, createPopupHTML, hexToRgb } from "@/lib/utils.js"
import { ZoomIn, ZoomOut } from "lucide-react"
import SearchBar from './searchbar'
import * as SVG from './svg.js'
import turfCentroid from '@turf/centroid'
import * as turf from '@turf/turf'
import Hamburger from './hamburger'
import Toolbox from './toolbox'
import Starfield from './starfield'
import Sheet from './sheet'
import { useDraw } from "./controls";
import { Calibrate, Link } from './foundry'

let popup, mode = new Set([])
let isRightDragging = false

export async function getIcon(d, fillRGBA) {
  const icon = d.properties.icon || SVG[d.properties.type]
  const fill = fillRGBA || d.properties.fill
  const stroke = d.properties.stroke

  // Apply to all <path>, <circle>, <rect>, etc.
  const forceAttrs = (svg, fill, stroke) => {
    if (fill) {
      svg = svg.replace(/(<(path|circle|rect|polygon|g)[^>]*?)\s*(fill=".*?")?/gi, (match, before) => {
        return `${before} fill="${fill}" `;
      });
    }
    if (stroke) {
      svg = svg.replace(/(<(path|circle|rect|polygon|g)[^>]*?)\s*(stroke=".*?")?/gi, (match, before) => {
        return `${before} stroke="${stroke}" `;
      });
    }
    return svg;
  };

  if (icon && !icon.startsWith("http")) {
    return forceAttrs(icon, fill, stroke);
  }

  if (icon?.startsWith("http")) {
    try {
      const res = await fetch(icon)
      let remoteSvg = await res.text();
      return forceAttrs(remoteSvg, fill, stroke);
    } catch (e) {
      console.log(`WARN: failed to fetch icon: ${icon}`, e);
      return null;
    }
  }

  return null;
}

function getLocationGroups(features, maxDistance = 20) {
  const unvisited = new Set(features.map(f => f.id))
  const solarSystems = []

  while (unvisited.size > 0) {
    const startId = unvisited.values().next().value
    const startFeature = features.find(f => f.id === startId)

    const cluster = []
    const queue = [startFeature]
    unvisited.delete(startId)

    while (queue.length > 0) {
      const current = queue.pop()
      cluster.push(current)
      unvisited.delete(current.id)

      for (const f of features) {
        if (!unvisited.has(f.id)) continue
        const dist = turf.distance(current.geometry.coordinates, turf.point(f.geometry.coordinates))
        if (dist <= maxDistance) {
          queue.push(f)
          unvisited.delete(f.id)
        }
      }
    }

    const centroid = turf.centroid({
      type: "FeatureCollection",
      features: cluster,
    });

    solarSystems.push({
      id: `solar-${solarSystems.length}`,
      center: centroid.geometry.coordinates,
      members: cluster.map(f => f.id)
    });
  }
  return solarSystems;
}

export default function Map({ width, height, data, name, mobile, params, locked, stargazer, setCrashed, CLICK_ZOOM, LAYOUT_OVERIDE, IGNORE_POLY, UNIT, DISTANCE_CONVERTER, STYLES, IS_GALAXY }) {
  const { map: wrapper } = useMap()
  const [drawerContent, setDrawerContent] = useState()

  // an optional performance thing that chatgpt suggested
  // const addedIcons = useRef(new Set());

  const recreateListeners = useDraw(s => s.recreateListeners)
  const locationGroups = getLocationGroups(data.features.filter(f => f.geometry.type === "Point" && f.properties.type !== "text"))

  async function pan(d, myGroup, nearbyGroups, fit) {
    if (locked && !fit) return
    mode.add("zooming")
    let fly = true, lat, lng, bounds, coordinates = d.geometry.coordinates
    let zoomedOut = wrapper.getZoom() < 6

    // force a zoom if panning to location by search
    if (fit) zoomedOut = true
    let zoom = wrapper.getZoom()

    if (d.geometry.type === "Point") {
      [lng, lat] = coordinates

      // zoom in for location clicks, if zoomed out
      if (zoomedOut) {
        zoom = CLICK_ZOOM
      }

    } else {

      // find center of territory or guide
      const centroid = turf.centroid(d)
      coordinates = centroid.geometry.coordinates
      lng = coordinates[0]
      lat = coordinates[1]

      // zoom view to fit territory or guide when searched

      if (fit) {
        bounds = turf.bbox(d)
      }
      if (!zoomedOut) fly = false
    }

    // offset for sheet
    // TODO: doesn't this always need to be done?
    if (zoomedOut) {
      const arbitraryNumber = 9.7
      // const arbitraryNumber = locations?.length > 5 ? 9.5 : 10
      let zoomFactor = Math.pow(2, arbitraryNumber - wrapper.getZoom())
      zoomFactor = Math.max(zoomFactor, 4)
      const latDiff = (wrapper.getBounds().getNorth() - wrapper.getBounds().getSouth()) / zoomFactor
      lat = coordinates[1] - latDiff / 2
    }

    if (fly) {
      if (bounds) {
        wrapper.fitBounds([
          [bounds[0], bounds[1]], // bottom-left corner
          [bounds[2], bounds[3]]  // top-right corner
        ], {
          duration: 800,
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
        });
      } else {
        wrapper.flyTo({ center: [lng, lat], duration: 800, zoom })
      }
      setTimeout(() => mode.delete("zooming"), 801)
    }

    if (d.geometry.type === "Point") {
      setDrawerContent({ coordinates, selectedId: d.id, myGroup, nearbyGroups })
    }
  }

  function listeners({ target: map }) {
    let currentFeatureCoordinates, hoveredStateId

    const mouseMove = (e) => {
      // hover
      if (e.features.length > 0) {
        if (hoveredStateId) {
          map.setFeatureState(
            { source: 'source', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = e.features[0].id
        map.setFeatureState(
          { source: 'source', id: hoveredStateId },
          { hover: true }
        );
      }

      // popup
      if (e.features[0].properties.type === "text") return
      if (e.features[0].geometry.type === "Point") {
        // don't show tooltips if the sheet/drawer is open
        if (document.querySelector('#bottom-sheet')) return
      }

      const featureCoordinates = e.features[0].geometry.coordinates.toString()
      if (currentFeatureCoordinates !== featureCoordinates) {
        currentFeatureCoordinates = featureCoordinates

        // Change the cursor style as a UI indicator.
        if (e.features[0].geometry.type === "Point") wrapper.getCanvas().style.cursor = 'pointer'

        let coordinates = e.features[0].geometry.coordinates.slice()
        const popupContent = createPopupHTML(e, IS_GALAXY, name)

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }
        if (e.features[0].geometry.type === "LineString") {
          if (!e.lngLat) return
          coordinates = [e.lngLat.lng, e.lngLat.lat]
        }
        if (!coordinates) {
          console.error("failed to get coordinates", coordinates, e)
        }
        popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap())
      }
    }

    const mouseLeave = (e) => {
      if (hoveredStateId !== null) {
        map.setFeatureState(
          { source: 'source', id: hoveredStateId },
          { hover: false }
        );
      }
      hoveredStateId = null;

      currentFeatureCoordinates = undefined;
      wrapper.getCanvas().style.cursor = ''
      const popupElement = document.querySelector('.maplibregl-popup');
      if (popupElement) {
        popupElement.classList.remove('fade-in');
      }
      popup.remove()
    }

    const territoryClick = (e) => {
      if (IGNORE_POLY?.includes(e.features[0].properties.type)) return
      const coordinates = e.lngLat;
      const popupContent = createPopupHTML(e, IS_GALAXY, name)
      popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap());
    }


    function locationClick(e) {
      if (mode.has("measure") || (mode.has("crosshair") && mobile) || locked) return;

      const clicked = e.features[0];

      // Find the group that the clicked location belongs to
      const group = locationGroups.find(g => g.members.includes(clicked.id))

      if (!group) return

      // Find nearby groups excluding the clicked group
      const nearbyGroups = locationGroups.filter(g => {
        if (g === group) return false; // Exclude the clicked group
        return turf.distance(group.center, g.center) <= (UNIT === "ly" ? 510 : 60);
      })
      // console.log("pre nearbyGroups", nearbyGroups)

      const nearby = nearbyGroups.map(({ center, members }) => {
        return members.map(id => {
          return {
            groupCenter: center,
            ...data.features.find(f => f.id === id)
          }
        })
      })

      // const myGroup = group.members.map(id => data.features.find(f => f.id === id))
      const myGroup = group.members.map(id => ({
        groupCenter: group.center,
        ...data.features.find(f => f.id === id)
      }))

      // console.log("Clicked", clicked)
      // console.log("click group", group)
      // console.log("Nearby groups (excluding clicked group)", nearby)

      pan(clicked, myGroup, nearby)

      // remove popup
      if (popup._container) {
        popup.remove()
      }
    }

    const ensureCheckbox = () => {
      if (mode.has("measureStart")) {
        mode.delete("measureStart")
      } else if (mode.has("crosshairZoom")) {
        mode.delete("crosshairZoom")
      }

      // remove popup when moving
      if (popup._container) {
        popup.remove()
      }
    }

    // RMB panning
    let offset, isMoving = false;
    map.on("mousedown", (e) => {
      if (e.originalEvent.button === 2) {
        isMoving = true;
        offset = e.point;
      }
    });
    map.on("mousemove", (e) => {
      if (isMoving) {
        map.panBy([offset.x - e.point.x, offset.y - e.point.y], {
          duration: 0,
        });
        offset = e.point;
      }
    })
    map.off("move", ensureCheckbox)
    map.off('mousemove', 'location', mouseMove)
    map.off('mouseleave', 'location', mouseLeave)
    map.off('mousemove', 'guide', mouseMove)
    map.off('mouseleave', 'guide', mouseLeave)
    map.off('click', 'territory', territoryClick)
    map.off('click', 'location', locationClick)

    map.on("move", ensureCheckbox)
    map.on("mouseup", () => isMoving = false)
    map.on('mousemove', 'location', mouseMove)
    map.on('mouseleave', 'location', mouseLeave)
    map.on('mousemove', 'guide', mouseMove)
    map.on('mouseleave', 'guide', mouseLeave)
    map.on('click', 'territory', territoryClick)
    map.on('click', 'location', locationClick)
  }

  useEffect(() => {
    if (!wrapper) return
    if (params.get("img")) {
      wrapper.on('load', async ({ target: map }) => {

        // hide labels since map notes will be created
        const userCreated = map.querySourceFeatures('source', {
          sourceLayer: "location",
          filter: ['==', ['get', 'userCreated'], true]
        })
        userCreated.forEach(({ id }) => {
          map.setFeatureState(
            { source: 'source', id },
            { hideLabel: true },
          )
        })

        // wait for state change to happen
        map.once('idle', ({ target: map }) => {

          const topBound = map.getBounds().getNorth();
          const bottomBound = map.getBounds().getSouth();
          const km = turf.distance(
            turf.point([0, topBound]),
            turf.point([0, bottomBound])
          )

          // all userMadeLocations should have an icon prop added which uses
          userCreated.forEach(location => {
            if (!location.properties.icon) {
              const type = location.properties.type
              location.properties.icon = `https://raw.githubusercontent.com/CodaBool/stargazer/refs/heads/main/public/svg/default/${type}.svg`;
            }
          })

          // TODO: support more than Point features
          const userMadeLocationsWithPixels = userCreated.filter(f => f.geometry.type === "Point").map(location => {
            const point = map.project(new maplibregl.LngLat(location.geometry.coordinates[0], location.geometry.coordinates[1]))
            return {
              ...location,
              pixelCoordinates: {
                top: point.y,
                left: point.x
              }
            };
          })

          window.parent.postMessage({
            type: 'featureData',
            featureData: userMadeLocationsWithPixels,
          }, '*')

          window.parent.postMessage({
            type: 'webpImage',
            webpImage: map.getCanvas().toDataURL(),
            distance: km * DISTANCE_CONVERTER,
            unit: UNIT,
          }, '*')
        })
      });
    }
    listeners({ target: wrapper })

    // crash detection
    const checkWebGLCrash = () => {
      if (wrapper.getMap().getCanvas().getContext("webgl2").drawingBufferFormat === 0) {
        console.error("🛑 Maplibre Canvas WebGL crashed, forcing Map remount")
        setCrashed(prev => prev + 1)
      }
    }

    const interval = setInterval(checkWebGLCrash, 1_500) // check every 1.5 seconds
    return () => clearInterval(interval)
  }, [wrapper, recreateListeners, params.get("preview")])

  useEffect(() => {
    // wrapper.on("load", listeners)
    popup = new maplibregl.Popup({
      closeButton: false,
      offset: [0, 20],
      closeOnClick: false,
      maxWidth: "340px",
      anchor: "top",
      className: "fade-in"
    })
  }, [])

  // add all custom icons
  if (wrapper) {
    data.features.forEach(f => {
      if (f.properties.icon) {
        if (!wrapper.hasImage(f.properties.icon)) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.width = 19
          img.height = 19
          img.src = f.properties.icon
          img.onload = () => {
            wrapper.addImage(f.properties.icon, img, { sdf: true })
          }
        }
      }
    })
  }
  // useEffect(() => {
  //   if (!wrapper) return;
  //   data.features.forEach(f => {
  //     const iconId = f.properties.icon;
  //     if (iconId && !addedIcons.current.has(iconId)) {
  //       const img = new Image();
  //       img.crossOrigin = "anonymous";
  //       img.width = 19;
  //       img.height = 19;
  //       img.src = iconId;
  //       img.onload = () => {
  //         if (!wrapper.hasImage(iconId)) {
  //           wrapper.addImage(iconId, img, { sdf: true });
  //           addedIcons.current.add(iconId);
  //         }
  //       };
  //     }
  //   });
  // }, [wrapper, data]);

  /*
  TODO:
  ## Map fine tuning
  - star wars location need to be separated into CANON / LEGENDS
  - star wars needs the grid
  - star wars has its own coordinate system
  - do a webgl check https://maplibre.org/maplibre-gl-js/docs/examples/check-for-support/
  */

  return (
    <>
      <Source id="source" type="geojson" data={data}>
        <Layer
          type="fill"
          id="territory"
          paint={{
            "fill-color": [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              `rgba(${hexToRgb(STYLES.HIGHLIGHT_COLOR)}, .1)`,
              getColorExpression(name, "fill", "Polygon")
            ],
            'fill-outline-color': getColorExpression(name, "stroke", "Polygon"),
          }}
          filter={["all", ["!=", "type", "line"], ["==", "$type", "Polygon"]]}
        />
        <Layer
          type="fill"
          paint={{
            "fill-color": getColorExpression(name, "fill", "Polygon"),
            'fill-outline-color': getColorExpression(name, "stroke", "Polygon"),
          }}
          filter={["all", ["==", "type", "line"], ["==", "$type", "Polygon"]]}
        />
        <Layer
          type="symbol"
          id="location"
          layout={{
            // "symbol-spacing": 250, // default 250 (in px)
            // "icon-allow-overlap": true, // default false
            "icon-overlap": "always",
            // "icon-optional": true, // default false
            "icon-overlap": "cooperative",
            "icon-size": .6,
            // "text-anchor": "top",
            "text-offset": [0, 1.3],
            "icon-padding": 0, // default 2


            // "icon-image": ["get", "icon"],
            "icon-image": [
              "coalesce",
              ["get", "icon"],
              ["get", "type"]
            ],

            // fallback image example 1
            // "icon-image": ["coalesce", ["image", "myImage"], ["image", "fallbackImage"]],
            // fallback image example 2
            // 'icon-image': [
            //   'coalesce',
            //   ['image', ['concat', ['get', 'icon'], '_15']],
            //   ['image', 'marker_15']
            // ],
            "text-field": ['get', 'name'],
            "text-font": ["Noto Sans Bold"],
            "text-size": 10,
            "text-max-width": 10,
            "text-line-height": 1.2,
            "text-optional": true,
            ...LAYOUT_OVERIDE || {},
          }}
          paint={{
            "text-color": "#ffffff",
            'text-opacity': [
              'case',
              ['boolean', ['feature-state', 'hideLabel'], false],
              0,
              1,
            ],
            "icon-color": [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              STYLES.HIGHLIGHT_COLOR,
              getColorExpression(name, "fill", "Point")
            ],
          }}
          filter={['==', '$type', 'Point']}
        />
        <Layer
          type="line"
          id="guide"
          paint={{
            "line-color": [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              STYLES.HIGHLIGHT_COLOR,
              getColorExpression(name, "stroke", "LineString")
            ],
            "line-width": 2,
            "line-dasharray": [10, 4],
          }}
          filter={['==', '$type', 'LineString']}
        />
        <Layer
          type="symbol"
          layout={{
            "text-rotate": 25,
            "text-offset": [0, 1.3],
            "text-field": ['get', 'name'],
            "text-size": 8,
            "text-optional": false,
          }}
          paint={{
            "text-color": "rgba(255, 255, 255, 0.5)",
          }}
          filter={['==', ['get', 'type'], 'text']}
        />
      </Source>
      {IS_GALAXY && <Starfield width={width} height={height} />}
      {params.get("zoom") !== "0" && <div className="absolute mt-28 ml-11 mr-[.3em] cursor-pointer z-10 bg-[rgba(0,0,0,.3)] rounded-xl zoom-controls" style={{ transition: 'bottom 0.5s ease-in-out' }}>
        <ZoomIn size={34} onClick={() => wrapper.zoomIn()} className='m-2 hover:stroke-blue-200' />
        <ZoomOut size={34} onClick={() => wrapper.zoomOut()} className='m-2 mt-4 hover:stroke-blue-200' />
      </div>}
      {params.get("search") !== "0" && <SearchBar map={wrapper} name={name} data={data} pan={pan} mobile={mobile} locationGroups={locationGroups} UNIT={UNIT} STYLES={STYLES} />}

      {/* FOUNDRY */}
      {params.get("secret") && <Link mode={mode} width={width} height={height} mobile={mobile} name={name} params={params} />}
      {params.get("calibrate") && <Calibrate mode={mode} width={width} height={height} mobile={mobile} name={name} IS_GALAXY={IS_GALAXY} />}

      <Sheet {...drawerContent} drawerContent={drawerContent} setDrawerContent={setDrawerContent} name={name} height={height} isGalaxy={IS_GALAXY} />

      <Toolbox mode={mode} width={width} height={height} mobile={mobile} name={name} map={wrapper} DISTANCE_CONVERTER={DISTANCE_CONVERTER} IS_GALAXY={IS_GALAXY} />
      {params.get("hamburger") !== "0" && <Hamburger mode={mode} name={name} params={params} map={wrapper} stargazer={stargazer} mobile={mobile} IS_GALAXY={IS_GALAXY} />}
    </>
  )
}
