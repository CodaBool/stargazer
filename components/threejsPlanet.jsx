'use client';

import { useEffect, useRef, memo } from 'react';
import { Clock, Group, Scene, WebGLRenderer, Vector4, PerspectiveCamera, AmbientLight, DirectionalLight } from 'three';
import { createStars } from './planets/layers/stars'

// planet generation
import { createAsteroid } from "./planets/asteroid.js";
import { createDryPlanet } from "./planets/DryPlanet.js";
import { createEarthPlanet } from "./planets/earthPlanet.js";
import { createGasGiant } from "./planets/gasGiant.js";
import { createGasGiantRing } from "./planets/gasGiantRing.js";
import { createIcePlanet } from "./planets/icePlanet.js";
import { createLavaPlanet } from "./planets/lavaPlanet.js";
import { createNoAtmospherePlanet } from "./planets/noAtmosphere.js";
import { createStarPlanet } from "./planets/starPlanet.js";
import { createStation } from "./planets/stations.js";
import { createGate } from "./planets/gate.js";

function ThreejsPlanet({
  sharedCanvas,
  sharedRenderer,
  height,
  width,
  type,
  pixels,
  baseColors,
  featureColors,
  layerColors,
  schemeColor,
  atmosphereColors,
  clouds,
  cloudPercent,
  size,
  landPercent,
  ringSize,
  hyrdoPercent,
  lavaPercent,
  seed,
  planetSize,
  disableListeners,
  warpDistance,
  propStyle,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up renderer if not shared
    let isNewRenderer = false;

    if (!sharedRenderer || !sharedCanvas) {
      sharedRenderer = new WebGLRenderer({ antialias: true, alpha: true });
      sharedRenderer.setClearColor(0x000000, 0);
      sharedRenderer.setPixelRatio(window.devicePixelRatio);
      sharedCanvas = sharedRenderer.domElement;
      isNewRenderer = true;
    }
    if (disableListeners) {
      sharedRenderer.setSize(width || container.clientWidth, height || container.clientHeight)
    } else {
      sharedRenderer.setSize(container.clientWidth - 10, container.clientHeight - 10)
    }

    // Only append the sharedCanvas if it's not already attached to this container
    if (sharedCanvas.parentElement !== container) {
      // Remove from old parent if needed
      if (sharedCanvas.parentElement) {
        sharedCanvas.parentElement.removeChild(sharedCanvas);
      }
      container.appendChild(sharedCanvas);
    }



    const scene = new Scene()
    // fov, default 50
    // aspect, default 1
    // near, default 0.1
    // far, default 2000
    const camera = new PerspectiveCamera(75)
    // move the planet away from the camera to create smaller planets
    // should be a 1-4 value
    const zoomAwayAmount = planetSize || 1
    camera.position.z = zoomAwayAmount

    // const camera = new PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100000);
    const clock = new Clock();
    const planetGroup = new Group()

    const planet = generatePlanetByType({
      pixels: pixels ? Number(pixels) : undefined,
      colors: {
        base: baseColors || undefined,
        feature: featureColors || undefined,
        layer: layerColors || undefined,
        scheme: schemeColor || undefined,
        atmosphereColors: atmosphereColors || undefined,
      },
      clouds: clouds === "false" ? false : true,
      type: type || "terrestrial",
      size: size ? Number(size) : undefined,
      ringSize: ringSize ? Number(ringSize) : undefined,
      landPercent: landPercent ? Number(landPercent) : undefined,
      cloudPercent: cloudPercent ? Number(cloudPercent) : undefined,
      hyrdoPercent: hyrdoPercent ? Number(hyrdoPercent) : undefined,
      lavaPercent: lavaPercent ? Number(lavaPercent) : undefined,
      seed: seed ? seed : undefined,
    })

    if (!planet) {
      // fallback to text if no model for this type
      const dialog = document.querySelector('.threejs-planet-dialog');
      if (dialog) {
        dialog.style.textAlign = 'center';
        dialog.style.fontSize = '2em';
        dialog.style.paddingTop = '6em';
        dialog.textContent = `No preview available for ${type.replaceAll("_", " ")}`;
      }
      return
    }

    planetGroup.add(planet);
    scene.add(planetGroup);

    let starGroup;
    if (!disableListeners) {
      starGroup = createStars(200);
      starGroup.position.z = -0.5;
      scene.add(starGroup);
    }

    // Add ambient + directional lighting
    if (type === "station" || type === "gate") {
      const ambientLight = new AmbientLight(0xffffff, 0.02); // soft white light
      scene.add(ambientLight);

      const directionalLight = new DirectionalLight(0xffffff, 0.5);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
    }

    sharedCanvas.style.display = 'block'
    sharedCanvas.style.backgroundColor = 'transparent';
    sharedCanvas.style.pointerEvents = 'none';

    let animationId, cameraStartTime, currentZ;
    let totalX = 0;
    let moveX = 0;
    let holding = false;
    const skySpeed = 0.00001;
    const baseSpeed = 0.5;
    const maxTimeSpeed = 0.9;
    const timeFriction = 0.95;
    const maxAccel = 0.01;
    const notLava = type !== "lava";

    if (warpDistance) {
      const warpStartZ = warpDistance * 300 // Starting far away
      camera.position.z = warpStartZ
      currentZ = warpStartZ
    }


    const animate = () => {
      animationId = requestAnimationFrame(animate);

      if (warpDistance) {
        if (!cameraStartTime) cameraStartTime = performance.now()
        const damping = 0.1 // adjust for slower or snappier zoom
        currentZ += (warpDistance - currentZ) * damping
        camera.position.z = currentZ
      }


      planetGroup.children.forEach(planet => {
        planet.children.forEach(layer => {
          if (!layer.material || !('uniforms' in layer.material)) return;

          const u = layer.material.uniforms;
          if (!u?.time || !u?.time_speed) return;

          const elapsed = clock.getElapsedTime() % 10000;
          u.time.value = elapsed;

          if (holding && notLava) {
            const rawDelta = moveX * 0.01;
            const limitedDelta = Math.max(-maxAccel, Math.min(maxAccel, rawDelta));
            u.time_speed.value += limitedDelta;
          } else {
            u.time_speed.value = baseSpeed + (u.time_speed.value - baseSpeed) * timeFriction;
          }

          u.time_speed.value = Math.max(-maxTimeSpeed, Math.min(maxTimeSpeed, u.time_speed.value));
        });
      });

      if (starGroup) {
        starGroup.rotateY(skySpeed);
        starGroup.rotateX(skySpeed);
        starGroup.rotateZ(skySpeed);
      }

      if (type === "station") {
        planetGroup.rotation.z += 0.0002;
      }

      if (type === 'gate') {
        planetGroup.children.forEach(child => {
          if (child.userData.animate) {
            child.userData.animate(clock.getElapsedTime());
          }
        });
      }

      sharedRenderer.render(scene, camera);
      moveX = totalX = 0;
    };

    animate();

    if (!disableListeners) {
      const handleMouseDown = () => {
        holding = true;
        // document.body.style.cursor = 'grabbing';
        // document.body.style.userSelect = 'none';
      };
      const handleMouseUp = () => {
        holding = false;
        // document.body.style.cursor = 'grab';
        // document.body.style.userSelect = 'auto';
      };

      container.addEventListener("pointerdown", handleMouseDown, false);
      container.addEventListener("pointerup", handleMouseUp, false);
      // document.body.style.cursor = 'grab';
    }

    return () => {
      cancelAnimationFrame(animationId);
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      scene.clear();
      sharedRenderer.renderLists.dispose();
      sharedRenderer.info.reset();

      if (typeof handleMouseDown === "function") {
        container.removeEventListener("pointerdown", handleMouseDown);
        container.removeEventListener("pointerup", handleMouseUp);
      }

      // Do not remove sharedCanvas unless we created it
      if (isNewRenderer && container.contains(sharedCanvas)) {
        container.removeChild(sharedCanvas);
      }
    };
  }, [sharedCanvas,
    sharedRenderer,
    height,
    width,
    type,
    pixels,
    baseColors,
    featureColors,
    layerColors,
    schemeColor,
    atmosphereColors,
    clouds,
    cloudPercent,
    size,
    landPercent,
    ringSize,
    hyrdoPercent,
    lavaPercent,
    seed,
    planetSize,
    disableListeners,
    warpDistance]);

  return (
    <div
      ref={containerRef}
      style={{
        ...propStyle,
        width: "100%",
        aspectRatio: "1 / 1",
        height: "auto",
        display: "flex",
        justifyContent: disableListeners ? "center" : "normal",
      }}
    />
  );
}

// KEEP THESE IN SYNC WITH THE SWITCH BELOW!!!
export const availableThreejsModels = ["barren_planet", "moon", "barren", "gate", "station", "ice_planet", "ice", "gas", "jovian", "ringed_planet", "ring", "comet", "asteroid", "asteroids", "neutron_star", "star", "lava_planet", "lava", "desert_planet", "desert", "terrestrial", "ocean_planet", "ocean"]
function generatePlanetByType(params) {
  switch (params.type) {
    case "barren_planet":
    case "moon":
    case "barren":
      return createNoAtmospherePlanet(params)
    case "gate":
      return createGate(params)
    case "station":
      return createStation(params)
    case "ice_planet":
    case "ice":
      return createIcePlanet(params)
    case "gas":
    case "jovian":
      return createGasGiant(params)
    case "ringed_planet":
    case "ring":
      return createGasGiantRing(params)
    case "comet":
    case "asteroid":
    case "asteroids":
      return createAsteroid(undefined, params.colors, undefined, params.pixels, params.seed, params.size)
    case "neutron_star":
    case "star":
      return createStarPlanet(params)
    case "lava_planet":
    case "lava":
      return createLavaPlanet(params)
    case "desert_planet":
    case "desert":
      // lightPos = new Vector2(0.39, 0.7), colors, rotationSpeed = 0.1, rotation = 0.0, pixels, seed
      return createDryPlanet(undefined, params.colors, undefined, undefined, params.pixels, params.seed)
    case "terrestrial":
    case "ocean_planet":
    case "ocean":
      return createEarthPlanet(params)
  }
}

export function hexToVector4(rawHex) {
  let hex = rawHex.replace(/^#/, '');

  // expand shorthand (e.g. "abc" → "aabbcc")
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }

  const hasAlpha = hex.length === 8;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hasAlpha
    ? parseInt(hex.slice(6, 8), 16) / 255
    : 1;

  return new Vector4(r, g, b, a);
}

export default memo(ThreejsPlanet)
