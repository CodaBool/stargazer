import { Vector4, Group } from "three";
import { createAtmosphereLayer } from "./layers/atmosphereLayer.js";
import { createBasePlanet } from "./layers/basePlanet.js";
import { createCloudLayer } from "./layers/cloudLayer.js";
import { createCityLayer } from "./layers/cityLayer.js";

export const createCityPlanet = ({
  colors,
  pixels,
  seed,
  hydroPercent,
  cloudPercent,
}) => {
  const city = new Group();
  if (!colors.base) {
    colors.base = [
      new Vector4(42 / 255, 44 / 255, 48 / 255, 1),  // light concrete grey
      new Vector4(52 / 255, 55 / 255, 61 / 255, 1),  // mid urban grey
      new Vector4(30 / 255, 32 / 255, 36 / 255, 1),  // deep structure grey
    ];
  }
  if (!colors.atmosphereColors) {
    colors.atmosphereColors = [
      new Vector4(168 / 255, 176 / 255, 184 / 255, 0x14 / 255), // sunward haze
      new Vector4(136 / 255, 144 / 255, 153 / 255, 0x0E / 255), // limb glow
      new Vector4(90  / 255, 97  / 255, 104 / 255, 0x08 / 255), // night-side bleed
    ];
  }
  if (!colors.layer) {
    colors.layer = [
      new Vector4(157 / 255, 161 / 255, 166 / 255, 0x22 / 255), // high fog
      new Vector4(176 / 255, 180 / 255, 185 / 255, 0x26 / 255), // dense cloud bands
      new Vector4(110 / 255, 114 / 255, 119 / 255, 0x21 / 255), // lower haze
      new Vector4(58  / 255, 61  / 255, 65  / 255, 0x18 / 255), // edge falloff
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
  const cityLayer = createCityLayer(
    undefined, // light pos
    // undefined,
    colors,
    undefined, // rotation speed
    undefined, // rotation
    undefined, //
    undefined, //
    undefined,
    undefined,
    pixels,
    seed,
  );

  // colors, lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, rotation = 0.0, cloudPercent = 0.546, stretch = 2.5, pixels, seed

  const atmosphere = createAtmosphereLayer(colors, pixels);

  city.add(cityLayer);
  city.add(basePlanet, cityLayer, atmosphere);
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
    city.add(cloudsLayer);
  }

  return city;
};
