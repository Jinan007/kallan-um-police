import { mulberry32 } from "./slots";

const cache = new Map<string, string>();

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

/** A lumpy closed outline: the radius wobbles around a circle, joined with smooth curves. */
function blobPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, rand: () => number) {
  const n = 15;
  const pts = Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2;
    const r = R * (0.74 + rand() * 0.36);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  });
  const mid = (i: number) => {
    const p = pts[i % n];
    const q = pts[(i + 1) % n];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  };
  ctx.beginPath();
  const start = mid(n - 1);
  ctx.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const m = mid(i);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
}

/** Random flat facets (light or dark) plus creases: the two things that read as "crumpled". */
function crumpleDetail(
  ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number,
  facets: number, creases: number, strength: number,
) {
  for (let i = 0; i < facets; i++) {
    const x = rand() * w;
    const y = rand() * h;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (rand() - 0.5) * w * 0.7, y + (rand() - 0.5) * h * 0.7);
    ctx.lineTo(x + (rand() - 0.5) * w * 0.7, y + (rand() - 0.5) * h * 0.7);
    ctx.closePath();
    ctx.fillStyle =
      rand() < 0.5
        ? `rgba(70,45,15,${rand() * 0.2 * strength})`
        : `rgba(255,255,255,${rand() * 0.28 * strength})`;
    ctx.fill();
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < creases; i++) {
    let x = rand() * w;
    let y = rand() * h;
    const pts: [number, number][] = [[x, y]];
    const segments = 2 + Math.floor(rand() * 2);
    for (let k = 0; k < segments; k++) {
      x += (rand() - 0.5) * w * 0.5;
      y += (rand() - 0.5) * h * 0.5;
      pts.push([x, y]);
    }
    // a dark line with a light one just beside it reads as a fold
    for (const [offset, rgb, alpha] of [[0, "70,45,15", 0.4], [1.4, "255,255,255", 0.55]] as const) {
      ctx.beginPath();
      pts.forEach(([px, py], j) => (j ? ctx.lineTo(px + offset, py + offset) : ctx.moveTo(px + offset, py + offset)));
      ctx.strokeStyle = `rgba(${rgb},${alpha * strength})`;
      ctx.stroke();
    }
  }
}

/** A crumpled paper ball with a soft shadow baked in. Drawn once per seed, then it is just an image. */
export function ballTexture(seed: number, size = 192): string {
  const key = `ball:${seed}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const rand = mulberry32(seed);
  const { c, ctx } = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2 - size * 0.03;
  const R = size * 0.34;

  blobPath(ctx, cx, cy, R, mulberry32(seed + 1));
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = size * 0.07;
  ctx.shadowOffsetY = size * 0.05;
  ctx.fillStyle = "#efe4c4";
  ctx.fill();
  ctx.restore();

  blobPath(ctx, cx, cy, R, mulberry32(seed + 1));
  ctx.save();
  ctx.clip();
  const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.1);
  g.addColorStop(0, "#fffaf0");
  g.addColorStop(0.55, "#eadfbd");
  g.addColorStop(1, "#a89870");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  crumpleDetail(ctx, size, size, rand, 34, 26, 1);
  // a faint notebook rule showing through: the chit was torn from a notebook
  ctx.strokeStyle = "rgba(90,130,190,0.28)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) {
    const y = cy - R + rand() * R * 2;
    ctx.beginPath();
    ctx.moveTo(cx - R, y);
    ctx.quadraticCurveTo(cx, y + (rand() - 0.5) * 14, cx + R, y);
    ctx.stroke();
  }
  ctx.restore();

  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}

/** Transparent crease overlay laid over a flat sheet so it looks freshly uncrumpled. */
export function creaseTexture(seed: number, w = 320, h = 320): string {
  const key = `crease:${seed}:${w}x${h}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { c, ctx } = makeCanvas(w, h);
  crumpleDetail(ctx, w, h, mulberry32(seed + 99), 46, 34, 1.15);
  const url = c.toDataURL();
  cache.set(key, url);
  return url;
}
