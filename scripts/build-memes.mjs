// Lists the meme images in public/memes/<event>/ into public/memes/manifest.json,
// so the game can pick a random one per event without a backend. Runs before dev and build.
import { readdirSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(process.cwd(), "public", "memes");
const EVENTS = ["police_reveal", "caught", "escaped", "wrong_accuse", "king_reveal", "last_place"];
const IMAGE = /\.(jpe?g|png|webp|gif|avif)$/i;

const manifest = {};
for (const event of EVENTS) {
  const dir = join(root, event);
  manifest[event] = existsSync(dir)
    ? readdirSync(dir).filter((f) => IMAGE.test(f) && statSync(join(dir, f)).isFile()).sort()
    : [];
}
writeFileSync(join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("memes:", Object.entries(manifest).map(([k, v]) => `${k}=${v.length}`).join(" "));
