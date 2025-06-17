import { useEffect } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import * as turf from '@turf/turf'
import { debounce, useMode, useStore, windowLocalGet } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const linestring = {
  'type': 'Feature',
  'geometry': {
    'type': 'LineString',
    'coordinates': []
  }
}
let text, crosshairX, crosshairY

// TODO: consider useMap
export default function Toolbox({ map, width, height, mobile, name, initCrosshair, id, preview, IS_GALAXY, DISTANCE_CONVERTER }) {
  const { mode, setMode } = useMode()
  const router = useRouter()

  function handleClick(e) {
    if (mode !== "measure") return

    const features = map.queryRenderedFeatures(e.point, {
      layers: ['measure-points']
    })

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
      const km = turf.length(linestring)
      const distance = km * DISTANCE_CONVERTER
      if (name === "postwar") {
        const walkingSpeedMph = 3 // average walking speed in miles per hour
        const walkingTimeHours = distance / walkingSpeedMph;
        text.textContent = `${distance.toFixed(1)} miles | ${walkingTimeHours.toFixed(1)} hours on foot (3mph)`;
      } else if (name.includes("lancer")) {
        const relativeTime = (distance / Math.sinh(Math.atanh(0.995))).toFixed(1);
        text.textContent = `${distance.toFixed(1)}ly | ${relativeTime} rel. years (.995u) | ${(distance / 0.995).toFixed(1)} observer years`;
      } else if (name === "mousewars") {
        // TODO: find a conversion and research how hyperspace works
        const relativeTime = (distance / Math.sinh(Math.atanh(0.995))).toFixed(1);
        text.textContent = `${distance.toFixed(1)}ly | ${relativeTime} rel. years (.995u) | ${(distance / 0.995).toFixed(1)} observer years`;
      }
      text.style.visibility = 'visible';
    }

    map.getSource('toolbox').setData(geojson)
  }

  function handleMove() {
    if (mode === "crosshair") {
      const { lng, lat } = map.getCenter()
      crosshairX.style.visibility = 'visible'
      crosshairY.style.visibility = 'visible'
      if (IS_GALAXY) {
        text.textContent = `Y: ${lat.toFixed(1)} | X: ${lng.toFixed(1)}`;
      } else {
        text.textContent = `Lat: ${lat.toFixed(3)}° | Lng: ${lng.toFixed(3)}°`;
      }
      text.style.visibility = 'visible'
    }
  }

  useEffect(() => {
    if (!map) return
    if (initCrosshair && mode !== "crosshair" && !mode) {
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

    text = document.createElement('div')
    text.className = 'textbox'
    text.style.position = 'absolute'
    text.style.left = '50%';
    text.style.lineHeight = '1.4'
    text.style.zIndex = 2;
    text.style.transform = 'translateX(-50%)';
    text.style.top = mobile ? '70px' : '90px'
    text.style.color = 'white'
    text.style.opacity = 0.7
    text.style.fontSize = mobile ? '1.5em' : '2.2em'
    text.style.pointerEvents = 'none'
    text.style.visibility = 'hidden'
    text.style.textAlign = 'center'
    mapboxChildrenParent.appendChild(text)

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

      const km = turf.length(liveLine)
      const distance = km * DISTANCE_CONVERTER

      if (name === "postwar") {
        const walkingSpeedMph = 3
        const walkingTimeHours = distance / walkingSpeedMph
        text.textContent = `${distance.toFixed(1)} miles | ${walkingTimeHours.toFixed(1)} hours on foot (3mph)`
      } else if (name.includes("lancer") || name === "mousewars") {
        const relativeTime = (distance / Math.sinh(Math.atanh(0.995))).toFixed(1)
        text.textContent = `${distance.toFixed(1)}ly | ${relativeTime} rel. years (.995u) | ${(distance / 0.995).toFixed(1)} observer years`
      }

      text.style.visibility = 'visible'
      source.setData(geojson)
    }, 1)


    if (!mobile) {
      map.on('mousemove', updateLiveDistance)
    }

    // run once to make sure the crosshair is visible on start
    // toggleMode(mode)

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
      if (IS_GALAXY) {
        text.textContent = `X: ${lng.toFixed(1)} | Y: ${lat.toFixed(1)}`;
      } else {
        text.textContent = `Lat: ${lat.toFixed(3)}° | Lng: ${lng.toFixed(3)}°`;
      }
      text.style.visibility = 'visible'
    }

    const handleKeyDown = (event) => {
      console.log("event", event)
      if (event.altKey) {
        setMode(mode === "crosshair" ? null : "crosshair")
      } else if (event.ctrlKey) {
        setMode(mode === "measure" ? null : "measure")
      } else if (event.code === "KeyP") {
        if (preview) {
          router.push(`/${name}?id=${id}`)
        } else {
          // TODO: breaks if no points
          router.push(`/${name}?id=${id}&preview=1`)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      mapboxChildrenParent.removeChild(crosshairX)
      mapboxChildrenParent.removeChild(crosshairY)
      mapboxChildrenParent.removeChild(text)
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
