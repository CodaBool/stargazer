import { TextureLoader, Group, Sprite, SpriteMaterial, NearestFilter } from "three";

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomPointOnSphere(zoomAwayAmount = 18) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const x = zoomAwayAmount * Math.sin(phi) * Math.cos(theta);
  const y = zoomAwayAmount * Math.sin(phi) * Math.sin(theta);
  const z = zoomAwayAmount * Math.cos(phi);
  return { x, y, z };
}


export function createStars(count) {
  const starGroup = new Group()
  let mat;

  for (let i = 0; i < count; i++) {
    let isSpecial = Math.random() > 0.5
    if (isSpecial) {
      const texture = new TextureLoader().load("/threejs/stars-special.png")

      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter

      texture.repeat.x = 1 / 6;
      texture.offset.x = Math.floor((rand(1, 6)) % 6) * 25 / 150;

      const mat = new SpriteMaterial({
        map: texture,
        color: Math.random() > 0.5 ? "#ffef9e" : "#ffffff",
        transparent: true,
        opacity: rand(0.1, 1),
        // depthWrite: false,
      })

      const starObj = new Sprite(mat);
      starObj.scale.set(.5, .5)
      // starObj.scale.set(0.05, 0.05)
      const position = randomPointOnSphere();
      starObj.position.z = position.z
      starObj.position.y = position.y
      starObj.position.x = position.x
      starGroup.add(starObj);
    }
    else {
      const texture = new TextureLoader().load("/threejs/stars.png")

      texture.magFilter = NearestFilter
      texture.minFilter = NearestFilter

      texture.repeat.x = 1 / 17;
      texture.offset.x = Math.floor((rand(1, 17)) % 9) * 9 / 144;

      const mat = new SpriteMaterial({
        map: texture,
        color: Math.random() > 0.5 ? "#ffef9e" : "#ffffff",
        transparent: true,
        opacity: rand(0.1, 1),
        // depthWrite: false,
      })

      const starObj = new Sprite(mat);
      starObj.scale.set(0.4, 0.4)
      // starObj.scale.set(0.03, 0.03)
      const position = randomPointOnSphere();
      starObj.position.z = position.z
      starObj.position.y = position.y
      starObj.position.x = position.x
      starGroup.add(starObj);
    }
  }
  return starGroup
}
