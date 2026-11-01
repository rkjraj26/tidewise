import type { AppData, Settings } from './types';
import { isValidKey } from './dates';

export const STORAGE_KEY = 'tidewise:v1';

export function emptyData(now: Date = new Date()): AppData {
  return {
    version: 1,
    createdAt: now.toISOString(),
    profile: null,
    days: {},
    urges: [],
    lapses: [],
    plans: [],
    contacts: [],
    thoughts: [],
    withdrawal: [],
    decisional: null,
    settings: defaultSettings(),
  };
}

export function defaultSettings(): Settings {
  return { theme: 'system', pinHash: null, pinSalt: null, prepDone: [] };
}

const isObj = (v: unknown): v is Record<string, any> => typeof v === 'object' && v !== null && !Array.isArray(v);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** Validate + normalise untrusted data (from storage or an imported backup). Throws on garbage. */
export function normalise(raw: unknown): AppData {
  if (!isObj(raw)) throw new Error('Backup is not a Tidewise data object');
  const src = isObj(raw.data) && raw.app === 'tidewise' ? raw.data : raw;
  if (!isObj(src) || src.version !== 1) throw new Error('Unsupported or missing data version');
  const base = emptyData();
  const days: AppData['days'] = {};
  if (isObj(src.days)) {
    for (const [k, v] of Object.entries(src.days)) {
      if (!isValidKey(k) || !isObj(v)) continue;
      const drinks = Number(v.drinks);
      days[k] = {
        ...v,
        date: k,
        drank: !!v.drank,
        drinks: Number.isFinite(drinks) && drinks >= 0 ? drinks : 0,
        updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : base.createdAt,
      };
    }
  }
  const profile = isObj(src.profile) ? (src.profile as AppData['profile']) : null;
  if (profile) {
    if (!isObj(profile.plan) || !isValidKey(profile.plan.quitDate) || !isValidKey(profile.plan.startedOn))
      throw new Error('Backup has an invalid plan');
    if (!isObj(profile.baseline)) throw new Error('Backup has an invalid baseline');
    profile.motives = arr(profile.motives);
    profile.reasons = arr(profile.reasons);
    profile.futureLetter = typeof profile.futureLetter === 'string' ? profile.futureLetter : '';
    profile.name = typeof profile.name === 'string' ? profile.name : '';
  }
  return {
    version: 1,
    createdAt: typeof src.createdAt === 'string' ? src.createdAt : base.createdAt,
    profile,
    days,
    urges: arr(src.urges),
    lapses: arr(src.lapses),
    plans: arr(src.plans),
    contacts: arr(src.contacts),
    thoughts: arr(src.thoughts),
    withdrawal: arr(src.withdrawal),
    decisional: isObj(src.decisional) ? (src.decisional as AppData['decisional']) : null,
    settings: { ...defaultSettings(), ...(isObj(src.settings) ? src.settings : {}) },
  };
}

export interface StorageLike {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
}

/** Returns localStorage if usable, otherwise an in-memory fallback (and persistent=false). */
export function getStorage(): { store: StorageLike; persistent: boolean } {
  try {
    const ls = window.localStorage;
    const probe = '__tidewise_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { store: ls, persistent: true };
  } catch {
    return { store: new MemoryStorage(), persistent: false };
  }
}

export function loadData(store: StorageLike): AppData {
  const raw = store.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    return normalise(JSON.parse(raw));
  } catch {
    // Keep the corrupt copy so nothing is silently destroyed.
    try {
      store.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, raw);
    } catch {
      /* ignore */
    }
    return emptyData();
  }
}

export function saveData(store: StorageLike, data: AppData): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function exportJson(data: AppData, now: Date = new Date()): string {
  return JSON.stringify({ app: 'tidewise', exportedAt: now.toISOString(), data }, null, 2);
}

export function importJson(text: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file isn’t valid JSON');
  }
  return normalise(parsed);
}

/* ------------------------------------------------------------------ */
/* IDs + PIN hashing                                                    */
/* ------------------------------------------------------------------ */

export function uid(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newSalt(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', enc);
  return toHex(digest);
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
