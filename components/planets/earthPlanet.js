import { Vector4, Group } from "three";
import { createAtmosphereLayer } from "./layers/atmosphereLayer.js";
import { createBasePlanet } from "./layers/basePlanet.js";
import { createCloudLayer } from "./layers/cloudLayer.js";
import { createlandMassLayer } from "./layers/landMass.js";

export const createEarthPlanet = ({
  colors,
  pixels,
  seed,
  hydroPercent,
  cloudPercent,
}) => {
  const earth = new Group();
  if (!colors.base) {
    colors.base = [
      new Vector4(102 / 255, 176 / 255, 199 / 255, 1),
      new Vector4(102 / 255, 176 / 255, 199 / 255, 1),
      new Vector4(52 / 255, 65 / 255, 157 / 255, 1),
    ];
  }

  // lightPos = new Vector2(0.39, 0.7), lightIntensity = 0.1, colors = null, rotationSpeed = 0.1, rotation = 0.0, pixels, seed
  const basePlanet = createBasePlanet(
    undefined,
    undefined,
    colors,
    undefined,
    undefined,
    pixels,
    seed,
  );
  // lightPos = new Vector2(0.39, 0.7), lightIntensity = 0.1, colors = null, rotationSpeed = 0.1, rotation = 0.0, hydroPercent = 0.6
  const landmass = createlandMassLayer(
    undefined,
    undefined,
    colors,
    undefined,
    undefined,
    hydroPercent,
    pixels,
    seed,
  );
  // colors, lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, rotation = 0.0, cloudPercent = 0.546, stretch = 2.5, pixels, seed

  const atmosphere = createAtmosphereLayer(colors, pixels);

  earth.add(basePlanet, landmass, atmosphere);
  if (cloudPercent !== 0) {
    const cloudsLayer = createCloudLayer(
      colors,
      undefined,
      undefined,
      undefined,
      cloudPercent,
      undefined,
      pixels,
      seed,
    );
    earth.add(cloudsLayer);
  }

  return earth;
};
