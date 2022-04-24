import vec, * as v2 from "./vec2.js";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.1";

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

(window.onresize = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})();

const ent = (arg={}) => ({ pos: vec(), vel: vec(), ...arg });
let player = ent(), ents = [player];

const keys = new Set();
window.onkeydown = ({ key }) => keys.add(key);
window.onkeyup = ({ key }) => keys.delete(key);

let cam = vec();

requestAnimationFrame(function frame(now) {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();

  ctx.translate(canvas.width/2 - cam.x, canvas.height/2 - cam.y);

  let mv = vec();
  if (keys.has("w")) mv.y -= 1;
  if (keys.has("s")) mv.y += 1;
  if (keys.has("a")) mv.x -= 1;
  if (keys.has("d")) mv.x += 1;
  player.vel = v2.add(player.vel, v2.mulf(v2.norm(mv), 2));

  cam = v2.lerp(cam, player.pos, 0.03);
  
  for (const ent of ents) {
    const { add, mulf } = v2;

    ent.vel = mulf(ent.vel, 0.8);
    ent.pos = add(ent.pos, ent.vel);
  }

  ctx.fillStyle = "black";
  for (const { pos: { x, y } } of ents) {
    const w = 40*1.5, h = 50*1.5;
    ctx.fillRect(x-w/2, y-h/2, w, h);
  }

  ctx.restore();
  
  requestAnimationFrame(frame);
});
