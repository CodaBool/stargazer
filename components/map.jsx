'use client'
import maplibregl, {
  MapMouseEvent,
  LngLat,
  LngLatBounds,
} from 'maplibre-gl'
import { useMap, Layer, Source, Popup } from 'react-map-gl/maplibre'
import { useEffect, useRef, useState } from 'react'
import { getColorExpression, createPopupHTML, hexToRgb, localSet, getMaps, useStore, useMode } from "@/lib/utils.js"
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

let popup = new maplibregl.Popup({
  closeButton: false,
  offset: [0, 20],
  closeOnClick: false,
  maxWidth: "340px",
  anchor: "top",
  className: "fade-in"
})

const mouseMove = (e, wrapper, IS_GALAXY, name, IGNORE_POLY) => {
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
  if (e.features[0].properties.type === "text") return
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

const territoryClick = (e, wrapper, IGNORE_POLY, IS_GALAXY, name) => {
  if (IGNORE_POLY?.includes(e.features[0].properties.type)) return
  const coordinates = e.lngLat;
  const popupContent = createPopupHTML(e, IS_GALAXY, name)
  popup.setLngLat(coordinates).setHTML(popupContent).addTo(wrapper.getMap());
}

// remove popup when moving
const removePopup = () => {
  if (popup._container) popup.remove()
}

export default function Map({ width, height, locationGroups, data, name, mobile, params, locked, setCrashed, SEARCH_POINT_ZOOM, GENERATE_LOCATIONS, LAYOUT_OVERRIDE, IGNORE_POLY, UNIT, DISTANCE_CONVERTER, STYLES, IS_GALAXY, SEARCH_SIZE, GEO_EDIT }) {
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


  function locationClick(e, manual) {
    if (modeRef.current === "measure" || (modeRef.current === "crosshair" && mobile) || locked) return

    const clicked = e?.features[0] || manual
    const index = locationGroupsRef.current
    if (!index) {
      console.error("ERR: spatial index failed")
      return
    }

    const [lng, lat] = clicked.geometry.coordinates

    // rbush uses a square but that's fine
    const rawNearby = index.search({
      minX: lng - SEARCH_SIZE,
      minY: lat - SEARCH_SIZE,
      maxX: lng + SEARCH_SIZE,
      maxY: lat + SEARCH_SIZE
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

  async function pan(d, myGroup, fit) {
    if (locked && !fit) return
    let fly = true, lat, lng, bounds, coordinates = d.geometry.coordinates
    let zoom = wrapper.getZoom()

    // duplicate of what's in drawer.jsx recenter
    if (d.geometry.type === "Point") {
      [lng, lat] = coordinates

      // force a zoom if panning to location by search
      if (fit) zoom = SEARCH_POINT_ZOOM

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
    }

    // offset for drawer (1/2)
    if (!fit) {
      const arbitraryNumber = 9
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
        wrapper.flyTo({ center: [lng, lat], duration: 700, zoom })

        // Hacky solution since trying to offset for the drawer when zoomed out is hard
        // this will wait until more zoomed and closer to the target to then attempt
        // offset for drawer (2/2)
        setTimeout(() => {
          const arbitraryNumber = 9
          let zoomFactor = Math.pow(2, arbitraryNumber - wrapper.getZoom())
          zoomFactor = Math.max(zoomFactor, 4)
          const latDiff = (wrapper.getBounds().getNorth() - wrapper.getBounds().getSouth()) / zoomFactor
          lat = coordinates[1] - latDiff / 2
          wrapper.flyTo({ center: [lng, lat], duration: 1_000, zoom })
        }, 600)
      }
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
    mouseMoveRef.current = e => mouseMove(e, wrapper, IS_GALAXY, name, IGNORE_POLY)
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

    // wrapper.on("mousemove", panMoveRef.current)
    // wrapper.on("mouseup", mouseUpRef.current)
    wrapper.on("mousedown", mouseDownRef.current)
    wrapper.on("move", removePopupRef.current)
    wrapper.on("mousemove", "location", mouseMoveRef.current)
    wrapper.on("mouseleave", "location", mouseLeaveRef.current)
    wrapper.on("mousemove", "guide", mouseMoveRef.current)
    wrapper.on("mouseleave", "guide", mouseLeaveRef.current)
    wrapper.on("click", "territory", territoryClickRef.current)
    wrapper.on("click", "location", locationClickRef.current)


    if (name === "cyberpunk") {
      wrapper.getMap().on('load', () => {
        if (!wrapper.getMap().getSource('custom-image')) {
          wrapper.getMap().addSource('custom-image', {
            type: 'image',
            url: 'https://img.codabool.com/nc_positioned_scaled.webp',
            "coordinates": [
              // <->, |
              [-3, 3], // top left
              [3, 3], // top right
              [3, -3], // bottom right
              [-3, -3], // bottom left
            ]
          })
        }
        if (!wrapper.getMap().getLayer('custom-image-layer')) {
          wrapper.getMap().addLayer({
            id: 'custom-image-layer',
            type: 'raster',
            source: 'custom-image',
          })
        }
      });

      // if (!wrapper.hasImage("water-0")) {
      //   const img = new Image()
      //   img.crossOrigin = "anonymous"
      //   img.width = 64
      //   img.height = 64
      //   img.src = '/1.png'
      //   img.onload = () => {
      //     wrapper.addImage("water-0", img, { sdf: true })
      //   }
      // }


      // wrapper.getMap().addLayer({
      //   id: 'road-lines',
      //   type: 'line',
      //   source: 'roads',
      //   layout: {
      //     'line-cap': 'round',
      //     'line-join': 'round'
      //   },
      //   paint: {
      //     'line-color': [
      //       'match',
      //       ['get', 'type'],
      //       'main', '#ff00ff',
      //       'side', '#888888',
      //       '#ffffff' // fallback
      //     ],
      //     'line-width': 3
      //   }
      // });

      // wrapper.getMap().addLayer({
      //   id: 'road-labels',
      //   type: 'symbol',
      //   source: 'source',
      //   layout: {
      //     'symbol-placement': 'line',   // ← follows road geometry
      //     'text-field': ['get', 'name'],
      //     'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      //     'text-size': 12,
      //     'text-letter-spacing': 0.05
      //   },
      //   paint: {
      //     'text-color': '#ffffff',
      //     'text-halo-color': '#000000',
      //     'text-halo-width': 1.5,
      //   }
      // });

      // // Add fill layer using pattern
      // wrapper.getMap().addLayer({
      //   id: 'rocky-fill',
      //   type: 'fill',
      //   source: 'roads',
      //   paint: {
      //     'fill-color': 'red',
      //     'fill-opacity': 0.4
      //   }
      // });
      // wrapper.getMap().addLayer({
      //   id: 'rocky-pattern',
      //   type: 'fill',
      //   source: 'roads',
      //   paint: {
      //     'fill-pattern': 'water-1'
      //   }
      // });

      // set to different images
      // works, just would require something subtle
      // let frame = 0;
      // setInterval(() => {
      //   wrapper.getMap().setPaintProperty('rocky-pattern', 'fill-pattern', `water-${frame}`);
      //   frame = (frame + 1) % 2;
      // }, 500);
    }


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
      wrapper.off("move", removePopupRef.current)
      // wrapper.off("mousedown", mouseDownRef.current)
      // wrapper.off("mousemove", panMoveRef.current)
      // wrapper.off("mouseup", mouseUpRef.current)
      wrapper.off("mousemove", "location", mouseMoveRef.current)
      wrapper.off("mouseleave", "location", mouseLeaveRef.current)
      wrapper.off("mousemove", "guide", mouseMoveRef.current)
      wrapper.off("mouseleave", "guide", mouseLeaveRef.current)
      wrapper.off("click", "territory", territoryClickRef.current)
      wrapper.off("click", "location", locationClickRef.current)
    }
  }, [wrapper, recreateListeners, params.get("preview"), mode, locationGroups, data])

  useEffect(() => {
    if (!wrapper || !params.get("type") || !params.get("name")) return
    const feature = data.features.find(f => {
      if (f.geometry.type !== params.get("type")) return
      if (f.properties.name !== params.get("name")) return
      let coord = f.geometry.coordinates.join(",")
      if (f.geometry.type.includes("Poly") || f.geometry.type === "LineString") {
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
          img.src = f.properties.icon
          img.onload = () => {
            wrapper.addImage(f.properties.icon, img, { sdf: true })
          }
        }
      }
    })
  }

  /*
  TODO:
  ## Map fine tuning
  - sw location need to be separated into CANON / LEGENDS
  - sw needs the grid
  - sw has its own coordinate system
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
          paint={{
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1.5,
          }}
          // filter={["all", ["==", "type", "line"], ["==", "$type", "Polygon"]]}
          layout={{
            'symbol-placement': 'line',   // ← follows road geometry
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-letter-spacing': 0.05
          }}
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
            "icon-size": 1,
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
            ...LAYOUT_OVERRIDE || {},
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
            "line-color": getColorExpression(name, "stroke", "LineString"),
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
            "text-size": 11,
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
      {params.get("search") !== "0" && <SearchBar map={wrapper} name={name} data={data} pan={pan} mobile={mobile} groups={locationGroups} UNIT={UNIT} STYLES={STYLES} SEARCH_SIZE={SEARCH_SIZE} />}

      {/* FOUNDRY */}
      {params.get("secret") && <Link width={width} height={height} mobile={mobile} name={name} params={params} />}
      {params.get("calibrate") && <Calibrate width={width} height={height} mobile={mobile} name={name} IS_GALAXY={IS_GALAXY} />}

      <Tutorial name={name} IS_GALAXY={IS_GALAXY} />
      <Drawer {...drawerContent} passedLocationClick={locationClick} drawerContent={drawerContent} setDrawerContent={setDrawerContent} name={name} height={height} IS_GALAXY={IS_GALAXY} GEO_EDIT={GEO_EDIT} GENERATE_LOCATIONS={GENERATE_LOCATIONS} mobile={mobile} />

      <Toolbox params={params} width={width} height={height} mobile={mobile} name={name} map={wrapper} DISTANCE_CONVERTER={DISTANCE_CONVERTER} IS_GALAXY={IS_GALAXY} UNIT={UNIT} />
      {params.get("hamburger") !== "0" && <Hamburger name={name} params={params} map={wrapper} mobile={mobile} />}
    </>
  )
}
