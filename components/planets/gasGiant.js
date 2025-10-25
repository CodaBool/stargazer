import { Group } from "three";
import { createBaseGasPlanet } from "./layers/baseGasPlanet.js";
import { createGasPLayer } from "./layers/gasLayer.js";

export const createGasGiant = ({ colors, pixels, seed, clouds, lakes, cloudPercent }) => {
  const gasGiantGroup = new Group()


  // lightPos , cloudPercent, colors, stretch, rotationSpeed, rotation, cloudCurve
  const basePlanet = createBaseGasPlanet(undefined, undefined, colors, undefined, undefined, undefined, undefined, pixels, seed)

  // lightPos, cloudPercent, colors, stretch, rotationSpeed, rotation, cloudCurve
  const gasLayer = createGasPLayer(undefined, undefined, colors, undefined, undefined, undefined, undefined, pixels, seed)
  gasGiantGroup.add(basePlanet)
  gasGiantGroup.add(gasLayer)

  return gasGiantGroup
}
