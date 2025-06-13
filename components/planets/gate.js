import {
  Group,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TorusGeometry,
  MeshStandardMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  PointsMaterial,
  Points,
} from 'three';

export function createGate() {
  const group = new Group();

  // Torus ring
  const ring = new Mesh(
    new TorusGeometry(0.6, 0.015),
    new MeshStandardMaterial({ color: '#666' })
  );
  group.add(ring);

  const pulseShader = new ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;

      void main() {
      float radius = length(vUv);

        if (radius > 0.5) discard;

        float rings = sin((10.0 * radius - time * 3.0) * 6.2831);
        float glow = smoothstep(0.02, 0.1, 0.5 - abs(rings));

        vec3 color = mix(vec3(0.1, 0.1, 0.3), vec3(0.4, 0.8, 1.0), glow);

        float alpha = glow * 0.3;  // Try 0.2–0.5 for best results

        gl_FragColor = vec4(color, alpha);
      }
    `
  });

  // Iris shader
  const irisShader = new ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0.0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv - 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;

      void main() {
        float r = length(vUv);
        if (r > 0.5) discard; // Make circular
        float angle = atan(vUv.y, vUv.x);

        float spokes = abs(sin(12.0 * angle + time * 2.0));
        float iris = 1.0 - smoothstep(0.2, 0.4, r + spokes * 0.1);
        float flicker = sin(time * 10.0 + r * 20.0) * 0.05;

        vec3 color = mix(vec3(0.2, 0.4, 0.8), vec3(0.6, 0.9, 1.0), iris + flicker);
        gl_FragColor = vec4(color, iris);
      }
    `
  });

  const plane = new Mesh(new PlaneGeometry(1.2, 1.2), pulseShader);
  group.add(plane);


  const portal = new Mesh(new PlaneGeometry(1.2, 1.2), irisShader);
  group.add(portal);

  // Particle field (inside the portal)
  const particleCount = 100;
  const positions = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.sqrt(Math.random()) * 0.8; // uniform circle
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const z = (Math.random() - 0.8) * 0.1; // slight depth
    positions.push(x, y, z);
  }

  const particleGeo = new BufferGeometry();
  particleGeo.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const particleMat = new PointsMaterial({
    size: 0.006,
    color: 0x99ccff,
    // transparent: true,
    // opacity: 0.6,
    depthWrite: false,
  });

  const particles = new Points(particleGeo, particleMat);
  group.add(particles);

  // Animate shader + flicker particles
  group.userData.animate = (elapsed) => {
    pulseShader.uniforms.time.value = elapsed / 10;
    irisShader.uniforms.time.value = elapsed / 5
    const pos = particleGeo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      pos.array[i * 3 + 2] += Math.sin(elapsed + i) * 0.0005;
    }
    pos.needsUpdate = true;
  };

  return group;
}
