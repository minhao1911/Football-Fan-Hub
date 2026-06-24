import { App, URLOpenListenerEvent } from "@capacitor/app";
import { isNative } from "./capacitor";

type DeepLinkHandler = (path: string, params: Record<string, string>) => void;

let deepLinkHandlers: DeepLinkHandler[] = [];

function parseDeepLink(url: string): { path: string; params: Record<string, string> } {
  try {
    const parsed = new URL(url);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return { path: parsed.pathname || "/", params };
  } catch {
    return { path: "/", params: {} };
  }
}

export function onDeepLink(cb: DeepLinkHandler) {
  deepLinkHandlers.push(cb);
  return () => {
    deepLinkHandlers = deepLinkHandlers.filter((h) => h !== cb);
  };
}

export function initDeepLinking() {
  if (!isNative) {
    return;
  }

  App.addListener("appUrlOpen", (event: URLOpenListenerEvent) => {
    const { path, params } = parseDeepLink(event.url);
    deepLinkHandlers.forEach((h) => h(path, params));
  });

  App.getLaunchUrl().then((result) => {
    if (result?.url) {
      const { path, params } = parseDeepLink(result.url);
      deepLinkHandlers.forEach((h) => h(path, params));
    }
  });
}

export const DEEP_LINK_SCHEME = "fanzone";
export const DEEP_LINK_HOST = "app.fanzone.com";

export function buildDeepLink(path: string, params?: Record<string, string>): string {
  const url = new URL(`${DEEP_LINK_SCHEME}://${DEEP_LINK_HOST}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

export function buildUniversalLink(path: string, params?: Record<string, string>): string {
  const url = new URL(`https://${DEEP_LINK_HOST}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}
