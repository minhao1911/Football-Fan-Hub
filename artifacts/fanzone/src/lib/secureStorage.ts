import { Preferences } from "@capacitor/preferences";
import { isNative } from "./capacitor";

const PREFIX = "fanzone_";

function prefixedKey(key: string): string {
  return `${PREFIX}${key}`;
}

export async function secureSet(key: string, value: string): Promise<void> {
  const pk = prefixedKey(key);
  if (isNative) {
    await Preferences.set({ key: pk, value });
  } else {
    try {
      sessionStorage.setItem(pk, value);
    } catch {
      localStorage.setItem(pk, value);
    }
  }
}

export async function secureGet(key: string): Promise<string | null> {
  const pk = prefixedKey(key);
  if (isNative) {
    const { value } = await Preferences.get({ key: pk });
    return value;
  } else {
    return sessionStorage.getItem(pk) ?? localStorage.getItem(pk);
  }
}

export async function secureRemove(key: string): Promise<void> {
  const pk = prefixedKey(key);
  if (isNative) {
    await Preferences.remove({ key: pk });
  } else {
    sessionStorage.removeItem(pk);
    localStorage.removeItem(pk);
  }
}

export async function secureClear(): Promise<void> {
  if (isNative) {
    const { keys } = await Preferences.keys();
    await Promise.all(
      keys
        .filter((k) => k.startsWith(PREFIX))
        .map((k) => Preferences.remove({ key: k })),
    );
  } else {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) keysToRemove.push(k);
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  }
}

export async function secureKeys(): Promise<string[]> {
  if (isNative) {
    const { keys } = await Preferences.keys();
    return keys
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length));
  } else {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) result.push(k.slice(PREFIX.length));
    }
    return result;
  }
}
