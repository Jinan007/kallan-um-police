import { DARES } from "../config/dares";
import type { Dare } from "../config/dares";

export const DARE_STORAGE_KEY = "kallan-um-police:dares:v1";

export const DARE_LIMITS = { min: 3, max: 14, labelMax: 10, textMax: 120 } as const;

/**
 * Cleans a list of dares: trims, drops rows without a label, clamps lengths,
 * and fills a missing dare text with the label. Returns null if fewer than
 * `min` usable rows remain (the wheel would be pointless).
 */
export function sanitizeDares(input: unknown): Dare[] | null {
  if (!Array.isArray(input)) return null;
  const rows: Dare[] = [];
  for (const row of input) {
    const r = row as Partial<Dare> | null;
    const short = typeof r?.short === "string" ? r.short.trim().slice(0, DARE_LIMITS.labelMax) : "";
    if (!short) continue;
    const text = typeof r?.text === "string" ? r.text.trim().slice(0, DARE_LIMITS.textMax) : "";
    rows.push({ short, text: text || short });
    if (rows.length === DARE_LIMITS.max) break;
  }
  return rows.length >= DARE_LIMITS.min ? rows : null;
}

export function loadDares(): Dare[] {
  try {
    const raw = localStorage.getItem(DARE_STORAGE_KEY);
    if (raw) {
      const clean = sanitizeDares(JSON.parse(raw));
      if (clean) return clean;
    }
  } catch {
    /* fall through to the defaults */
  }
  return [...DARES];
}

export function saveDares(dares: readonly Dare[]): void {
  try {
    localStorage.setItem(DARE_STORAGE_KEY, JSON.stringify(dares));
  } catch {
    /* not persisted: the wheel still works for this session */
  }
}
