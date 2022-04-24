import vec, * as v2 from "./vec2.js";
import * as hex from "./hex.js";
import SimplexNoise from "https://cdn.skypack.dev/simplex-noise@3.0.1";

const biome = (() => {
  const newNoise = () => SimplexNoise.prototype.noise2D.bind(new SimplexNoise());
  const qP = newNoise();

  return (x, y) => {
    const s = 0.04;
    const q = (qP(x*s, y*s) + 1)/2;

    if (q < 0.29  ) return 'skyblue';
    if (q < 0.38  ) return 'beige';
    if (q < 0.5   ) return 'greenyellow';
    if (q < 0.7   ) return 'green';
    return 'darkgreen';
  };
})();

export const SIGHT_GRID_SIZE = 20;
/* estimate */
export const SIGHT_WORLD_SIZE = v2.mag(hex.axialToOffset({ x: 0, y: SIGHT_GRID_SIZE }));

export default {
  cache: new Map(),
  at(pos) {
    const { cache } = this;
    const k = v2.toStr(pos);

    if (!cache.has(k))
      cache.set(k, biome(pos.x, pos.y));

    return cache.get(k);
  },
  garbageCollect(keepNear /* <- screen pos */) {
    for (const [k, v] of this.cache) {
      const dist = v2.dist(hex.axialToOffset(v2.fromStr(k)), keepNear);
      if (dist > SIGHT_GRID_SIZE*100)
        this.cache.delete(k);
    }
  }
};
