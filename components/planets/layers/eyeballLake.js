import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector4 } from "three";
import { hexToVector4 } from "../../threejsPlanet"

const vertexShader = () => {
  return `
    varying vec3 vUv;

    void main() {
      vUv = position;

      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `;
}

const fragmentShaderLakes = () => {
  return `
    varying vec3 vUv;

    uniform float pixels;
    uniform vec2 light_origin;
    uniform float lake_cutoff;

    uniform vec4 color1;
    uniform vec4 color2;
    uniform vec4 color3;

    float light_border_1 = 0.4;
    float light_border_2 = 0.6;

    vec2 spherify(vec2 uv) {
      vec2 centered = uv * 2.0 - 1.0;
      float z = sqrt(1.0 - dot(centered, centered));
      vec2 sphere = centered / (z + 1.0);
      return sphere * 0.5 + 0.5;
    }

    void main() {
      // pixelize (your standard pipeline)
      vec2 uv = (floor(vUv.xy * pixels) / pixels) + 0.5;

      // SAVE FLAT UV FOR CORRECT DISTANCE
      vec2 flatUV = uv;

      // lighting distance (flat space!)
      float d_light = distance(flatUV, light_origin);

      // map to sphere for rendering
      uv = spherify(uv);

      // color bands (unchanged logic)
      vec4 col = color1;
      if (d_light > light_border_1) col = color2;
      if (d_light > light_border_2) col = color3;

      // --- EYEBALL LAKE MASK (CORRECT SPACE) ---
      float eyeRadius = lake_cutoff;

      float a = 1.0 - smoothstep(
        eyeRadius,
        eyeRadius + (1.5 / pixels),
        d_light
      );

      // clip to planet disc
      a *= step(distance(flatUV, vec2(0.5)), 0.5);

      gl_FragColor = vec4(col.rgb, a * col.a);
    }
  `;
};


export function createEyeballLakeLayer(lightPos = new Vector2(0.2, 0.2), rotationSpeed = 0.1, hydroPercent=0.5, colors, rotation = 0.0, pixels, seed) {


  let colorPalette = [
    new Vector4(79 / 255, 164 / 255, 184 / 255, 1),
    new Vector4(76 / 255, 104 / 255, 133 / 255, 1),
    new Vector4(58 / 255, 63 / 255, 94 / 255, 1),
  ]
  if (typeof colors.feature === "string") {
    colorPalette = colors.feature.split(',').map(hexToVector4)
  } else if (typeof colors.feature === "object") {
    colorPalette = colors.feature
  }

  const planetGeometryLakes = new PlaneGeometry(1, 1);
  const planetMaterialLakes = new ShaderMaterial({
    uniforms: {
      pixels: { value: pixels || 100.0 },
      light_origin: { value: lightPos },
      seed: { value: seed || Math.random() > 0.5 ? Math.random() * 10 : Math.random() * 100 },
      time_speed: { value: rotationSpeed },
      lake_cutoff: { value: 0.3 },
      // lake_cutoff: { value: (1 - hydroPercent) || 0.6 },
      rotation: { value: rotation },
      color1: { value: colorPalette[0] },
      color2: { value: colorPalette[1] },
      color3: { value: colorPalette[2] },
      time: { value: 0.0 }
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderLakes(),
    transparent: true,
  });

  const lakeLayer = new Mesh(planetGeometryLakes, planetMaterialLakes);

  return lakeLayer;
}
