import { Vector4, Group } from "three";
import { createBasePlanet } from "./layers/basePlanet.js";
import { createCraterLayer } from "./layers/craterLayer.js";
import { createRiverLayer } from "./layers/riversLayer.js";

export const createLavaPlanet = ({ colors, pixels, seed, lavaPercent }) => {
  if (!colors.base) {
    colors.base = [
      new Vector4(0.560784, 0.301961, 0.341176, 1),
      new Vector4(0.321569, 0.2, 0.247059, 1),
      new Vector4(0.239216, 0.160784, 0.211765, 1),
    ]
  }
  if (!colors.feature) {
    colors.feature = [
      new Vector4(0.321569, 0.2, 0.247059, 1),
      new Vector4(0.239216, 0.160784, 0.211765, 1),
    ]
  }
  if (!colors.layer) {
    colors.layer = [
      new Vector4(1, 0.537255, 0.2, 1),
      new Vector4(0.901961, 0.270588, 0.223529, 1),
      new Vector4(0.678431, 0.184314, 0.270588, 1),
    ]
  }

  const planetGroup = new Group()

  // lightPos = new Vector2(0.39, 0.7), lightIntensity = 0.1, colors = null, rotationSpeed = 0.1, rotation = 0.0, pixels, seed
  const basePlanet = createBasePlanet(undefined, undefined, colors, undefined, undefined, pixels, seed)
  // ightPos = new Vector2(0.39, 0.7), colors, rotationSpeed = 0.1, rotation = 0.0, pixels, seed
  const craterLayer = createCraterLayer(undefined, colors, undefined, undefined, pixels, seed)
  // lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, lavaPercent = 0.6, colors, rotation = 0.0, pixels, seed
  const riverLayer = createRiverLayer(undefined, undefined, lavaPercent, colors, undefined, pixels, seed);
  planetGroup.add(basePlanet);
  planetGroup.add(craterLayer)
  planetGroup.add(riverLayer)
  return planetGroup
}
