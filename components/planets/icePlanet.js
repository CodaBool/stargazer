import { Vector4, Group } from "three"
import { createBasePlanet } from "./layers/basePlanet.js"
import { createCloudLayer } from "./layers/cloudLayer.js"
import { createLakeLayer } from "./layers/lakeLayer.js"
import { createBaseEyeballPlanet } from "./layers/eyeball.js"
import { createEyeballLakeLayer } from "./layers/eyeballLake.js"

export const createIcePlanet = ({ colors, pixels, seed, clouds, hydroPercent, cloudPercent, type }) => {
  const icePlanet = new Group()

  if (!colors.base) {
    colors.base = [
      new Vector4(250 / 255, 255 / 255, 255 / 255, 1),
      new Vector4(199 / 255, 212 / 255, 255 / 255, 1),
      new Vector4(146 / 255, 143 / 255, 184 / 255, 1)
    ]
  }

  if (type === "eyeball_planet") {
    const eye = createBaseEyeballPlanet(undefined, undefined, colors, undefined, undefined, pixels, seed)
    const lake = createEyeballLakeLayer(undefined, undefined, hydroPercent, colors, undefined, pixels, seed)
    icePlanet.add(eye, lake)
    // const eye = createDestroyedPlanetLayer(
    //   colors,
    //   undefined,
    //   undefined,
    //   undefined,
    //   seed,
    //   undefined,
    //   undefined,
    //   undefined,
    //   undefined,

    // )
    // icePlanet.add(eye)
  } else {
    // lightPos , lightIntensity , colors , rotationSpeed , rotation , pixels , seed )
    const basePlanet = createBasePlanet(undefined, undefined, colors, undefined, undefined, pixels, seed)

    // ightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, hydroPercent = 0.6, colors, rotation = 0.0
    const lakeLayer = createLakeLayer(undefined, undefined, hydroPercent, colors, undefined, pixels, seed)
    icePlanet.add(lakeLayer, basePlanet)
  }


  // if (clouds) {
  //   // colors, lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, rotation = 0.0, cloudPercent, stretch = 2.5, pixels, seed
  //   const cloudLayer = createCloudLayer(colors, undefined, undefined, undefined, cloudPercent, undefined, pixels, seed)
  //   icePlanet.add(cloudLayer)
  // }

  return icePlanet;
}
