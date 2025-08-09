import { useEffect } from 'react'
import { Layer, Source } from '@vis.gl/react-maplibre'
import * as turf from '@turf/turf'
import { debounce, useMode, getMaps } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const linestring = {
  'type': 'Feature',
  'geometry': {
    'type': 'LineString',
    'coordinates': []
  }
}
let text, tutorial, crosshairX, crosshairY

export default function Toolbox({ map, width, params, height, mobile, name, IS_GALAXY, DISTANCE_CONVERTER, UNIT, COORD_OFFSET }) {
  const { mode, setMode } = useMode()
  const router = useRouter()
  const offset = COORD_OFFSET || [0, 0]

  // Projects [lng, lat] to Mercator meters, using projection EPSG:3857
  function mercatorLength(lineString) {
    const R_MAJOR = 6378137.0
    function project([lng, lat]) {
      const x = R_MAJOR * (lng * Math.PI / 180)
      const y = R_MAJOR * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))
      return [x, y]
    }
    const coords = lineString.geometry.coordinates.map(project)
    let length = 0
    for (let i = 1; i < coords.length; i++) {
      const [x1, y1] = coords[i - 1]
      const [x2, y2] = coords[i]
      const dx = x2 - x1
      const dy = y2 - y1
      length += Math.sqrt(dx * dx + dy * dy)
    }
    // return in kilometers (since meters by default)
    return length / 1000
  }

  function handleClick(e) {
    if (mode !== "measure" || !map) return

    const features = map.queryRenderedFeatures(e.point, {
      layers: ['measure-points']
    })

    // TODO: this will sometimes throw a map is undefined error, but returning early doesn't work
    // test to find out what could be happening
    const geojson = map.getSource('toolbox')._data

    // Remove the linestring from the group
    // So we can redraw it based on the points collection
    if (geojson.features.length > 1) geojson.features.pop();

    // If a feature was clicked, remove it from the map
    if (features.length) {
      const id = features[0].properties.id;
      geojson.features = geojson.features.filter((point) => {
        return point.properties.id !== id;
      });
    } else {
      const point = {
        'type': 'Feature',
        'geometry': {
          'type': 'Point',
          'coordinates': [e.lngLat.lng, e.lngLat.lat]
        },
        'properties': {
          'id': String(new Date().getTime())
        }
      };

      geojson.features.push(point);
    }

    if (geojson.features.length > 1) {
      linestring.geometry.coordinates = geojson.features.map(
        (point) => {
          return point.geometry.coordinates;
        }
      )

      geojson.features.push(linestring)

      let km
      if (IS_GALAXY) {
        km = mercatorLength(linestring)
      } else {
        km = turf.length(linestring)
      }
      const distance = km * DISTANCE_CONVERTER

      /*
      distance explaination:
      - STARWARS: FFG has covering whole galaxy in 14 days for class 1.0
      */

      if (UNIT === "miles" || UNIT === "mi") {
        const walkingSpeedMph = 3 // average walking speed in miles per hour
        const walkingTimeHours = distance / walkingSpeedMph
        text.textContent = `${distance.toFixed(1)} miles | ${walkingTimeHours.toFixed(1)} hours on foot (3mph)`
      } else if (UNIT === "ly") {
        if (name === "starwars") {
          const vehicleSpeedLyPerHour = 300
          let relativeTime = (distance / vehicleSpeedLyPerHour) / 24
          let relTimeUnit = "days"
          if (relativeTime < 1) {
            relativeTime = relativeTime * 24
            relTimeUnit = "hours"
          }
          text.textContent = `${distance.toFixed(1)}${UNIT} | ${relativeTime.toFixed(1)} ${relTimeUnit} | class 1.0`
        } else {
          let relativeTime = (distance / Math.sinh(Math.atanh(0.995))).toFixed(1)
          let relTimeUnit = "years"
          if (relativeTime < 1) {
            relativeTime = (relativeTime * 12).toFixed(1);
            relTimeUnit = "months";
          }
          text.textContent = `${distance.toFixed(1)}${UNIT} | ${relativeTime} rel. ${relTimeUnit} (.995u) | ${(distance / 0.995).toFixed(1)} observer years`
        }
      } else {
        text.textContent = `${distance.toFixed(1)}${UNIT}`
      }
      text.style.visibility = 'visible'

      // show tutorial text now
      tutorial.textContent = `Toggle measure off to reset`
      tutorial.style.visibility = 'visible'
    }

    map.getSource('toolbox').setData(geojson)
  }

  function handleMove() {
    if (mode === "crosshair") {
      const { lng, lat } = map.getCenter()
      crosshairX.style.visibility = 'visible'
      crosshairY.style.visibility = 'visible'
      const x = (lng + offset[0]).toFixed(3)
      const y = (lat + offset[1]).toFixed(3)
      if (IS_GALAXY) {
        text.textContent = `Y: ${y} | X: ${x}`;
      } else {
        text.textContent = `Lat: ${y}° | Lng: ${x}°`;
      }
      text.style.visibility = 'visible'
    }
  }

  useEffect(() => {
    if (!map) return
    if (params.get("c") && mode !== "crosshair" && !mode) {
      setMode("crosshair")
    }

    const crosshairLength = height / 5

    // Find the parent of the <div mapboxgl-children> element
    const mapboxChildrenParent = document.querySelector('div[mapboxgl-children=""]')

    // horizontal line
    crosshairX = document.createElement('div')
    crosshairX.className = 'crosshair crosshair-x'
    crosshairX.style.position = 'absolute'
    crosshairX.style.top = '50%'
    crosshairX.style.left = '50%'
    crosshairX.style.height = '1px'
    crosshairX.style.zIndex = 2;
    crosshairX.style.visibility = 'hidden'
    crosshairX.style.border = '1px dashed rgba(255, 255, 255, 0.5)'
    crosshairX.style.width = `${Math.min(Math.max(crosshairLength, 50), width - 50)}px`
    crosshairX.style.transform = 'translateX(-50%)'
    mapboxChildrenParent.appendChild(crosshairX)

    // vertical line
    crosshairY = document.createElement('div')
    crosshairY.className = 'crosshair crosshair-y'
    crosshairY.style.position = 'absolute'
    crosshairY.style.top = '50%'
    crosshairY.style.left = '50%'
    crosshairY.style.width = '1px'
    crosshairY.style.zIndex = 2;
    crosshairY.style.visibility = 'hidden'
    crosshairY.style.border = '1px dashed rgba(255, 255, 255, 0.5)'
    crosshairY.style.height = `${Math.min(Math.max(crosshairLength, 50), height - 50)}px`
    crosshairY.style.transform = 'translateY(-50%)'
    mapboxChildrenParent.appendChild(crosshairY);

    // output text
    text = document.createElement('div')
    text.className = 'textbox'
    text.style.position = 'absolute'
    text.style.left = '50%';
    text.style.lineHeight = '1.4'
    text.style.zIndex = 2;
    text.style.transform = 'translateX(-50%)';
    text.style.top = mobile ? '70px' : '90px'
    text.style.color = 'white'
    text.style.opacity = 0.8
    text.style.fontSize = mobile ? '1.5em' : '2.2em'
    text.style.pointerEvents = 'none'
    text.style.visibility = 'hidden'
    text.style.textAlign = 'center'
    mapboxChildrenParent.appendChild(text)

    // tutorial text
    tutorial = document.createElement('div')
    tutorial.className = 'textbox'
    tutorial.style.position = 'absolute'
    tutorial.style.left = '50%';
    tutorial.style.lineHeight = '1.4'
    tutorial.style.zIndex = 2;
    tutorial.style.transform = 'translateX(-50%)';
    tutorial.style.top = mobile ? '160px' : '140px'
    tutorial.style.color = 'white'
    tutorial.style.opacity = 0.5
    tutorial.style.fontSize = mobile ? '1.2em' : '1.8em'
    tutorial.style.pointerEvents = 'none'
    tutorial.style.visibility = 'hidden'
    tutorial.style.textAlign = 'center'
    mapboxChildrenParent.appendChild(tutorial)

    map.on('click', handleClick)

    // Crosshair Logic
    map.on('move', handleMove)
    // map.on('mousemove', "measure-points", () => {
    //   map.getCanvas().style.cursor = 'pointer'
    // })
    // map.on('mouseleave', "measure-points", () => {
    //   map.getCanvas().style.cursor = 'grab'
    // })

    const updateLiveDistance = debounce((e) => {
      if (mode === "crosshair") return

      // TODO: this will sometimes throw a map is undefined error, but returning early doesn't work
      // test to find out what could be happening
      const source = map.getSource('toolbox')
      if (!source) return
      const geojson = source._data

      const points = geojson.features.filter(f => f.geometry.type === "Point")
      const existingLineIndex = geojson.features.findIndex(f => f.geometry.type === "LineString")

      // Remove old live line if present
      if (existingLineIndex !== -1) {
        geojson.features.splice(existingLineIndex, 1)
      }

      if (points.length === 0) {
        source.setData(geojson)
        return
      }

      // Construct live line from existing points + current mouse position
      const coords = points.map(p => p.geometry.coordinates)
      const liveLine = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [...coords, [e.lngLat.lng, e.lngLat.lat]]
        }
      }

      geojson.features.push(liveLine)

      let km
      if (IS_GALAXY) {
        km = mercatorLength(liveLine)
      } else {
        km = turf.length(liveLine)
      }
      const distance = km * DISTANCE_CONVERTER
      // console.log("km", km)

      if (UNIT === "miles" || UNIT === "mi") {
        const walkingSpeedMph = 3 // average walking speed in miles per hour
        const walkingTimeHours = distance / walkingSpeedMph
        text.textContent = `${distance.toFixed(1)} miles | ${walkingTimeHours.toFixed(1)} hours on foot (3mph)`
      } else if (UNIT === "ly") {
        if (name === "starwars") {
          const vehicleSpeedLyPerHour = 300
          let relativeTime = (distance / vehicleSpeedLyPerHour) / 24
          let relTimeUnit = "days"
          if (relativeTime < 1) {
            relativeTime = relativeTime * 24
            relTimeUnit = "hours"
          }
          text.textContent = `${distance.toFixed(1)}${UNIT} | ${relativeTime.toFixed(1)} ${relTimeUnit} | class 1.0`
        } else {
          let relativeTime = (distance / Math.sinh(Math.atanh(0.995))).toFixed(1)
          let relTimeUnit = "years"
          if (relativeTime < 1) {
            relativeTime = (relativeTime * 12).toFixed(1);
            relTimeUnit = "months";
          }
          text.textContent = `${distance.toFixed(1)}${UNIT} | ${relativeTime} rel. ${relTimeUnit} (.995u) | ${(distance / 0.995).toFixed(1)} observer years`
        }
      } else {
        text.textContent = `${distance.toFixed(1)}${UNIT}`
      }

      text.style.visibility = 'visible'
      source.setData(geojson)
    }, 1)


    if (!mobile) {
      map.on('mousemove', updateLiveDistance)
    }

    const source = map.getSource('toolbox')

    // Clear all UI and mode state
    text.style.visibility = 'hidden'
    document.querySelectorAll('.crosshair').forEach(el => el.style.visibility = 'hidden')

    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: []
      })
    }

    if (mode === "crosshair") {
      const { lng, lat } = map.getCenter()
      document.querySelectorAll('.crosshair').forEach(el => el.style.visibility = "visible")
      const x = (lng + offset[0]).toFixed(3)
      const y = (lat + offset[1]).toFixed(3)
      if (IS_GALAXY) {
        text.textContent = `Y: ${y} | X: ${x}`;
      } else {
        text.textContent = `Lat: ${y}° | Lng: ${x}°`;
      }
      text.style.visibility = 'visible'
    } else if (mode === "measure") {
      text.textContent = `${mobile ? 'Tap two points' : 'Click'} to begin measuring`
      text.style.visibility = 'visible'
    }

    const handleKeyDown = async event => {

      // verify that the user is not typing somewhere
      const searchbarFocused = document.querySelector('input[cmdk-input]') === document.activeElement;
      const tableInEditMode = !!document.querySelector('table input')
      if (searchbarFocused || tableInEditMode) return

      if (event.code === "KeyC") {
        setMode(mode === "crosshair" ? null : "crosshair")
      } else if (event.code === "KeyZ") {
        setMode(mode === "measure" ? null : "measure")
      } else if (event.code === "KeyP" || event.code === "KeyB") {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("preview")) {
          router.push(`/${name}?id=${urlParams.get("id")}`)
        } else {
          // will break if the map doesn't exist, so let's check for it
          const maps = await getMaps()
          if (maps.hasOwnProperty(`${name}-${urlParams.get("id")}`)) {
            router.push(`/${name}?id=${urlParams.get("id")}&preview=1`)
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      mapboxChildrenParent.removeChild(crosshairX)
      mapboxChildrenParent.removeChild(crosshairY)
      mapboxChildrenParent.removeChild(text)
      mapboxChildrenParent.removeChild(tutorial)
      window.removeEventListener("keydown", handleKeyDown)
      map.off('click', handleClick)
      map.off('move', handleMove)
      map.off('mouseleave', "measure-points", () => {
        if (!mobile) {
          map.off('mousemove', updateLiveDistance)
        }
        map.getCanvas().style.cursor = 'grab'
      })
      map.off('mousemove', "measure-points", () => {
        map.getCanvas().style.cursor = 'pointer'
      })
    }
  }, [map, mode])



  return (
    <Source id="toolbox" type="geojson" data={{
      type: 'FeatureCollection',
      features: []
    }}>
      <Layer
        type="circle"
        id="measure-points"
        paint={{
          'circle-radius': 4,
          'circle-color': 'orange'
        }}
        filter={['==', '$type', 'Point']}
      />
      <Layer
        type="line"
        id="measure-lines"
        layout={{
          'line-cap': 'round',
          'line-join': 'round'
        }}
        paint={{
          'line-color': 'rgba(255, 165, 0, 0.8)',
          'line-width': 2,
          "line-dasharray": [5, 4],
        }}
        filter={['==', '$type', 'LineString']}
      />
    </Source>
  )
}
