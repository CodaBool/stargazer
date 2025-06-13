import { Group, Mesh, BoxGeometry, TorusGeometry, MeshStandardMaterial, MathUtils, Color } from 'three';

export function createStation() {
  const group = new Group();

  // Core ring
  const ring = new Mesh(
    new TorusGeometry(0.6, 0.019),
    new MeshStandardMaterial({
      color: "#aaa",
      metalness: .2,
      roughness: 1,
    })
  );
  group.add(ring);

  // Dense clutter
  const moduleCount = 400;
  for (let i = 0; i < moduleCount; i++) {
    const angle = (i / moduleCount) * Math.PI * 2;

    // Position ring clutter close to tube surface
    const radius = 0.6 + MathUtils.randFloatSpread(0.008); // tightly hugs new thin tube
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    const box = new Mesh(
      new BoxGeometry(
        MathUtils.randFloat(0.008, 0.02),
        MathUtils.randFloat(0.008, 0.02),
        MathUtils.randFloat(0.02, 0.04)
      ),
      new MeshStandardMaterial({
        color: randomColor(),
      })
    );

    box.position.set(x, y, MathUtils.randFloatSpread(0.05)); // keep Z spread subtle
    box.lookAt(0, 0, 0); // keep boxes facing inward
    group.add(box);
  }

  return group;
}

function randomColor() {
  // https://www.color-hex.com/color-palette/15328
  const palette = ['#b5c9c9', '#74749c', '#2d475e', '#27163c', '#180429'];
  return new Color(palette[Math.floor(Math.random() * palette.length)]);
}
