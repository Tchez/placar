/**
 * Generates the truco gaudério surface textures.
 *
 * Everything here is procedural and seeded, so the output is byte-stable and no
 * third-party image is vendored into a public repository. Run with
 * `npm run textures` after changing a parameter; the results are committed.
 *
 *   ground.webp   seamless dark leather for the board, colour baked in
 *   leather.webp  the same pebbling in mid grey, blended over a control colour
 *   crackle.webp  seamless craquelure for the team ribbons, same idea
 *   plank.webp    the header plank: wood grain plus a torn bottom edge in alpha
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'src',
  'assets',
  'textures',
);

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (edge0, edge1, x) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Seamless value-noise lattice, sampled with wrap-around. */
function makeLattice(size, rand) {
  const values = new Float32Array(size * size);
  for (let i = 0; i < values.length; i += 1) values[i] = rand();
  return (x, y) => {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const wrap = (n) => ((n % size) + size) % size;
    const ix0 = wrap(x0);
    const ix1 = wrap(x0 + 1);
    const iy0 = wrap(y0);
    const iy1 = wrap(y0 + 1);
    const v00 = values[iy0 * size + ix0];
    const v10 = values[iy0 * size + ix1];
    const v01 = values[iy1 * size + ix0];
    const v11 = values[iy1 * size + ix1];
    return (
      (v00 * (1 - sx) + v10 * sx) * (1 - sy) + (v01 * (1 - sx) + v11 * sx) * sy
    );
  };
}

function fbm(sample, x, y, octaves) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let total = 0;
  for (let o = 0; o < octaves; o += 1) {
    value += sample(x * frequency, y * frequency) * amplitude;
    total += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / total;
}

/**
 * Toroidal Voronoi over a jittered grid. Returns f2 - f1 per pixel, normalised
 * by cell size: 0 on a cell boundary, ~1 at a cell centre. Toroidal distance is
 * what makes the tile seamless.
 */
function voronoiEdges({ size, cells, jitter, seed }) {
  const rand = mulberry32(seed);
  const cell = size / cells;
  const sites = new Float32Array(cells * cells * 2);
  for (let gy = 0; gy < cells; gy += 1) {
    for (let gx = 0; gx < cells; gx += 1) {
      const i = (gy * cells + gx) * 2;
      sites[i] = (gx + 0.5 + (rand() - 0.5) * jitter) * cell;
      sites[i + 1] = (gy + 0.5 + (rand() - 0.5) * jitter) * cell;
    }
  }

  const edges = new Float32Array(size * size);
  const wrapDelta = (d) => {
    if (d > size / 2) return d - size;
    if (d < -size / 2) return d + size;
    return d;
  };

  for (let y = 0; y < size; y += 1) {
    const gy = Math.floor(y / cell);
    for (let x = 0; x < size; x += 1) {
      const gx = Math.floor(x / cell);
      let f1 = Infinity;
      let f2 = Infinity;
      for (let oy = -1; oy <= 1; oy += 1) {
        for (let ox = -1; ox <= 1; ox += 1) {
          const cx = (((gx + ox) % cells) + cells) % cells;
          const cy = (((gy + oy) % cells) + cells) % cells;
          const i = (cy * cells + cx) * 2;
          const dx = wrapDelta(sites[i] - x);
          const dy = wrapDelta(sites[i + 1] - y);
          const d = Math.hypot(dx, dy);
          if (d < f1) {
            f2 = f1;
            f1 = d;
          } else if (d < f2) {
            f2 = d;
          }
        }
      }
      edges[y * size + x] = (f2 - f1) / cell;
    }
  }
  return edges;
}

/** The pebble height field both leather tiles are shaded from. */
function pebbleField({ size, cells, seed, gritSeed, gritScale }) {
  const edges = voronoiEdges({ size, cells, jitter: 0.95, seed });
  const grit = makeLattice(256, mulberry32(gritSeed));
  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i += 1) {
    const x = i % size;
    const y = (i - x) / size;
    const bulge = smoothstep(0, 0.42, edges[i]);
    const fine =
      fbm((a, b) => grit(a, b), x / gritScale, y / gritScale, 3) - 0.5;
    height[i] = bulge + fine * 0.22;
  }
  return height;
}

/** Slope of the field towards the light, wrapped so the tile stays seamless. */
function pebbleSlope(height, size, x, y) {
  const i = y * size + x;
  return (
    height[y * size + ((x + 1) % size)] -
    height[i] +
    (height[((y + 1) % size) * size + x] - height[i])
  );
}

/** Pebbled leather: soft cell bulges, embossed so light catches the seams. */
async function writeLeather() {
  const size = 512;
  const height = pebbleField({
    size,
    cells: 26,
    seed: 20260823,
    gritSeed: 7717,
    gritScale: 3.1,
  });

  const raw = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      // Emboss: the slope towards the light, not the height itself.
      const slope = pebbleSlope(height, size, x, y);
      const value = clamp(128 + slope * 210 + (height[i] - 0.5) * 26, 0, 255);
      const o = i * 3;
      raw[o] = value;
      raw[o + 1] = value;
      raw[o + 2] = value;
    }
  }

  await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality: 78, effort: 6 })
    .toFile(join(OUT_DIR, 'leather.webp'));
  return 'leather.webp';
}

/**
 * The board itself: the same pebbling, but with colour baked in. Blending a
 * mid-grey tile over near-black leaves almost nothing visible, and the grain of
 * the board is meant to read.
 */
async function writeGround() {
  const size = 512;
  const height = pebbleField({
    size,
    cells: 21,
    seed: 55127,
    gritSeed: 3391,
    gritScale: 2.7,
  });

  const raw = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const slope = pebbleSlope(height, size, x, y);
      const lit = clamp(0.5 + slope * 1.5 + (height[i] - 0.5) * 0.22, 0, 1);
      const o = i * 3;
      // Seam shadow to lit hide: near-black through to a warm dark brown.
      raw[o] = clamp(7 + lit * 46, 0, 255);
      raw[o + 1] = clamp(5 + lit * 33, 0, 255);
      raw[o + 2] = clamp(4 + lit * 24, 0, 255);
    }
  }

  await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality: 90, effort: 6 })
    .toFile(join(OUT_DIR, 'ground.webp'));
  return 'ground.webp';
}

/** Craquelure: thin dark cracks with a lit lip, the way old painted leather goes. */
async function writeCrackle() {
  const size = 512;
  const edges = voronoiEdges({ size, cells: 11, jitter: 1, seed: 611023 });
  const fineEdges = voronoiEdges({ size, cells: 23, jitter: 1, seed: 90211 });
  const grit = makeLattice(256, mulberry32(4242));

  const crack = new Float32Array(size * size);
  for (let i = 0; i < crack.length; i += 1) {
    const wide = 1 - smoothstep(0, 0.075, edges[i]);
    const fine = (1 - smoothstep(0, 0.05, fineEdges[i])) * 0.55;
    crack[i] = Math.max(wide, fine);
  }

  const raw = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const lip = crack[((y + 1) % size) * size + ((x + 1) % size)];
      const fine = fbm((a, b) => grit(a, b), x / 2.4, y / 2.4, 3) - 0.5;
      const value = clamp(132 - crack[i] * 96 + lip * 46 + fine * 20, 0, 255);
      const o = i * 3;
      raw[o] = value;
      raw[o + 1] = value;
      raw[o + 2] = value;
    }
  }

  await sharp(raw, { raw: { width: size, height: size, channels: 3 } })
    .webp({ quality: 78, effort: 6 })
    .toFile(join(OUT_DIR, 'crackle.webp'));
  return 'crackle.webp';
}

/**
 * The header plank. Colour is baked in, and the bottom edge is torn in the
 * alpha channel: a noisy silhouette with the odd fibre hanging below it, which
 * a CSS path cannot do convincingly.
 */
async function writePlank() {
  const width = 1024;
  const height = 384;
  const rand = mulberry32(31337);
  const grainLattice = makeLattice(256, mulberry32(515));
  const edgeLattice = makeLattice(128, mulberry32(9091));
  const grain = (x, y) => grainLattice(x, y);

  // Long, thin features: stretched hard along x, tight along y.
  const grainAt = (x, y) => fbm(grain, x / 40, y / 4.2, 5);

  const streaks = Array.from({ length: 42 }, () => ({
    y: rand() * height,
    thickness: 1.4 + rand() * 5,
    strength: 0.18 + rand() * 0.5,
    dark: rand() > 0.32,
    phase: rand() * 1000,
  }));

  const tearAt = (x) => {
    const base = height - 40;
    const roll = (fbm(edgeLattice, x / 70, 11.3, 4) - 0.5) * 16;
    const chew = (fbm(edgeLattice, x / 22, 41.7, 4) - 0.5) * 22;
    const bite =
      Math.pow(clamp(fbm(edgeLattice, x / 160, 77.1, 2) * 1.35, 0, 1), 6) * 30;
    return base + roll + chew - bite;
  };

  const fibre = new Float32Array(width);
  for (let n = 0; n < 150; n += 1) {
    const centre = rand() * width;
    const len = 4 + rand() * 19;
    const half = 2 + rand() * 6;
    for (let d = -Math.ceil(half); d <= Math.ceil(half); d += 1) {
      const px = (Math.round(centre) + d + width) % width;
      const taper = Math.pow(1 - Math.abs(d) / half, 0.7);
      if (taper > 0) fibre[px] = Math.max(fibre[px], len * taper);
    }
  }

  const raw = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let g = grainAt(x, y);

      for (const streak of streaks) {
        const wobble = (fbm(grain, x / 70, streak.phase, 3) - 0.5) * 9;
        const dist = Math.abs(y - (streak.y + wobble));
        if (dist < streak.thickness) {
          const falloff = 1 - dist / streak.thickness;
          g += (streak.dark ? -1 : 1) * streak.strength * falloff;
        }
      }

      // Vertical shading: sinking into shadow towards the tear.
      const t = y / height;
      g -= smoothstep(0.5, 1, t) * 0.26;

      const tone = clamp(g, 0, 1);
      // Dark chocolate to a warm, lit brown.
      const r = 21 + tone * 78;
      const gr = 12 + tone * 49;
      const b = 8 + tone * 28;

      const tear = tearAt(x);
      const overhang = tear + fibre[x];
      let alpha = 255;
      if (y > tear) {
        alpha = y < overhang ? 255 : 0;
      }
      // A hard shadow line just above the break, so the plank reads as split.
      const shade = y > tear - 6 && y <= tear ? 0.5 : 1;

      const o = (y * width + x) * 4;
      raw[o] = clamp(r * shade, 0, 255);
      raw[o + 1] = clamp(gr * shade, 0, 255);
      raw[o + 2] = clamp(b * shade, 0, 255);
      raw[o + 3] = alpha;
    }
  }

  await sharp(raw, { raw: { width, height, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(join(OUT_DIR, 'plank.webp'));
  return 'plank.webp';
}

mkdirSync(OUT_DIR, { recursive: true });
const written = await Promise.all([
  writeGround(),
  writeLeather(),
  writeCrackle(),
  writePlank(),
]);
process.stdout.write(`wrote ${written.join(', ')} to ${OUT_DIR}\n`);
