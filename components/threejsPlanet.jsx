"use client";

import { useEffect, useRef, memo } from "react";
import {
  Clock,
  Group,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
} from "three";
import { createStars } from "./planets/layers/stars";
import { acquireRenderer, releaseRenderer } from "./renderer.js";
import {
  claimThreeCanvas,
  releaseThreeCanvas,
  getThreeCanvasOwner,
  onThreeOwnerChange,
} from "./threeHostRegistry.js";

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

function disposeMaterial(mat) {
  for (const key in mat) {
    const value = mat[key];
    if (value && value.isTexture) value.dispose();
  }

  if (mat.uniforms) {
    for (const u of Object.values(mat.uniforms)) {
      const v = u?.value;
      if (v && v.isTexture) v.dispose();
      if (Array.isArray(v)) v.forEach(t => t?.isTexture && t.dispose());
    }
  }

  mat.dispose();
}

function disposeScene(scene) {
  scene.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) obj.material.forEach(disposeMaterial);
      else disposeMaterial(obj.material);
    }
  });
  scene.clear();
}

// KEEP THESE IN SYNC WITH THE SWITCH BELOW!!!
export const availableThreejsModels = [
  "barren_planet",
  "moon",
  "barren",
  "gate",
  "station",
  "ice_planet",
  "ice",
  "gas",
  "jovian",
  "ringed_planet",
  "ring",
  "comet",
  "asteroid",
  "asteroids",
  // "neutron_star",
  "star",
  "lava_planet",
  "lava",
  "desert_planet",
  "desert",
  "terrestrial",
  "ocean_planet",
  "ocean",
];

function generatePlanetByType(params) {
  switch (params.type) {
    case "barren_planet":
    case "moon":
    case "barren":
      return createNoAtmospherePlanet(params);
    case "gate":
      return createGate(params);
    case "station":
      return createStation(params);
    case "ice_planet":
    case "ice":
      return createIcePlanet(params);
    case "gas":
    case "jovian":
      return createGasGiant(params);
    case "ringed_planet":
    case "ringed":
    case "ring":
      return createGasGiantRing(params);
    case "comet":
    case "asteroid":
    case "asteroids":
      return createAsteroid(
        undefined,
        params.colors,
        undefined,
        params.pixels,
        params.seed,
        params.size,
      );
    // case "neutron star":
    case "star":
      return createStarPlanet(params);
    case "lava_planet":
    case "lava":
      return createLavaPlanet(params);
    case "desert_planet":
    case "desert":
      return createDryPlanet(
        undefined,
        params.colors,
        undefined,
        undefined,
        params.pixels,
        params.seed,
      );
    case "terrestrial":
    case "ocean_planet":
    case "ocean":
      return createEarthPlanet(params);
  }
}

function ThreejsPlanet({
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
  ringSize,
  hydroPercent,
  lavaPercent,
  seed,
  planetSize,
  disableListeners,
  warpDistance,
  propStyle,
  warpStars = 200,
  hostKey = "default",
}) {
  const containerRef = useRef(null);
  const genRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const myGen = ++genRef.current;

    const { renderer, canvas } = acquireRenderer();

    // local vars we need for resume
    let scene = null;
    let camera = null;
    let planetGroup = null;
    let starGroup = null;
    let clock = null;

    let animationId = null;
    let running = false;

    const computeSize = () => {
      const computedW = Math.max(
        1,
        Math.floor(width ?? container.clientWidth - (disableListeners ? 0 : 10)),
      );
      const computedH = Math.max(
        1,
        Math.floor(height ?? container.clientHeight - (disableListeners ? 0 : 10)),
      );
      return { computedW, computedH };
    };

    const attachToContainerAndResize = () => {
      const { computedW, computedH } = computeSize();

      if (canvas.parentElement !== container) {
        canvas.parentElement?.removeChild(canvas);
        container.appendChild(canvas);
      }

      renderer.setSize(computedW, computedH, false);
      canvas.style.width = `${computedW}px`;
      canvas.style.height = `${computedH}px`;
      canvas.style.display = "block";
      canvas.style.backgroundColor = "transparent";
      // canvas.style.pointerEvents = "none";

      if (camera) {
        camera.aspect = computedW / computedH;
        camera.updateProjectionMatrix();
      }
    };

    const buildSceneOnce = () => {
      scene = new Scene();

      const { computedW, computedH } = computeSize();
      camera = new PerspectiveCamera(75, computedW / computedH, 0.1, 2000);
      camera.position.z = planetSize || 1;

      clock = new Clock();
      planetGroup = new Group();

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
        cloudPercent: cloudPercent ? Number(cloudPercent) : undefined,
        hydroPercent: hydroPercent ? Number(hydroPercent) : undefined,
        lavaPercent: lavaPercent ? Number(lavaPercent) : undefined,
        seed: seed ? seed : undefined,
      });

      if (!planet) return false;

      planetGroup.add(planet);
      scene.add(planetGroup);

      if (!disableListeners) {
        starGroup = createStars(warpStars);
        starGroup.position.z = -0.5;
        scene.add(starGroup);
      }

      if (type === "station" || type === "gate") {
        scene.add(new AmbientLight(0xffffff, 0.02));
        const dl = new DirectionalLight(0xffffff, 0.5);
        dl.position.set(5, 5, 5);
        scene.add(dl);
      }

      return true;
    };

    // animation state
    let cameraStartTime;
    let currentZ;
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
      const warpStartZ = warpDistance * 300;
      currentZ = warpStartZ;
    }

    const stop = () => {
      running = false;
      if (animationId) cancelAnimationFrame(animationId);
      animationId = null;
    };

    const start = () => {
      if (running) return;
      if (genRef.current !== myGen) return;
      if (getThreeCanvasOwner() !== hostKey) return;
      if (!scene || !camera) return;

      running = true;

      if (warpDistance && camera) {
        const warpStartZ = warpDistance * 300;
        camera.position.z = warpStartZ;
        currentZ = warpStartZ;
        cameraStartTime = undefined;
      }

      const animate = () => {
        if (genRef.current !== myGen) return stop();
        if (getThreeCanvasOwner() !== hostKey) return stop();

        animationId = requestAnimationFrame(animate);

        if (warpDistance && camera) {
          if (!cameraStartTime) cameraStartTime = performance.now();
          const damping = 0.1;
          currentZ += (warpDistance - currentZ) * damping;
          camera.position.z = currentZ;
        }

        if (planetGroup && clock) {
          planetGroup.children.forEach(p => {
            p.children.forEach(layer => {
              if (!layer.material || !("uniforms" in layer.material)) return;
              const u = layer.material.uniforms;
              if (!u?.time || !u?.time_speed) return;

              const elapsed = clock.getElapsedTime() % 10000;
              u.time.value = elapsed;

              if (holding && notLava) {
                console.log("move!", moveX)
                const rawDelta = moveX * 0.01;
                const limitedDelta = Math.max(-maxAccel, Math.min(maxAccel, rawDelta));
                u.time_speed.value += limitedDelta;
              } else {
                u.time_speed.value =
                  baseSpeed + (u.time_speed.value - baseSpeed) * timeFriction;
              }

              u.time_speed.value = Math.max(
                -maxTimeSpeed,
                Math.min(maxTimeSpeed, u.time_speed.value),
              );
            });
          });
        }

        if (starGroup) {
          starGroup.rotateY(skySpeed);
          starGroup.rotateX(skySpeed);
          starGroup.rotateZ(skySpeed);
        }

        if (type === "station" && planetGroup) {
          planetGroup.rotation.z += 0.0002;
        }

        if (type === "gate" && planetGroup && clock) {
          planetGroup.children.forEach(child => {
            if (child.userData.animate) child.userData.animate(clock.getElapsedTime());
          });
        }

        renderer.render(scene, camera);
        // moveX = totalX = 0;
        moveX = 0;
      };

      animate();
    };

    // initial claim behavior
    claimThreeCanvas(hostKey, { force: hostKey === "modal" });

    // build scene regardless, but only attach/start if we are owner
    const ok = buildSceneOnce();
    if (!ok) {
      releaseRenderer();
      return;
    }

    if (getThreeCanvasOwner() === hostKey) {
      attachToContainerAndResize();
      start();
    }

    // if dialog layout changes sizes after mount
    requestAnimationFrame(() => {
      if (genRef.current !== myGen) return;
      if (getThreeCanvasOwner() !== hostKey) return;
      attachToContainerAndResize();
    });

    // Resume on ownership changes
    const off = onThreeOwnerChange((newOwner) => {
      if (genRef.current !== myGen) return;
      if (newOwner === hostKey) {
        attachToContainerAndResize();
        start();
      } else {
        stop();
      }
    });

    // listeners
    let handleMouseDown = null;
    let handleMouseUp = null;
    let handlePointerMove = null;
    let lastX = 0;
    if (!disableListeners) {
      handleMouseDown = (e) => {
        holding = true;
        lastX = e.clientX ?? 0;
        container.style.cursor = "grabbing";
      };

      handleMouseUp = () => {
        holding = false;
        lastX = 0;
        container.style.cursor = "grab";
      };

      handlePointerMove = (e) => {
        if (!holding) return;
        const x = e.clientX ?? 0;
        const dx = x - lastX;
        lastX = x;

        // accumulate for this frame
        moveX += dx;
        totalX += dx;
      };
      window.addEventListener("pointerdown", handleMouseDown, false);
      window.addEventListener("pointerup", handleMouseUp, false);
      window.addEventListener("pointerleave", handleMouseUp, false);
      window.addEventListener("pointermove", handlePointerMove, false);
    }

    return () => {
      try {
        genRef.current++;
        off?.();
        stop();

        if (handleMouseDown) window.removeEventListener("pointerdown", handleMouseDown);
        if (handleMouseUp) {
          window.removeEventListener("pointerup", handleMouseUp);
          window.removeEventListener("pointerleave", handleMouseUp);
        }
        if (handlePointerMove) window.removeEventListener("pointermove", handlePointerMove);
        container.style.cursor = ""

        if (scene) disposeScene(scene);

        releaseThreeCanvas(hostKey);
        releaseRenderer();
      } catch (err) {
        console.error("threejs cleanup error", err);
      }
    };
  }, [
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
    ringSize,
    hydroPercent,
    lavaPercent,
    seed,
    planetSize,
    disableListeners,
    warpDistance,
    warpStars,
    hostKey,
  ]);

  return (
    <div
      ref={containerRef}
      style={{
        ...propStyle,
        cursor: disableListeners ? "" : "grab",
        width: typeof width === "number" ? `${width}px` : "100%",
        height: typeof height === "number" ? `${height}px` : "100%",
        aspectRatio: typeof width === "number" && typeof height === "number" ? undefined : "1 / 1",
        display: "flex",
        justifyContent: disableListeners ? "center" : "normal",
      }}
    />
  );
}

export function hexToVector4(rawHex) {
  let hex = rawHex.replace(/^#/, "");

  // expand shorthand (e.g. "abc" → "aabbcc")
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map(c => c + c)
      .join("");
  }

  const hasAlpha = hex.length === 8;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const a = hasAlpha ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

  return new Vector4(r, g, b, a);
}

export default memo(ThreejsPlanet);
