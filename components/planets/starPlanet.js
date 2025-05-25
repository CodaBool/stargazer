import { Group } from "three"
import { createStar } from "./layers/star.js"
import { createStarBlobLayer } from "./layers/starBlobLayer.js"
import { createStarFlareLayer } from "./layers/starFlareLayer.js"

export const createStarPlanet = ({ colors, pixels, seed }) => {
  const StarPlanet = new Group()

  // lightPos = new Vector2(0.39, 0.7), lightIntensity = 0.1, rotationSpeed = 0.01, rotation = 0.0, color=null
  const basePlanet = createStar(undefined, undefined, undefined, undefined, colors, pixels, seed)
  const starFlareLayer = createStarFlareLayer(undefined, undefined, undefined, colors, pixels, seed)
  const blobLayer = createStarBlobLayer(undefined, colors, pixels, seed)

  starFlareLayer.position.z = 0.01
  starFlareLayer.scale.set(1.2, 1.2)
  blobLayer.position.z = -0.01
  blobLayer.scale.set(1.9, 1.9)

  StarPlanet.add(basePlanet)
  StarPlanet.add(starFlareLayer)
  StarPlanet.add(blobLayer)

  return StarPlanet
}
