import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector4 } from "three";
import { hexToVector4 } from "../../threejsPlanet";

const vertexShader = () => `
  varying vec3 vUv;
  void main() {
    vUv = position;
    vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewPosition;
  }
`;


const fragmentShaderCity = () => `
  varying vec3 vUv;

  uniform float pixels;
  uniform float rotation;
  uniform vec2 light_origin;
  uniform float time_speed;
  uniform float seed;
  uniform float time;

  uniform float city_cutoff;
  uniform float lights_strength;
  uniform float surface_strength;
  uniform float night_surface_min;

  uniform vec4 col1; // warm bright
  uniform vec4 col2; // cool bright
  uniform vec4 col3; // surface mid
  uniform vec4 col4; // surface dark

  float size = 10.0;

  // Seed affects phase not amplitude (stable, avoids "mask=0 everywhere")
  float rand(vec2 p) {
    float s = seed * 131.7 + 17.3;
    return fract(sin(dot(p + vec2(s, s * 0.73), vec2(12.9898,78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);

    float a = rand(i);
    float b = rand(i + vec2(1.0, 0.0));
    float c = rand(i + vec2(0.0, 1.0));
    float d = rand(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 6; i++) {
      v += noise(p) * a;
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec2 rotate2(vec2 p, float a) {
    p -= 0.5;
    p *= mat2(vec2(cos(a), -sin(a)), vec2(sin(a), cos(a)));
    return p + 0.5;
  }

  // Rim-safe spherify (prevents blank)
  vec2 spherify(vec2 uv) {
    vec2 c = uv * 2.0 - 1.0;
    float zz = max(0.0, 1.0 - dot(c, c));
    float z = sqrt(zz);
    vec2 s = c / (z + 1.0);
    return s * 0.5 + 0.5;
  }

  // FIXED grid: returns thin lines, NOT "mostly 1"
  float gridLines(vec2 uv, float cell, float thickness) {
    vec2 f = fract(uv / cell);
    float dx = min(f.x, 1.0 - f.x) * cell;
    float dy = min(f.y, 1.0 - f.y) * cell;
    float d = min(dx, dy);
    return 1.0 - smoothstep(thickness, thickness * 2.0, d);
  }

  float arterial(vec2 uv, vec2 dir, float thickness) {
    uv -= 0.5;
    dir = normalize(dir);
    float d = abs(uv.x * (-dir.y) + uv.y * (dir.x));
    return 1.0 - smoothstep(thickness, thickness * 2.0, d);
  }

  float ringRoad(vec2 uv, vec2 center, float radius, float thickness) {
    float d = abs(distance(uv, center) - radius);
    return 1.0 - smoothstep(thickness, thickness * 2.0, d);
  }

  void main() {
    vec2 uv = (floor(vUv.xy * pixels) / pixels) + 0.5;

    float d_circle = distance(uv, vec2(0.5));
    float maskCircle = step(d_circle, 0.49999);

    float spin = rotation + time * time_speed * 0.15;
    uv = rotate2(uv, spin);
    uv = spherify(uv);

    // Make day larger (so it doesn't feel like a night-only blob)
    float d_light = distance(uv, light_origin);
    // Bigger, clearer terminator
    // float night = smoothstep(0.45, 0.75, d_light);
    float night = smoothstep(0.25, 0.65, d_light);
    float day = 1.0 - night;



    // Urban / city distribution — but don't let it kill everything
    vec2 nUV = uv * size + vec2(time * time_speed * 0.03, 0.0);
    float urban = fbm(nUV);
    float cityMask = smoothstep(city_cutoff, city_cutoff + 0.08, urban);
    cityMask = max(cityMask, 0.35); // ecumenopolis default

    // Your grid sizing (now actually thin)
    float majorGrid = gridLines(uv + vec2(0.03 * seed, 0.01 * seed), 0.030, 0.0012);
    float minorGrid = gridLines(uv + vec2(0.01, 0.02),               0.012, 0.0009);

    float art1 = arterial(uv, vec2(1.0, 0.35), 0.0016);
    float art2 = arterial(uv, vec2(0.25, 1.0), 0.0015);

    vec2 c1 = vec2(0.52, 0.48);
    vec2 c2 = vec2(0.38, 0.62);

    float rings =
      ringRoad(uv, c1, 0.12, 0.0013) +
      ringRoad(uv, c1, 0.18, 0.0012) +
      ringRoad(uv, c1, 0.24, 0.0011) +
      ringRoad(uv, c2, 0.14, 0.0012) +
      ringRoad(uv, c2, 0.20, 0.0011);

    float roads = clamp(
      majorGrid * 0.9 +
      minorGrid * 0.7 +
      art1 + art2 +
      rings * 1.0,
      0.0, 1.0
    );

    // Blocks for neighborhood variation
    vec2 snap = floor(uv * 520.0) / 520.0;
    float blocks = noise(snap * 40.0 + seed);
    float heightHint = smoothstep(0.25, 0.85, blocks);

    // DARK surface (city planets need contrast)
    vec3 surface = mix(col4.rgb, col3.rgb, heightHint);
    surface *= 0.55; // <- key: stop "blue sphere" feel
    surface = mix(surface, col2.rgb, roads * 0.08); // tiny day tint only

    float nightMin = max(night_surface_min, 0.22);
    surface *= mix(nightMin, 1.0, day);
    surface = mix(col4.rgb, surface, surface_strength);

    float dusk = 1.0 - abs(0.5 - night) * 2.0;  // peaks around terminator
    dusk = smoothstep(0.2, 0.9, dusk);

    // Lights
    // Sparkle that actually pops
    float sparkle = noise(uv * 420.0 + vec2(seed * 3.1, seed * 7.7));
    sparkle = smoothstep(0.60, 0.98, sparkle);  // fewer but brighter points

    float roadLights = smoothstep(0.10, 0.55, roads);

    // Night + dusk lets lights show near terminator
    float nightMix = clamp(night + 0.65 * dusk, 0.0, 1.0);

    // Thicker “glow” around roads so it reads as lighting, not just lines
    float roadGlow = smoothstep(0.02, 0.35, roads);

    // Main emissive mask
    float lightsMask =
      cityMask *
      nightMix *
      (0.55 * roadLights + 0.45 * roadGlow) *
      (0.35 + 1.25 * sparkle);


    // warm/cool zoning using blocks
    float temp = smoothstep(0.35, 0.85, blocks);
    vec3 lightsCol = mix(col2.rgb, col1.rgb, temp);

    vec3 rgb = surface;

    // baseline emissive so city never disappears (subtle)
    rgb += lightsCol * (0.05 * cityMask);

    // main emissive
    // rgb += lightsCol * (lightsMask * lights_strength);
    rgb += lightsCol * (lightsMask * (lights_strength * 2.5));


    gl_FragColor = vec4(rgb, maskCircle);
    // gl_FragColor = vec4(vec3(night), 1.0);

  }
`;


export function createCityLayer(
  lightPos = new Vector2(0.5, 0.75),
  colors,
  rotationSpeed = 0.0,
  rotation = 0.0,

  // cityCoverage: lower = more coverage; try 0.30–0.45 for ecumenopolis
  cityCoverage = 0.1,

  // lightsStrength: 1.2–2.5 depending on taste/palette
  lightsStrength = 2.5,

  // surfaceStrength: how visible grid/blocks are on day side (0..1)
  surfaceStrength = 24.0,

  // nightSurfaceMin: how dark the surface gets at night (0..1). Lower = more contrast
  nightSurfaceMin = 0.7,

  pixels,
  seed
) {
  let palette = [
    new Vector4(59 / 255, 63 / 255, 70 / 255, 1),  // raised structures / grids
    new Vector4(90 / 255, 95 / 255, 104 / 255, 1), // roads / highlights
    new Vector4(36 / 255, 39 / 255, 44 / 255, 1),  // building mass
    new Vector4(15 / 255, 16 / 255, 19 / 255, 1),  // deep occlusion
  ];

  // palette = [
  //     new Vector4(1.00, 0.82, 0.38, 1.0), // col1 — hot sodium / city core lights
  //     new Vector4(0.20, 0.85, 1.00, 1.0), // col2 — neon cyan / highways & towers
  //     new Vector4(0.08, 0.12, 0.18, 1.0), // col3 — dark steel / megastructure
  //     new Vector4(0.01, 0.015, 0.03, 1.0) // col4 — near-black night surface
  //   ]

  if (colors?.feature) {
    if (typeof colors.feature === "string") {
      // expects "FFD86B,6EC6FF,3A4A5E,0E1218" (no #)
      palette = colors.feature.split(",").map((h) => hexToVector4(h.trim()));
    } else if (typeof colors.feature === "object") {
      palette = colors.feature;
    }
  }

  const geom = new PlaneGeometry(1, 1);
  const mat = new ShaderMaterial({
    uniforms: {
      pixels: { value: pixels || 220.0 }, // higher makes city denser/less chunky
      rotation: { value: rotation },
      light_origin: { value: lightPos },
      time_speed: { value: rotationSpeed },
      seed: {
        value:
          seed ||
          (Math.random() > 0.5 ? Math.random() * 10 : Math.random() * 100),
      },
      time: { value: 0.0 },

      city_cutoff: { value: cityCoverage },
      lights_strength: { value: lightsStrength },
      surface_strength: { value: surfaceStrength },
      night_surface_min: { value: nightSurfaceMin },

      col1: { value: palette[0] },
      col2: { value: palette[1] },
      col3: { value: palette[2] },
      col4: { value: palette[3] },
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShaderCity(),
    transparent: true,
  });

  return new Mesh(geom, mat);
}
