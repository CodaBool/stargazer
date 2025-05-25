import { Vector4, Group } from "three"
import { createBasePlanet } from "./layers/basePlanet.js"
import { createCloudLayer } from "./layers/cloudLayer.js"
import { createLakeLayer } from "./layers/lakeLayer.js"

export const createIcePlanet = ({ colors, pixels, seed, clouds, lakes, cloudCover }) => {
  const icePlanet = new Group()

  if (!colors.base) {
    colors.base = [
      new Vector4(250 / 255, 255 / 255, 255 / 255, 1),
      new Vector4(199 / 255, 212 / 255, 255 / 255, 1),
      new Vector4(146 / 255, 143 / 255, 184 / 255, 1)
    ]
  }

  //                               lightPos , lightIntensity , colors , rotationSpeed , rotation , pixels , seed )
  const basePlanet = createBasePlanet(undefined, undefined, colors, undefined, undefined, pixels, seed)

  // ightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, lakes = 0.6, colors, rotation = 0.0
  const lakeLayer = createLakeLayer(undefined, undefined, lakes, colors, undefined, pixels, seed)
  icePlanet.add(basePlanet)
  icePlanet.add(lakeLayer)

  if (clouds) {
    // colors, lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, rotation = 0.0, cloudCover, stretch = 2.5, pixels, seed
    const cloudLayer = createCloudLayer(colors, undefined, undefined, undefined, cloudCover, undefined, pixels, seed)
    icePlanet.add(cloudLayer)
  }

  return icePlanet;
}
