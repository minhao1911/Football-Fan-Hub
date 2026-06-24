---
name: Capacitor native setup
description: How Capacitor is integrated into the FanZone monorepo for Android/iOS deployment.
---

## Rule
FanZone uses Capacitor 8 to wrap the React+Vite web app as a native Android and iOS app.

## Key facts
- Capacitor CLI requires Node.js >= 22. The project was upgraded from Node 20 to Node 22.
- Native projects live at `artifacts/fanzone/android/` and `artifacts/fanzone/ios/`.
- App IDs: `com.fanzone.app` (both platforms).
- Deep link scheme: `fanzone://app.fanzone.com/...`
- `vite.native.config.ts` is used for native builds — no PORT env var required, base="./", includes `optimizeDeps.include` for `@tanstack/react-query` to fix monorepo resolution.
- Regular web build (`vite.config.ts`) still requires PORT and BASE_PATH env vars.
- Workflow dev command: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/fanzone run dev`

## Native build & sync workflow
```bash
cd artifacts/fanzone
pnpm build:native      # Vite build with base="./"
npx cap sync           # copies dist/public to android + ios
npx cap open android   # opens Android Studio
npx cap open ios       # opens Xcode (macOS only)
```

## Plugins installed
@capacitor/push-notifications, @capacitor/app, @capacitor/splash-screen,
@capacitor/status-bar, @capacitor/keyboard, @capacitor/preferences,
@capacitor/network, @capacitor/haptics

## Source files added
- `src/lib/capacitor.ts` — platform detection, init, status bar, keyboard, network
- `src/lib/pushNotifications.ts` — FCM/APNs token registration, foreground/tap handlers
- `src/lib/deepLinking.ts` — custom scheme + universal link parsing, listener pattern
- `src/lib/secureStorage.ts` — Capacitor Preferences wrapper with localStorage fallback
- `src/lib/offlineCache.ts` — LRU cache over Preferences/localStorage (50 entries, 24h TTL)
- `src/hooks/useCapacitor.ts` — React hooks: usePlatform, useNetwork, useAppState, useDeepLink, etc.
- `src/components/NativeInit.tsx` — boots Capacitor, push, deep links on app start
- `src/components/OfflineBanner.tsx` — red banner when network is offline
- `capacitor.config.ts` — root Capacitor config
- `vite.native.config.ts` — Vite config for native builds
- `scripts/generate-icons.mjs` — PNG icon generator using sharp
- `NATIVE_DEPLOYMENT.md` — full deployment guide

## Why
Capacitor was chosen over React Native because it wraps the existing React codebase unchanged,
allowing web + native to share 100% of the UI/logic code.
