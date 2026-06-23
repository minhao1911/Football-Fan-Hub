---
name: Mobile-first PWA layout
description: FanZone mobile conversion architecture — nav split, safe areas, service worker, PWA manifest
---

## Layout Architecture
- `TopBar.tsx` — sticky top header: logo + XP counter + NotificationBell + InstallPrompt icon
- `BottomNav.tsx` — fixed bottom nav: Matches / Feed / Groups / Board / Profile / (Admin if isAdmin)
- `NavBar.tsx` — OLD file, no longer imported, can be deleted
- `App.tsx` — `<main>` has `pb-[calc(4rem+var(--sab,0px))]` so content clears the bottom nav

## Safe Area Insets
CSS vars defined in `index.html` `<style>`:
```css
--sat: env(safe-area-inset-top, 0px);
--sab: env(safe-area-inset-bottom, 0px);
```
TopBar uses `paddingTop: "var(--sat, 0px)"`, BottomNav uses `paddingBottom: "var(--sab, 0px)"`.

## PWA Assets (all in `artifacts/fanzone/public/`)
- `manifest.json` — full PWA manifest with shortcuts, icons, categories
- `sw.js` — service worker: cache-first for static, network-first for navigation, skip API calls
- `icons/icon-{72,96,128,144,152,192,384,512}.svg` — SVG icons (all sizes)
- SW registered inline in `index.html` via `<script>` tag (not via vite plugin)

## InstallPrompt
`InstallPrompt.tsx` — listens for `beforeinstallprompt`, shows install button in TopBar + bottom banner after 3s. Banner dismissed state saved to `localStorage("pwa-dismissed")`.

**Why:** Vite PWA plugin not installed; manual SW registration is simpler and avoids build complexity.
