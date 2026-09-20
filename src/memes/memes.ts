import { useEffect, useState } from "react";

export type MemeEvent = "police_reveal" | "caught" | "escaped" | "wrong_accuse" | "king_reveal" | "last_place";
type Manifest = Partial<Record<MemeEvent, string[]>>;

/** Pure: a random entry, or null when there is nothing to pick from. */
export function pickMeme(files: readonly string[] | undefined, rng: () => number = Math.random): string | null {
  if (!files || files.length === 0) return null;
  return files[Math.min(files.length - 1, Math.floor(rng() * files.length))];
}

export const memeUrl = (event: MemeEvent, file: string) => `/memes/${event}/${encodeURIComponent(file)}`;

let manifest: Promise<Manifest> | null = null;

/** Loads public/memes/manifest.json once (written by scripts/build-memes.mjs). Empty on any failure. */
export function loadManifest(): Promise<Manifest> {
  manifest ??= fetch("/memes/manifest.json")
    .then((r) => (r.ok && (r.headers.get("content-type") ?? "").includes("json") ? (r.json() as Promise<Manifest>) : {}))
    .catch(() => ({}));
  return manifest;
}

/** Warm the browser cache so a meme appears instantly when its moment arrives. */
export function preloadMemes(events: readonly MemeEvent[]): void {
  void loadManifest().then((m) => {
    for (const e of events) for (const f of m[e] ?? []) new Image().src = memeUrl(e, f);
  });
}

/** One random meme for an event, chosen once per mount. `url` is null when the folder is empty. */
export function useMeme(event: MemeEvent): { url: string | null; ready: boolean } {
  const [state, setState] = useState<{ url: string | null; ready: boolean }>({ url: null, ready: false });
  useEffect(() => {
    let live = true;
    void loadManifest().then((m) => {
      const file = pickMeme(m[event]);
      if (live) setState({ url: file ? memeUrl(event, file) : null, ready: true });
    });
    return () => {
      live = false;
    };
  }, [event]);
  return state;
}
