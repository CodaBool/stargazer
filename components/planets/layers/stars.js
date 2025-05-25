import { TextureLoader, Group, Sprite, SpriteMaterial, NearestFilter } from "three";

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

function randomPointOnSphere() {
  var u = Math.random();
  var v = Math.random();
  var theta = 2 * Math.PI * u;
  var phi = Math.acos(2 * v - 1);
  var x = 0 + (1 * Math.sin(phi) * Math.cos(theta));
  var y = 0 + (1 * Math.sin(phi) * Math.sin(theta));
  var z = 0 + (1 * Math.cos(phi));
  return { "x": x, "y": y, "z": z };
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
        opacity: rand(0.1, 1)
      })

      const starObj = new Sprite(mat);
      starObj.scale.set(0.05, 0.05)
      const position = randomPointOnSphere()
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
        opacity: rand(0.1, 1)
      })

      const starObj = new Sprite(mat);
      starObj.scale.set(0.03, 0.03)
      const position = randomPointOnSphere()
      starObj.position.z = position.z
      starObj.position.y = position.y
      starObj.position.x = position.x
      starGroup.add(starObj);
    }
  }
  return starGroup
}
