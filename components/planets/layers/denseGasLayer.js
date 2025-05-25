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

const fragmentShader = () => {
  return `
        varying vec3 vUv;
        uniform float pixels;
        uniform float rotation;
        uniform vec2 light_origin;
        uniform float time_speed;
        uniform float cloud_cover;
        float stretch = 2.0;
        float cloud_curve = 1.3;
        float light_border_1 = 0.4;
        float light_border_2 = 0.6;
        float bands = 1.0;
        bool should_dither = true;

        uniform vec4 base_color;
        uniform vec4 outline_color;
        uniform vec4 shadow_base_color;
        uniform vec4 shadow_outline_color;


        float size = 15.0;
        int OCTAVES = 6;
        uniform float seed;
        uniform float time;

        float rand(vec2 coord) {
            coord = mod(coord, vec2(2.0,1.0)*floor(size+0.5));
            return fract(sin(dot(coord.xy ,vec2(12.9898,78.233))) * 15.5453 * seed);
        }

        float noise(vec2 coord){
            vec2 i = floor(coord);
            vec2 f = fract(coord);

            float a = rand(i);
            float b = rand(i + vec2(1.0, 0.0));
            float c = rand(i + vec2(0.0, 1.0));
            float d = rand(i + vec2(1.0, 1.0));

            vec2 cubic = f * f * (3.0 - 2.0 * f);

            return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
        }

        float fbm(vec2 coord){
            float value = 0.0;
            float scale = 0.5;

            for(int i = 0; i < OCTAVES ; i++){
                value += noise(coord) * scale;
                coord *= 2.0;
                scale *= 0.5;
            }
            return value;
        }

        float circleNoise(vec2 uv) {
            float uv_y = floor(uv.y);
            uv.x += uv_y*.31;
            vec2 f = fract(uv);
            float h = rand(vec2(floor(uv.x),floor(uv_y)));
            float m = (length(f-0.25-(h*0.5)));
            float r = h*0.25;
            return smoothstep(0.0, r, m*0.75);
        }

        float turbulence(vec2 uv) {
            float c_noise = 0.0;


            // more iterations for more turbulence
            for (int i = 0; i < 10; i++) {
                c_noise += circleNoise((uv * size *0.3) + (float(i+1)+10.) + (vec2(time * time_speed * .1, 0.0)));
            }
            return c_noise;
        }

        bool dither(vec2 uv_pixel, vec2 uv_real) {
            return mod(uv_pixel.x+uv_real.y,2.0/pixels) <= 1.0 / pixels;
        }

        vec2 spherify(vec2 uv) {
            vec2 centered= uv *2.0-1.0;
            float z = sqrt(1.0 - dot(centered.xy, centered.xy));
            vec2 sphere = centered/(z + 1.0);
            return sphere * 0.5+0.5;
        }

        vec2 rotate(vec2 coord, float angle){
            coord -= 0.5;
            coord *= mat2(vec2(cos(angle),-sin(angle)),vec2(sin(angle),cos(angle)));
            return coord + 0.5;
        }


        void main() {
            // pixelize uv
            vec2 uv = (floor(vUv.xy*pixels)/pixels) + 0.5;

            float light_d = distance(uv, light_origin);

            // we use this value later to dither between colors
            bool dith = dither(uv, vUv.xy);

            // stepping over 0.5 instead of 0.49999 makes some pixels a little buggy
            float a = step(length(uv-vec2(0.5)), 0.49999);

            // rotate planet
            uv = rotate(uv, rotation);

            // map to sphere
            uv = spherify(uv);

            // a band is just one dimensional noise
            float band = fbm(vec2(0.0, uv.y*size*bands));

            // turbulence value is circles on top of each other
            float turb = turbulence(uv);

            // by layering multiple noise values & combining with turbulence and bands
            // we get some dynamic looking shape
            float fbm1 = fbm(uv*size);
            float fbm2 = fbm(uv*vec2(1.0, 2.0)*size+fbm1+vec2(-time*time_speed*.1,0.0)+turb);

            // all of this is just increasing some contrast & applying light
            fbm2 *= pow(band,2.0)*7.0;
            float light = fbm2 + light_d*1.8;
            fbm2 += pow(light_d, 1.0)-0.3;
            fbm2 = smoothstep(-0.2, 4.0-fbm2, light);

            // apply the dither value
            if (dith && should_dither) {
                fbm2 *= 1.1;
            }

            // finally add colors
            float posterized = floor(fbm2*4.0)/2.0;
            vec4 col = base_color;

            if (fbm2 < 0.5) {
                col = outline_color;
            }
            if (light_d + fbm2 * 0.2 > light_border_1) {
                col = shadow_base_color;
            }
            if (light_d + fbm2 * 0.2 > light_border_2) {
                col = shadow_outline_color;
            }

            gl_FragColor = vec4(col.rgb, a * col.a);

        }
    `;
}

export function createDenseGasPlanet(lightPos = new Vector2(0.39, 0.7), rotationSpeed = 0.1, pixels, seed, colors) {

  let colorPalette = [
    new Vector4(238 / 255, 195 / 255, 154 / 255, 1),
    new Vector4(217 / 255, 160 / 255, 102 / 255, 1),
    new Vector4(143 / 255, 86 / 255, 59 / 255, 1),
    new Vector4(100 / 255, 60 / 255, 40 / 255, 1),
  ]
  if (typeof colors.base === "string") {
    colorPalette = colors.base.split(',').map(hexToVector4)
  } else if (typeof colors.base === "object") {
    colorPalette = colors.base
  }

  const ringGeometry = new PlaneGeometry(1, 1);
  const ringMaterial = new ShaderMaterial({
    uniforms: {
      base_color: { value: colorPalette[0] },
      outline_color: { value: colorPalette[1] },
      shadow_base_color: { value: colorPalette[2] },
      shadow_outline_color: { value: colorPalette[3] },
      pixels: { value: pixels ? (pixels * 1.5) : 150.0 },
      light_origin: { value: lightPos },
      time_speed: { value: rotationSpeed },
      rotation: { value: Math.random() },
      seed: { value: seed || Math.random() > 0.5 ? Math.random() * 10 : Math.random() * 100 },
      time: { value: 0.0 }
    },
    vertexShader: vertexShader(),
    fragmentShader: fragmentShader(),
    transparent: true,
  });

  const ringLayer = new Mesh(ringGeometry, ringMaterial)

  return ringLayer;
}
