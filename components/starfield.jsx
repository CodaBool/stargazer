import { Source, Layer } from 'react-map-gl/maplibre'
import { useMemo } from 'react'

function randomMercatorLatitude(bounds) {
  const [leftBottom, rightTop] = bounds;
  const margin = 2; // Extend bounds by 2 degrees
  const extendedBounds = [
    [leftBottom[0] - margin, leftBottom[1] - margin],
    [rightTop[0] + margin, rightTop[1] + margin],
  ];

  const latMin = extendedBounds[0][1];
  const latMax = extendedBounds[1][1];
  return Math.random() * (latMax - latMin) + latMin;
}

function randomMercatorLongitude(bounds) {
  const [leftBottom, rightTop] = bounds;
  const margin = 2; // Extend bounds by 2 degrees
  const extendedBounds = [
    [leftBottom[0] - margin, leftBottom[1] - margin],
    [rightTop[0] + margin, rightTop[1] + margin],
  ];

  const lonMin = extendedBounds[0][0];
  const lonMax = extendedBounds[1][0];
  return Math.random() * (lonMax - lonMin) + lonMin;
}


export default function Starfield({ width, height, BOUNDS }) {
  const starGeoJSON = useMemo(() => {
    const numStars = Math.floor((width * height) / 2000)
    const features = []
    for (let i = 0; i < numStars; i++) {
      const lon = randomMercatorLongitude(BOUNDS);
      const lat = randomMercatorLatitude(BOUNDS);

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
