
import { useEffect } from "react"
import { useMap } from '@vis.gl/react-maplibre'
import distance from '@turf/distance'
import { point as turfPoint } from '@turf/helpers'
import maplibregl from 'maplibre-gl'
import { toast } from "sonner"
import { getMaps } from "@/lib/utils"

let text, zText, crosshairX, crosshairY

export function Calibrate({ width, height, mobile, name, IS_GALAXY }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return

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
    crosshairY.style.border = '1px dashed rgba(255, 255, 255, 0.5)'
    crosshairY.style.height = `${Math.min(Math.max(crosshairLength, 50), height - 50)}px`
    crosshairY.style.transform = 'translateY(-50%)'
    mapboxChildrenParent.appendChild(crosshairY)

    text = document.createElement('div')
    text.className = 'textbox'
    text.style.position = 'absolute'
    text.style.left = '50%';
    text.style.zIndex = 2;
    text.style.transform = 'translateX(-50%)';
    text.style.top = mobile ? '70px' : '90px'
    text.style.color = 'white'
    text.style.opacity = 0.7
    text.style.fontSize = mobile ? '1.5em' : '2.2em'
    text.style.pointerEvents = 'none'
    text.style.textAlign = 'center'
    mapboxChildrenParent.appendChild(text)

    zText = document.createElement('div')
    zText.className = 'textbox'
    zText.style.position = 'absolute'
    zText.style.left = '50%';
    zText.style.zIndex = 2;
    zText.style.transform = 'translateX(-50%)';
    zText.style.bottom = mobile ? '70px' : '90px'
    zText.style.color = 'white'
    zText.style.opacity = 0.7
    zText.style.fontSize = mobile ? '1.5em' : '2.2em'
    zText.style.pointerEvents = 'none'
    zText.style.textAlign = 'center'
    mapboxChildrenParent.appendChild(zText)

    const button = document.createElement('button')
    button.textContent = 'Submit'
    button.className = 'absolute top-6 left-1/2 transform -translate-x-1/2 w-30 bg-[#302831] text-white py-2 px-4 rounded cursor-pointer'
    button.style.zIndex = 100
    button.addEventListener('click', () => {
      const center = map.getCenter()
      const autoZoom = Number(map.getZoom().toFixed(2))
      const autoLat = Number(center.lat.toFixed(3))
      const autoLng = Number(center.lng.toFixed(3))

      window.parent.postMessage({
        type: 'calibrate',
        autoZoom,
        autoLat,
        autoLng,
      }, '*')
    })
    document.body.appendChild(button)

    // coordinate text
    const updateCenterCoordinates = () => {
      const { lat, lng } = map.getCenter()
      if (IS_GALAXY) {
        text.textContent = `Y: ${lat.toFixed(1)} | X: ${lng.toFixed(1)}`;
      } else {
        text.textContent = `Lat: ${lat.toFixed(3)}° | Lng: ${lng.toFixed(3)}°`;
      }
    }
    updateCenterCoordinates()
    map.on('move', updateCenterCoordinates)

    // zoom text
    const updateZoomLevel = () => {
      const zoomLevel = map.getZoom().toFixed(2)
      zText.textContent = `Zoom: ${zoomLevel}`
    }
    updateZoomLevel()
    map.on('zoom', updateZoomLevel)
  }, [map])

  return null
}

export function Link({ mobile, name, params }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return

    const mapContainer = map.getCanvasContainer()

    const text = document.createElement('div')
    text.className = 'textbox'
    text.style.position = 'absolute'
    text.style.left = '50%'
    text.style.top = '120px'
    text.style.transform = 'translateX(-50%)'
    text.style.color = 'white'
    text.style.opacity = 0.7
    text.style.fontSize = '1.8em'
    text.style.pointerEvents = 'none'
    text.style.visibility = 'hidden'
    mapContainer.appendChild(text)

    const zoomText = document.createElement('div')
    zoomText.className = 'zoom-textbox'
    zoomText.style.position = 'absolute'
    zoomText.style.left = '50%'
    zoomText.style.bottom = '30px'
    zoomText.style.transform = 'translateX(-50%)'
    zoomText.style.color = 'white'
    zoomText.style.opacity = 0.7
    zoomText.style.fontSize = mobile ? '1.2em' : '1.8em'
    zoomText.style.pointerEvents = 'none'
    zoomText.style.visibility = 'visible'
    mapContainer.appendChild(zoomText)

    const handleSubmit = async () => {
      const maps = await getMaps()
      const id = params.get("id")
      const secret = params.get("secret")

      if (!id || !secret || !name) {
        console.log('ERR: missing id, or secret, or name', id, name, maps)
        toast.warning("Something was wrong with your request")
        return
      }

      const map = maps[name + "-" + id]
      if (!map || !map?.meta?.uuid) {
        console.log('ERR: could not find map', id, name, maps)
        toast.warning("Something was wrong with your request")
        return
      }

      // TODO: capture config changes here too
      // ??? RETURNING COMMENT: why would I though? Unless this is a reused component ???
      // I'm definitely assuming things here about the meta uuid and id here
      // if this is used in multiple places, this should be rewored likely
      fetch('/api/map', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ geojson: map.geojson, id: map.meta.uuid, secret }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            toast.warning(data.error)
          } else {
            toast.success(`Remote map for ${map.map} updated successfully`)
            window.parent.postMessage({
              type: 'link',
              message: "success"
            }, '*')
          }
        })
        .catch(error => {
          console.log(error)
          toast.warning("A server error occurred")
        })
    }

    const button = document.createElement('button')
    button.textContent = 'Submit'
    button.className = 'absolute top-6 left-1/2 transform -translate-x-1/2 w-30 bg-[#302831] text-white py-2 px-4 rounded cursor-pointer'
    button.style.zIndex = 10
    button.addEventListener('click', handleSubmit)
    mapContainer.appendChild(button)

    const unsavedChangesText = document.createElement('div')
    unsavedChangesText.className = 'absolute top-16 left-1/2 transform -translate-x-1/2 w-30 text-white py-2 px-4 w-[200px] flex justify-center unsaved-text'
    unsavedChangesText.style.zIndex = 10
    unsavedChangesText.style.visibility = "hidden"
    unsavedChangesText.innerHTML = '<p><svg xmlns="http://www.w3.org/2000/svg" stroke="white" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-bounce inline"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg> Unsaved Changes</p>'
    mapContainer.appendChild(unsavedChangesText)
  }, [map])

  return null
}

export function Quest({ name, uuid }) {
  const { map } = useMap()

  useEffect(() => {
    if (!map) return

    text = document.createElement('div')
    text.className = 'textbox'
    text.id = 'quest-textbox'
    text.style.position = 'absolute'
    text.style.left = '50%';
    text.style.lineHeight = '1.4'
    text.style.zIndex = 2;
    text.style.transform = 'translateX(-50%)';
    text.style.top = '130px'
    text.style.color = 'white'
    text.style.opacity = 0.8
    text.style.fontSize = '2.2em'
    text.style.pointerEvents = 'none'
    text.style.textAlign = 'center'
    text.style.textShadow = `0 0 3px rgba(0,0,0,1), 0 0 6px rgba(0,0,0,0.9)`;
    text.style.background = 'rgba(0, 0, 0, 0.9)'; // semi-transparent black
    text.style.padding = '0.2em 0.5em'; // space around text
    text.style.borderRadius = '10px'; // optional rounded corners
    text.textContent = `click a location`;
    document.querySelector('div[mapboxgl-children=""]').appendChild(text)


    const button = document.createElement('button')
    button.textContent = 'Submit'
    button.className = 'absolute top-20 left-1/2 z-[3] transform -translate-x-1/2 w-30 bg-[#302831] text-white py-2 px-4 rounded cursor-pointer'
    button.addEventListener('click', () => {
      if (typeof window.questLink === 'undefined') return
      window.parent.postMessage({
        type: 'questLocationSet',
        location: window.questLink,
        map: name,
        uuid,
      }, '*')
    })
    document.body.appendChild(button)

    function clicked(e) {
      if (!e.features[0]) return
      window.questLink = {id: e.features[0].id, properties: e.features[0].properties, type: e.features[0].geometry.type}
      // console.log("feature", id, e.features[0].properties.name, e.features[0].geometry.type, e.features[0])
      text.textContent = `${e.features[0].properties.name}`;
    }

    map.on("click", "location", clicked)
    // map.on("click", "polygon-background", clicked)
    map.on("click", "polygon-foreground", clicked)
    map.on("click", "polygon-user", clicked)

    return () => {
      map.off("click", "location", clicked)
      // map.off("click", "polygon-background", clicked)
      map.off("click", "polygon-foreground", clicked)
      map.off("click", "polygon-user", clicked)
    }

  }, [map])

  return null
}
