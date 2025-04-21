import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'

function randomMercatorLatitude() {
  const y = Math.random() * 2 - 1; // uniform in [-1, 1]
  const latRad = Math.atan(Math.sinh(Math.PI * y));
  return latRad * (180 / Math.PI);
}


export default function Starfield({ width, height }) {
  const starGeoJSON = useMemo(() => {
    const numStars = Math.floor((width * height) / 2000)
    const features = []
    for (let i = 0; i < numStars; i++) {
      const lon = Math.random() * 360 - 180;
      const lat = randomMercatorLatitude();

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.2,
        }
      });
    }
    return {
      type: "FeatureCollection",
      features
    }
  }, [width, height])

  return (
    <Source id="starfield" type="geojson" data={starGeoJSON}>
      <Layer
        id="stars"
        type="circle"
        paint={{
          "circle-radius": ['get', 'size'],
          "circle-color": "white",
          "circle-opacity": ['get', 'opacity'],
        }}
      />
    </Source>
  )
}
