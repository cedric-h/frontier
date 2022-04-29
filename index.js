import vec, * as v2 from "./vec2.js";
import * as hex from "./hex.js";
import map, { SIGHT_WORLD_SIZE, SIGHT_GRID_SIZE } from "./map.js";

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

const fmtColor = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

let cam = vec();

const drawHex = (ctx, x, y, size, rot=0) => {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    let r = Math.PI * 2 * (i / 6) + Math.PI/2 + rot;
    ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(r) * size.x,
                                 y + Math.sin(r) * size.y);
  }
  ctx.fill();
}

const hexGridToSet = hg => new Set(hg.map(v2.toStr));
const hexGridFromSet = set => [...set].map(v2.fromStr);
const dedupHexGrids = hg => hexGridFromSet(hexGridToSet(hg));

const megaHex = n => [...Array(n)].reduce(
  acc => dedupHexGrids(acc.flatMap(hex.neighbors)),
  hex.neighbors(vec())
);
const sightGrid = megaHex(SIGHT_GRID_SIZE-1)
  .sort((a, b) => (a.y + a.x*0.1) - (b.y + b.x*0.1));

const minimap = (() => {
  const canvas = document.createElement("canvas");
  const s = canvas.width = canvas.height = 300;
  const ctx = canvas.getContext("2d");

  drawHex(ctx, s/2, s/2, vec(0.9 * s/2), Math.PI/2);

  const discovered = new Set();
  return {
    canvas,
    ctx,

    /* world pos -> minimap tile */
    miniTile: p => hex.offsetToAxial(p, hex.GRID_SIZE*5),
    /* minimap tile -> pixel on minimap */
    miniTilePixel: hp => v2.add(vec(s/2), hex.axialToOffset(hp, 5)),
    /* minimap tile -> world pixel */
    miniTileWorld: hp => hex.axialToOffset(hp, hex.GRID_SIZE*5),

    discover(p, map) {
      for (const minihex of hex.neighbors(this.miniTile(p))) {
        if (discovered.has(v2.toStr(minihex))) continue;
        discovered.add(v2.toStr(minihex));

        const { x, y } = this.miniTilePixel(minihex);
        const world = this.miniTileWorld(minihex);

        let [cr, cg, cb] = map.at(hex.offsetToAxial(world));
        for (const p of v2.circle(10)) {
          const [r, g, b] = map.at(hex.offsetToAxial(
            v2.add(world, v2.mulf(p, hex.GRID_SIZE*5))));
          cr += r;
          cg += g;
          cb += b;
        }
        ctx.fillStyle = fmtColor([cr / 11, cg / 11, cb / 11]);
        drawHex(ctx, x, y, vec(5));
      }
    }
  };
})();

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

  cam = v2.lerp(cam, player.pos, 0.04);
  map.garbageCollect(cam);
  minimap.discover(player.pos, map);

  for (const ent of ents) {
    const { add, mulf } = v2;

    ent.vel = mulf(ent.vel, 0.8);
    ent.pos = add(ent.pos, ent.vel);
  }


  const ph = hex.offsetToAxial(player.pos);
  const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;
  for (const oh of sightGrid) {
    const hexh = v2.add(oh, ph);
    const { x, y } = hex.axialToOffset(hexh);

    const a = v2.dist({x, y}, player.pos) / SIGHT_WORLD_SIZE;
    ctx.globalAlpha = 0.9 * easeInOutSine(1 - Math.min(1, a));

    ctx.fillStyle = fmtColor(map.at(hexh));
    drawHex(ctx, x, y, vec(hex.GRID_SIZE * 1.1));
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "black";

  for (const { pos: { x, y } } of ents) {
    const w = 40*1.5, h = 50*1.5;
    ctx.fillRect(x-w/2, y-h/2, w, h);
  }

  ctx.restore();

  const miniX = canvas.width - minimap.canvas.width
  ctx.drawImage(minimap.canvas, miniX, 0);

  const pmini = minimap.miniTilePixel(minimap.miniTile(player.pos));
  ctx.fillStyle = "red";
  drawHex(ctx, miniX + pmini.x, pmini.y, vec(3));
  
  requestAnimationFrame(frame);
});
