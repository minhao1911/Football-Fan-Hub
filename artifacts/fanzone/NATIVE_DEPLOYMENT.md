# FanZone Native App Deployment Guide

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 22 | Build tooling |
| pnpm | ≥ 9 | Package manager |
| Android Studio | Latest | Android builds |
| Xcode | 15+ | iOS builds (macOS only) |
| JDK | 17+ | Android builds |

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Build web assets for native
cd artifacts/fanzone
pnpm build:native

# 3. Sync to native projects
npx cap sync

# 4. (Optional) Generate PNG icons
node scripts/generate-icons.mjs
```

---

## Android — Play Store

### First-time setup
```bash
cd artifacts/fanzone

# Open in Android Studio
pnpm cap:open:android
```

In Android Studio:
1. **Sync Gradle** (File → Sync Project with Gradle Files)
2. Set `applicationId` to `com.fanzone.app` in `android/app/build.gradle`
3. Set signing config (Build → Generate Signed Bundle/APK)

### Push Notifications
1. Create a Firebase project at https://console.firebase.google.com
2. Add Android app with package `com.fanzone.app`
3. Download `google-services.json` → place in `android/app/`
4. Add to `android/app/build.gradle`:
   ```groovy
   apply plugin: 'com.google.gms.google-services'
   ```
5. Add to `android/build.gradle`:
   ```groovy
   classpath 'com.google.gms:google-services:4.4.1'
   ```

### App Links (Deep Linking)
1. Host `public/.well-known/assetlinks.json` on your production domain
2. Replace `REPLACE_WITH_YOUR_APP_SIGNING_KEY_SHA256_FINGERPRINT` with your actual keystore SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore your-keystore.jks -alias your-alias
   ```

### Build for Play Store
```bash
# In Android Studio: Build → Generate Signed Bundle → Android App Bundle
# Upload the .aab file to Play Console
```

---

## iOS — App Store

### Prerequisites
- macOS with Xcode 15+
- Apple Developer account ($99/year)
- App registered at https://developer.apple.com

### First-time setup
```bash
cd artifacts/fanzone

# Open in Xcode (macOS only)
pnpm cap:open:ios
```

In Xcode:
1. Select the `App` target
2. Set Bundle Identifier to `com.fanzone.app`
3. Set Team to your Apple Developer team
4. Enable **Push Notifications** capability
5. Enable **Associated Domains** capability: `applinks:app.fanzone.com`
6. Enable **Background Modes** → Remote notifications

### Push Notifications
1. In Apple Developer Portal → Certificates → Keys → Create APN key
2. Download the `.p8` file
3. Configure in your backend or Firebase to send APNs

### Universal Links (Deep Linking)
1. Host `public/.well-known/apple-app-site-association` on your production domain (no extension, `Content-Type: application/json`)
2. Replace `YOURTEAMID` with your Apple Team ID (found in developer.apple.com → Membership)

### Build for App Store
```bash
# In Xcode: Product → Archive → Distribute App → App Store Connect
```

---

## Day-to-Day Development Workflow

```bash
# Edit React source in artifacts/fanzone/src/
# Then rebuild & sync:
cd artifacts/fanzone
pnpm cap:sync          # build + sync to both platforms
pnpm cap:run:android   # run on connected Android device/emulator
pnpm cap:run:ios       # run on connected iOS device/simulator
```

---

## Capacitor Plugins Installed

| Plugin | Feature |
|--------|---------|
| `@capacitor/push-notifications` | FCM/APNs push notifications |
| `@capacitor/app` | Deep linking, app lifecycle |
| `@capacitor/splash-screen` | Native splash screen |
| `@capacitor/status-bar` | Status bar color/style |
| `@capacitor/keyboard` | Keyboard resize behavior |
| `@capacitor/preferences` | Secure key-value storage |
| `@capacitor/network` | Online/offline detection |
| `@capacitor/haptics` | Haptic feedback |

---

## Environment Variables for Native Build

When building with `pnpm build:native`, set these in your CI/CD:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

> `VITE_CLERK_PROXY_URL` is NOT needed for native — Clerk runs directly in the native WebView.

---

## App IDs Summary

| Platform | Identifier |
|----------|-----------|
| Android Package | `com.fanzone.app` |
| iOS Bundle ID | `com.fanzone.app` |
| Deep Link Scheme | `fanzone://` |
| Universal Link Host | `app.fanzone.com` |
