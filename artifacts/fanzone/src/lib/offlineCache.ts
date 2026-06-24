import { Preferences } from "@capacitor/preferences";
import { isNative } from "./capacitor";

const CACHE_PREFIX = "fanzone_cache_";
const CACHE_META_KEY = "fanzone_cache_meta";
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 50;

type CacheMeta = {
  keys: string[];
  timestamps: Record<string, number>;
};

async function getMeta(): Promise<CacheMeta> {
  if (isNative) {
    const { value } = await Preferences.get({ key: CACHE_META_KEY });
    if (value) return JSON.parse(value);
  } else {
    const v = localStorage.getItem(CACHE_META_KEY);
    if (v) return JSON.parse(v);
  }
  return { keys: [], timestamps: {} };
}

async function saveMeta(meta: CacheMeta): Promise<void> {
  const str = JSON.stringify(meta);
  if (isNative) {
    await Preferences.set({ key: CACHE_META_KEY, value: str });
  } else {
    localStorage.setItem(CACHE_META_KEY, str);
  }
}

export async function cacheSet<T>(key: string, data: T): Promise<void> {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const str = JSON.stringify(data);
  const meta = await getMeta();

  if (!meta.keys.includes(key)) {
    meta.keys.push(key);
  }
  meta.timestamps[key] = Date.now();

  if (meta.keys.length > MAX_CACHE_ENTRIES) {
    const oldest = [...meta.keys].sort(
      (a, b) => (meta.timestamps[a] ?? 0) - (meta.timestamps[b] ?? 0),
    );
    const toRemove = oldest.slice(0, meta.keys.length - MAX_CACHE_ENTRIES);
    for (const k of toRemove) {
      const fk = `${CACHE_PREFIX}${k}`;
      if (isNative) {
        await Preferences.remove({ key: fk });
      } else {
        localStorage.removeItem(fk);
      }
      meta.keys = meta.keys.filter((mk) => mk !== k);
      delete meta.timestamps[k];
    }
  }

  if (isNative) {
    await Preferences.set({ key: fullKey, value: str });
  } else {
    try {
      localStorage.setItem(fullKey, str);
    } catch {
    }
  }

  await saveMeta(meta);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const meta = await getMeta();
  const ts = meta.timestamps[key];
  if (!ts || Date.now() - ts > MAX_CACHE_AGE_MS) {
    return null;
  }

  const fullKey = `${CACHE_PREFIX}${key}`;
  let str: string | null = null;

  if (isNative) {
    const { value } = await Preferences.get({ key: fullKey });
    str = value;
  } else {
    str = localStorage.getItem(fullKey);
  }

  if (!str) return null;
  try {
    return JSON.parse(str) as T;
  } catch {
    return null;
  }
}

export async function cacheInvalidate(key: string): Promise<void> {
  const fullKey = `${CACHE_PREFIX}${key}`;
  const meta = await getMeta();
  meta.keys = meta.keys.filter((k) => k !== key);
  delete meta.timestamps[key];

  if (isNative) {
    await Preferences.remove({ key: fullKey });
  } else {
    localStorage.removeItem(fullKey);
  }
  await saveMeta(meta);
}

export async function cacheClearAll(): Promise<void> {
  const meta = await getMeta();
  for (const key of meta.keys) {
    const fullKey = `${CACHE_PREFIX}${key}`;
    if (isNative) {
      await Preferences.remove({ key: fullKey });
    } else {
      localStorage.removeItem(fullKey);
    }
  }
  await saveMeta({ keys: [], timestamps: {} });
}
