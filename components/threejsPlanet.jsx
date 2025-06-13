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
  atmosphere,
  clouds,
  cloudCover,
  size,
  land,
  ringWidth,
  lakes,
  rivers,
  seed,
  planetSize,
  disableListeners
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set up renderer if not shared
    if (!sharedRenderer) {
      sharedRenderer = new WebGLRenderer({ antialias: true });
      sharedRenderer.setPixelRatio(window.devicePixelRatio);
      sharedCanvas = sharedRenderer.domElement;
    }

    if (disableListeners) {
      sharedRenderer.setSize(width || container.clientWidth, height || container.clientHeight)
    } else {
      sharedRenderer.setSize(container.clientWidth - 10, container.clientHeight - 10)
    }
    if (!container.contains(sharedCanvas)) {
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
    const planetGroup = new Group();

    planetGroup.add(generatePlanetByType({
      pixels: pixels ? Number(pixels) : undefined,
      colors: {
        base: baseColors || undefined,
        feature: featureColors || undefined,
        layer: layerColors || undefined,
        scheme: schemeColor || undefined,
        atmosphere: atmosphere || undefined,
      },
      clouds: clouds === "false" ? false : true,
      type: type || "terrestrial",
      cloudCover: cloudCover ? Number(cloudCover) : undefined,
      size: size ? Number(size) : undefined,
      land: land ? Number(land) : undefined,
      ringWidth: ringWidth ? Number(ringWidth) : undefined,
      lakes: lakes ? Number(lakes) : undefined,
      rivers: rivers ? Number(rivers) : undefined,
      seed: seed ? Number(seed) : undefined,
    }));
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

    sharedCanvas.style.display = 'block';

    let animationId;
    let totalX = 0;
    let moveX = 0;
    let holding = false;
    const skySpeed = 0.00001;
    const baseSpeed = 0.5;
    const maxTimeSpeed = 0.9;
    const timeFriction = 0.95;
    const maxAccel = 0.01;
    const notLava = type !== "lava";

    const animate = () => {
      animationId = requestAnimationFrame(animate);

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
        container.removeEventListener("pointermove", handleMouseMove);
      }

      if (container.contains(sharedCanvas)) {
        container.removeChild(sharedCanvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: "1 / 1",
        height: "auto",
        display: "flex",
        justifyContent: disableListeners ? "center" : "normal",
      }}
    />
  );
}

function generatePlanetByType(params) {
  switch (params.type) {
    case "barren":
      return createNoAtmospherePlanet(params)
    case "gate":
      return createGate(params)
    case "station":
      return createStation(params)
    case "moon":
      // duplicate of barren
      return createNoAtmospherePlanet(params)
    case "ice":
      return createIcePlanet(params)
    case "gas":
      return createGasGiant(params)
    case "jovian":
      // duplicate of gas
      return createGasGiant(params)
    case "ring":
      return createGasGiantRing(params)
    case "asteroid":
      // lightPos = new Vector2(0.39, 0.7), colors, rotation = 0.0, pixels, seed, size
      return createAsteroid(undefined, params.colors, undefined, params.pixels, params.seed, params.size)
    case "asteroids":
      // duplicate of asteroid
      // lightPos = new Vector2(0.39, 0.7), colors, rotation = 0.0, pixels, seed, size
      return createAsteroid(undefined, params.colors, undefined, params.pixels, params.seed, params.size)
    case "star":
      return createStarPlanet(params)
    case "lava":
      return createLavaPlanet(params)
    case "desert":
      // ightPos = new Vector2(0.39, 0.7), colors, rotationSpeed = 0.1, rotation = 0.0, pixels, seed
      return createDryPlanet(undefined, params.colors, undefined, undefined, params.pixels, params.seed)
    case "terrestrial":
      return createEarthPlanet(params)
    case "ocean":
      // duplicate of terrestrial
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
