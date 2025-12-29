'use client'
import maplibregl, {
  MapMouseEvent,
  LngLat,
  LngLatBounds,
} from 'maplibre-gl'
import { useMap, Layer, Source, Popup } from '@vis.gl/react-maplibre'
import { GeoGrid } from 'geogrid-maplibre-gl'
import { useEffect, useRef, useState, Fragment } from 'react'
import { createPopupHTML, localSet, getMaps, useMode, getPaint, gridAlgorithm, useGrid, gridHelpers } from "@/lib/utils.js"
import { ZoomIn, ZoomOut } from "lucide-react"
import SearchBar from './searchbar'
import * as turf from '@turf/turf'
import Hamburger from './hamburger'
import Toolbox from './toolbox'
import Starfield from './starfield'
import Tutorial from './tutorial'
import { useDraw } from "./controls";
import { Calibrate, Link } from './foundry'
import Drawer from './drawer'
import Debug from './ui/debug'

let popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  maxWidth: "340px",
  className: "fade-in",
  offset: 15
})

const mouseMove = (e, wrapper, IS_GALAXY, name, IGNORE_POLY, mobile, modeRef) => {
  if (window.isMoving) {
    wrapper.panBy([offset.x - e.point.x, offset.y - e.point.y], {
      duration: 0,
    });
    window.offset = e.point;
  }
  // hover
  if (e.features.length > 0) {
    if (IGNORE_POLY.includes(e.features[0].properties.type)) return
    if (window.hoveredStateId) {
      wrapper.setFeatureState(
        { source: 'source', id: window.hoveredStateId },
        { hover: false }
      );
    }
    window.hoveredStateId = e.features[0].id
    wrapper.setFeatureState(
      { source: 'source', id: window.hoveredStateId },
      { hover: true }
    );
  }

  // popup
  if (e.features[0].properties.type === "text" || (mobile && modeRef.current === "measure")) return
  if (e.features[0].geometry.type === "Point") {
    // don't show tooltips if the sheet/drawer is open
    if (document.querySelector('#bottom-sheet')) return
  }

  const featureCoordinates = e.features[0].geometry.coordinates.toString()
  if (window.currentFeatureCoordinates !== featureCoordinates) {
    window.currentFeatureCoordinates = featureCoordinates

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
    if (e.features[0].geometry.type === "LineString" || e.features[0].geometry.type === "MultiLineString") {
      if (!e.lngLat) return
      coordinates = [e.lngLat.lng, e.lngLat.lat]
    }
    if (!coordinates) {
      console.error("failed to get coordinates", coordinates, e)
      return
    }
    popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap())
  }
}

const mouseLeave = (e, wrapper) => {
  if (typeof hoveredStateId === "undefined") return
  if (hoveredStateId !== null) {
    wrapper.setFeatureState(
      { source: 'source', id: window.hoveredStateId },
      { hover: false }
    );
  }
  window.hoveredStateId = null;

  window.currentFeatureCoordinates = undefined;
  // wrapper.getCanvas().style.cursor = ''
  const popupElement = document.querySelector('.maplibregl-popup');
  if (popupElement) {
    popupElement.classList.remove('fade-in');
  }
  popup.remove()
}

const mouseDown = (e) => {
  if (e.originalEvent.button === 2) {
    window.isMoving = true;
    window.offset = e.point;
  }
}

// remove popup when moving
const removePopup = () => {
  if (popup._container) popup.remove()
}

export default function Map({ width, height, locationGroups, data, name, mobile, params, locked, setCrashed, SEARCH_POINT_ZOOM, GENERATE_LOCATIONS, LAYOUT_OVERRIDE, IGNORE_POLY, UNIT, DISTANCE_CONVERTER, STYLES, IS_GALAXY, SEARCH_SIZE, GEO_EDIT, COORD_OFFSET, VIEW, GRID_DENSITY, MIN_ZOOM, MAX_ZOOM, SPEED }) {
  const { map: wrapper } = useMap()
  const [drawerContent, setDrawerContent] = useState()
  const { mode } = useMode()
  const recreateListeners = useDraw(s => s.recreateListeners)
  // get latest state for these values
  const modeRef = useRef(mode)
  const dataRef = useRef(data)
  const locationGroupsRef = useRef(locationGroups)
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { dataRef.current = data }, [data])
  useEffect(() => { locationGroupsRef.current = locationGroups }, [locationGroups])
  const mouseMoveRef = useRef(null)
  const mouseLeaveRef = useRef(null)
  const territoryClickRef = useRef(null)
  const locationClickRef = useRef(null)
  const removePopupRef = useRef(null)
  const mouseDownRef = useRef(null)
  const panMoveRef = useRef(null)
  const mouseUpRef = useRef(null)
  window.setDrawerContent = setDrawerContent


  function locationClick(e, manual) {
    if (modeRef.current === "measure" || (modeRef.current === "crosshair" && mobile) || locked) return
    const clicked = e?.features[0] || manual

    // skip search & pan if generated location
    if (clicked?.properties?.fake) {
      let myGroup
      if (drawerContent.d.properties.fake) {
        myGroup = drawerContent.myGroup
      } else {
        myGroup = drawerContent.myGroup
        // myGroup = [drawerContent.d, ...drawerContent.myGroup]
      }
      console.log(`clicked on ${clicked?.properties?.fake ? "fake" : "real"}, lets spill the beans`, myGroup, "d was", drawerContent.d)
      setDrawerContent({ coordinates: clicked.geometry.coordinates, selectedId: clicked.id || clicked.properties.id, myGroup, d: clicked })

      if (popup?._container) popup.remove()
      return
    }

    const index = locationGroupsRef.current
    if (!index) {
      console.error("ERR: spatial index failed")
      return
    }

    const [lng, lat] = clicked.geometry.coordinates

    console.log("lng", lng, "search", SEARCH_SIZE)

    // rbush uses a square but that's fine
    const rawNearby = index.search({
      minX: lng - Number(SEARCH_SIZE),
      minY: lat - Number(SEARCH_SIZE),
      maxX: lng + Number(SEARCH_SIZE),
      maxY: lat + Number(SEARCH_SIZE),
    })

    const myGroup = rawNearby
      .filter(item => item.feature.id !== clicked.id)
      .map(item => ({
        groupCenter: [lng, lat],
        ...item.feature
      }))

    pan(clicked, myGroup)

    if (popup._container) popup.remove()
  }

  const territoryClick = (e, wrapper, IGNORE_POLY, IS_GALAXY, name) => {
    if (IGNORE_POLY?.includes(e.features[0].properties.type) || modeRef.current === "measure") return
    const coordinates = e.lngLat;
    const popupContent = createPopupHTML(e, IS_GALAXY, name, setDrawerContent)
    if (mobile) {
      // place in center of screen
      popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap())
      const popupElement = document.querySelector(".maplibregl-popup");
      popupElement.style.top = "50%"
      popupElement.style.left = "50%"
      popupElement.style.transform = "translateX(-50%)"
    } else {
      popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap())
    }
  }

  // fit will be true if a search
  async function pan(d, myGroup, fit) {
    if (locked && !fit) return
    let lat, lng, bounds, coordinates = d.geometry.coordinates
    let zoom = wrapper.getZoom()
    // duplicate of what's in drawer.jsx recenter
    if (d.geometry.type === "Point") {
      [lng, lat] = coordinates

      // force a zoom if panning to location by search
      if (fit) {
        // console.log("DEBUG: point set zoom to ", (MAX_ZOOM - MIN_ZOOM) / 2, "from", wrapper.getZoom())
        zoom = MAX_ZOOM - ((MAX_ZOOM - MIN_ZOOM) / (2 + Number(IS_GALAXY ? 1 : 0)))
      }

    } else {

      // find center of territory or guide
      const centroid = turf.centroid(d)
      coordinates = centroid.geometry.coordinates
      lng = coordinates[0]
      lat = coordinates[1]

      // zoom view to fit territory or guide when searched

      if (fit) {
        // console.log("DEBUG: polygon set zoom to ", turf.bbox(d), "from", wrapper.getZoom())
        bounds = turf.bbox(d)
      }
    }

    // attempt to add some offset if zoomed out
    if (zoom > ((MAX_ZOOM - MIN_ZOOM) / 2) && fit) {
      const arbitraryNumber = 13
      let zoomFactor = Math.pow(2, arbitraryNumber - wrapper.getZoom())
      zoomFactor = Math.max(zoomFactor, 4)
      const latDiff = (wrapper.getBounds().getNorth() - wrapper.getBounds().getSouth()) / zoomFactor
      lat = coordinates[1] - latDiff / 2
      console.log('DEBUG: adding', latDiff / 2, " latitude compensation to zoom level")
    }

    if (bounds) {
      // console.log("DEBUG: pan using bounds", bounds)

      wrapper.fitBounds([
        [bounds[0], bounds[1]], // bottom-left corner
        [bounds[2], bounds[3]]  // top-right corner
      ], {
        duration: 800,
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    } else {
      wrapper.flyTo({ center: [lng, lat], duration: 700, zoom })

      // Hacky solution since trying to offset for the drawer when zoomed out is hard
      // this will wait until more zoomed and closer to the target to then attempt
      // offset for drawer (2/2)

      // setTimeout(() => {
      //   const arbitraryNumber = 9
      //   let zoomFactor = Math.pow(2, arbitraryNumber - wrapper.getZoom())
      //   zoomFactor = Math.max(zoomFactor, 4)
      //   const latDiff = (wrapper.getBounds().getNorth() - wrapper.getBounds().getSouth()) / zoomFactor
      //   lat = coordinates[1] - latDiff / 2
      //   wrapper.flyTo({ center: [lng, lat], duration: 1_000, zoom })
      // }, 600)
    }

    if (d.geometry.type === "Point") {
      setDrawerContent({ coordinates, selectedId: d.id, myGroup, d })
    }
  }

  useEffect(() => {
    // local dev testing functions
    window.localSet = localSet
    window.localGet = getMaps

    // create Listeners
    mouseMoveRef.current = e => mouseMove(e, wrapper, IS_GALAXY, name, IGNORE_POLY, mobile, modeRef)
    mouseLeaveRef.current = e => mouseLeave(e, wrapper)
    territoryClickRef.current = e => territoryClick(e, wrapper, IGNORE_POLY, IS_GALAXY, name)
    locationClickRef.current = locationClick
    removePopupRef.current = removePopup
    mouseDownRef.current = mouseDown
    // panMoveRef.current = panMove
    // mouseUpRef.current = () => { isMoving = false }
  }, [])

  useEffect(() => {
    if (!wrapper) return
    if (params.get("img")) {
      wrapper.on('load', async ({ target: map }) => {

        // hide labels since map notes will be created
        const userCreated = map.querySourceFeatures('source', {
          sourceLayer: "location",
          filter: ['==', ['get', 'userCreated'], true]
        })
        // TODO: I changed it so you need to instead hook into the standard
        // "text-opacity" instead of using a feature state thing. This will break
        // this current feature but allow for better user customization
        // the board of coding approved this message
        //
        // previous solution
        // userCreated.forEach(({ id }) => {
        //   map.setFeatureState(
        //     { source: 'source', id },
        //     { hideLabel: true },
        //   )
        // })

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

    if (name === "starwars" || name === "alien" || name === "fallout") {
      const { formatLabels } = gridHelpers(name, GRID_DENSITY || 1)
      new GeoGrid({
        map: wrapper.getMap(),
        // beforeLayerId: 'line',
        gridDensity: () => GRID_DENSITY || 1,
        formatLabels,
        gridStyle: {
          color: `rgba(255, 255, 255, ${name === "fallout" ? 0.02 : 0.03})`,
          width: 2,
        },
        labelStyle: {
          color: 'white',
          fontSize: 24,
          // textShadow: '0 0 10px rgba(0, 0, 0)',
        },
      })
    }

    // wrapper.on("mousemove", panMoveRef.current)
    // wrapper.on("mouseup", mouseUpRef.current)
    wrapper.on("mousedown", mouseDownRef.current)
    wrapper.on("move", removePopupRef.current)
    wrapper.on("mousemove", "location", mouseMoveRef.current)
    wrapper.on("mouseleave", "location", mouseLeaveRef.current)
    wrapper.on("mousemove", "line", mouseMoveRef.current)
    wrapper.on("mouseleave", "line", mouseLeaveRef.current)
    wrapper.on("click", "polygon-background", territoryClickRef.current)
    wrapper.on("click", "polygon-foreground", territoryClickRef.current)
    wrapper.on("click", "polygon-user", territoryClickRef.current)
    wrapper.on("click", "location", locationClickRef.current)

    // crash detection
    const checkWebGLCrash = () => {
      if (wrapper.getMap().getCanvas().getContext("webgl2").drawingBufferFormat === 0) {
        console.error("🛑 Maplibre Canvas WebGL crashed, forcing Map remount")
        setCrashed(prev => prev + 1)
      }
    }



    const interval = setInterval(checkWebGLCrash, 1_500) // check every 1.5s
    return () => {
      clearInterval(interval)
      // Remove all
      // wrapper.off("mousemove", panMoveRef.current)
      // wrapper.off("mouseup", mouseUpRef.current)
      wrapper.off("move", removePopupRef.current)
      wrapper.off("mousedown", mouseDownRef.current)
      wrapper.off("mousemove", "location", mouseMoveRef.current)
      wrapper.off("mouseleave", "location", mouseLeaveRef.current)
      wrapper.off("mousemove", "line", mouseMoveRef.current)
      wrapper.off("mouseleave", "line", mouseLeaveRef.current)
      wrapper.off("click", "polygon-background", territoryClickRef.current)
      wrapper.off("click", "polygon-foreground", territoryClickRef.current)
      wrapper.off("click", "polygon-user", territoryClickRef.current)
      wrapper.off("click", "location", locationClickRef.current)
    }
  }, [wrapper, recreateListeners, params.get("preview"), mode, locationGroups, data])

  useEffect(() => {
    // minimap fit to bounds of feature from query params
    if (!wrapper || !params.get("type") || !params.get("name")) return
    const feature = data.features.find(f => {
      if (f.geometry.type !== params.get("type")) return
      if (f.properties.name !== params.get("name")) return
      let coord = f.geometry.coordinates.join(",")
      if (f.geometry.type.includes("Poly") || f.geometry.type.includes("LineString")) {
        const centroid = turf.centroid(f)
        coord = centroid.geometry.coordinates.join(",")
      }
      if (coord !== `${params.get("lng")},${params.get("lat")}`) return
      return true
    })
    if (!feature) return
    if (feature.geometry.type !== "Point") {
      const bounds = turf.bbox(feature)
      wrapper.fitBounds([
        [bounds[0], bounds[1]], // bottom-left corner
        [bounds[2], bounds[3]], // top-right corner
      ], {
        duration: 800,
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
      })
    } else {
      wrapper.flyTo({
        center: feature.geometry.coordinates,
        zoom: MAX_ZOOM - ((MAX_ZOOM - MIN_ZOOM) / 2),
        duration: 800
      });
    }
    wrapper.setFeatureState(
      { source: 'source', id: feature.id },
      { hover: true }
    );
  }, [wrapper, params.get("name"), params.get("lat"), params.get("lng"), data, params.get("type")])

  // add all custom icons
  if (wrapper) {
    data.features.forEach(f => {
      if (f.properties.icon) {
        if (!wrapper.hasImage(f.properties.icon)) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.width = 19
          img.height = 19
          if (f.properties.icon.includes("/api/img/")) {
            // img.width = 24
            // img.height = 24
            img.width = 16
            img.height = 16
          }
          img.src = f.properties.icon
          img.onload = () => {
            if (!wrapper.hasImage(f.properties.icon)) {
              wrapper.addImage(f.properties.icon, img, { sdf: true })
            }
          }
        }
      }
    })
  }

  /*
  TODO:
  ## Map fine tuning
  - sw location need to be separated into CANON / LEGENDS
  - do a webgl check https://maplibre.org/maplibre-gl-js/docs/examples/check-for-support/
  */

  // TODO: get full coverage for these
  // placement point (Polygon, Point, Point text)
  // placement line
  // prev = https://github.com/CodaBool/stargazer-proxy/blob/main/components/map.jsx

  return (
    <>
      <Source id="source" type="geojson" data={data}>
        <Layer
          type="fill"
          id="polygon-background"
          layout={{
            "fill-sort-key": ["case", ["has", "priority"], ["get", "priority"], 5]
          }}
          paint={getPaint(name, "fill", "polygon-background", STYLES)}
          filter={["all", ["!=", "type", "bg-texture"], ["==", "$type", "Polygon"]]}
        />
        <Layer
          type="fill"
          layout={{
            "fill-sort-key": ["case", ["has", "priority"], ["get", "priority"], 5]
          }}
          id="polygon-foreground"
          paint={getPaint(name, "fill", "polygon-foreground", STYLES)}
          filter={["all", ["==", "type", "bg-texture"], ["==", "$type", "Polygon"]]}
        />
        <Layer
          type="line"
          id="line"
          paint={getPaint(name, "line", "line", STYLES)}
          filter={['==', '$type', 'LineString']}
        />
        <Layer
          type="fill"
          id="polygon-user"
          paint={getPaint(name, "fill", "polygon-user", STYLES)}
          filter={["all", ["==", "userCreated", true], ["==", "$type", "Polygon"]]}
        />
        <Layer
          type="symbol"
          id="polygon-label"
          layout={{
            "symbol-placement": "point",
            // "text-overlap": "never",
            "text-allow-overlap": name === "cyberpunk",
            "text-rotate": 30,
            "text-transform": "uppercase",
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
          }}
          filter={["all", ["!=", "type", "line"], ["!=", "type", "bg"], ["!=", "type", "bg-texture"], ["==", "$type", "Polygon"]]}
          paint={getPaint(name, "symbol", "polygon-label", STYLES)}
        />
        <Layer
          type="symbol"
          id="line-label"
          layout={{
            "symbol-placement": "line",
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 15,
            "text-letter-spacing": 0.07
          }}
          paint={getPaint(name, "symbol", "line-label", STYLES)}
          filter={[
            'all',
            ['!=', 'no-label', true],
            ['==', '$type', 'LineString'],
          ]}
        />
        <Layer
          type="symbol"
          id="location"
          layout={{
            "icon-optional": true, // default false
            "text-optional": true, // default false
            // "icon-overlap": "never",
            "icon-size": ["get", "icon-size"],
            "text-offset": [0, 1.8],
            "icon-padding": 0, // default 2
            "text-padding": 0, // default 2
            "symbol-sort-key": ["case", ["has", "symbol-sort-key"], ["get", "symbol-sort-key"], 5],
            // "text-overlap": "never",
            "text-rotate": ["get", "text-rotate"],
            "icon-image": [
              "coalesce",
              ["get", "icon"],
              ["get", "type"],
            ],
            "text-transform": ['get', "text-transform"],
            "text-size": [
              'coalesce',
              ['get', "text-size"],
              12
            ],
            "text-field": ['get', "name"],
            "text-font": ["Noto Sans Bold"],
            ...LAYOUT_OVERRIDE
          }}
          paint={getPaint(name, "symbol", "location", STYLES)}
          filter={['==', '$type', 'Point']}
        />
      </Source>
      {IS_GALAXY && <Starfield width={width} height={height} BOUNDS={VIEW.maxBounds} />}
      {params.get("zoom") !== "0" && <div className="absolute mt-28 ml-11 mr-[.3em] cursor-pointer z-10 bg-[rgba(0,0,0,.3)] rounded-xl zoom-controls" style={{ transition: 'bottom 0.5s ease-in-out' }}>
        <ZoomIn size={34} onClick={() => wrapper.zoomIn()} className='m-2 hover:stroke-blue-200' />
        <ZoomOut size={34} onClick={() => wrapper.zoomOut()} className='m-2 mt-4 hover:stroke-blue-200' />
      </div>}
      {params.get("search") !== "0" && <SearchBar map={wrapper} name={name} data={data} pan={pan} mobile={mobile} groups={locationGroups} UNIT={UNIT} STYLES={STYLES} SEARCH_SIZE={SEARCH_SIZE} />}
      {/* FOUNDRY */}
      {params.get("secret") && <Link width={width} height={height} mobile={mobile} name={name} params={params} />}
      {params.get("calibrate") && <Calibrate width={width} height={height} mobile={mobile} name={name} IS_GALAXY={IS_GALAXY} />}
      <Debug />
      {!locked && <Tutorial name={name} IS_GALAXY={IS_GALAXY} />}
      {!locked && <Drawer {...drawerContent} passedLocationClick={locationClick} drawerContent={drawerContent} setDrawerContent={setDrawerContent} name={name} IS_GALAXY={IS_GALAXY} GEO_EDIT={GEO_EDIT} VIEW={VIEW} GENERATE_LOCATIONS={GENERATE_LOCATIONS} GRID_DENSITY={GRID_DENSITY || 1} COORD_OFFSET={COORD_OFFSET} SEARCH_SIZE={SEARCH_SIZE} mobile={mobile} width={width} height={height} />}
      <Toolbox params={params} width={width} height={height} mobile={mobile} name={name} map={wrapper} DISTANCE_CONVERTER={DISTANCE_CONVERTER} IS_GALAXY={IS_GALAXY} UNIT={UNIT} COORD_OFFSET={COORD_OFFSET} GRID_DENSITY={GRID_DENSITY} SPEED={SPEED} />
      {params.get("hamburger") !== "0" && <Hamburger name={name} params={params} map={wrapper} mobile={mobile} />}
    </>
  )
}
