#!/usr/bin/env node
/**
 * FanZone Icon Generator
 * Generates PNG icons for Android and iOS from SVG source.
 *
 * Usage: node scripts/generate-icons.mjs
 * Requires: sharp  (pnpm add -D sharp)
 */

import { createRequire } from "module";
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" rx="0" fill="#111827"/>
  <circle cx="512" cy="512" r="380" fill="none" stroke="#16a34a" stroke-width="40"/>
  <path d="M512 180 L562 340 L720 340 L596 432 L646 592 L512 500 L378 592 L428 432 L304 340 L462 340 Z" fill="#16a34a"/>
  <circle cx="512" cy="512" r="50" fill="#22c55e"/>
</svg>`;

const SPLASH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2732 2732">
  <rect width="2732" height="2732" fill="#030712"/>
  <circle cx="1366" cy="1266" r="500" fill="#16a34a" opacity="0.12"/>
  <circle cx="1366" cy="1266" r="400" fill="none" stroke="#16a34a" stroke-width="48"/>
  <path d="M1366 866 L1426 1046 L1606 1046 L1466 1156 L1526 1336 L1366 1226 L1206 1336 L1266 1156 L1126 1046 L1306 1046 Z" fill="#16a34a"/>
  <text x="1366" y="1850" font-family="Arial,sans-serif" font-size="180" font-weight="800" fill="#ffffff" text-anchor="middle">
    <tspan fill="#22c55e">Fan</tspan>Zone
  </text>
</svg>`;

const ANDROID_SIZES = [
  { dir: "mipmap-mdpi",    size: 48,  round: 48  },
  { dir: "mipmap-hdpi",    size: 72,  round: 72  },
  { dir: "mipmap-xhdpi",   size: 96,  round: 96  },
  { dir: "mipmap-xxhdpi",  size: 144, round: 144 },
  { dir: "mipmap-xxxhdpi", size: 192, round: 192 },
];

const IOS_SIZES = [
  { name: "Icon-20",     size: 20  },
  { name: "Icon-20@2x",  size: 40  },
  { name: "Icon-20@3x",  size: 60  },
  { name: "Icon-29",     size: 29  },
  { name: "Icon-29@2x",  size: 58  },
  { name: "Icon-29@3x",  size: 87  },
  { name: "Icon-40",     size: 40  },
  { name: "Icon-40@2x",  size: 80  },
  { name: "Icon-40@3x",  size: 120 },
  { name: "Icon-60@2x",  size: 120 },
  { name: "Icon-60@3x",  size: 180 },
  { name: "Icon-76",     size: 76  },
  { name: "Icon-76@2x",  size: 152 },
  { name: "Icon-83.5@2x",size: 167 },
  { name: "Icon-1024",   size: 1024},
];

async function main() {
  let sharp;
  try {
    const req = createRequire(import.meta.url);
    sharp = req("sharp");
  } catch {
    console.error("❌  sharp not found. Run: pnpm add -D sharp");
    process.exit(1);
  }

  const iconBuf = Buffer.from(ICON_SVG);
  const splashBuf = Buffer.from(SPLASH_SVG);

  // Android icons
  for (const { dir, size, round } of ANDROID_SIZES) {
    const outDir = path.join(root, "android/app/src/main/res", dir);
    mkdirSync(outDir, { recursive: true });

    await sharp(iconBuf)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, "ic_launcher.png"));

    await sharp(iconBuf)
      .resize(round, round)
      .png()
      .toFile(path.join(outDir, "ic_launcher_round.png"));

    await sharp(iconBuf)
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, "ic_launcher_foreground.png"));

    console.log(`✔ Android ${dir} (${size}px)`);
  }

  // Android splash
  const splashDir = path.join(root, "android/app/src/main/res/drawable");
  mkdirSync(splashDir, { recursive: true });
  await sharp(splashBuf).resize(1080, 1920).png().toFile(path.join(splashDir, "splash.png"));
  console.log("✔ Android splash");

  // iOS icons
  const iosIconDir = path.join(root, "ios/App/App/Assets.xcassets/AppIcon.appiconset");
  mkdirSync(iosIconDir, { recursive: true });

  const contentsEntries = [];
  for (const { name, size } of IOS_SIZES) {
    await sharp(iconBuf)
      .resize(size, size)
      .png()
      .toFile(path.join(iosIconDir, `${name}.png`));
    contentsEntries.push({
      filename: `${name}.png`,
      idiom: size >= 76 ? "ipad" : "iphone",
      scale: name.includes("@3x") ? "3x" : name.includes("@2x") ? "2x" : "1x",
      size: `${size}x${size}`,
    });
    console.log(`✔ iOS ${name} (${size}px)`);
  }

  // iOS splash
  const iosSplashDir = path.join(root, "ios/App/App/Assets.xcassets/Splash.imageset");
  mkdirSync(iosSplashDir, { recursive: true });
  await sharp(splashBuf).resize(2732, 2732).png().toFile(path.join(iosSplashDir, "splash.png"));
  writeFileSync(path.join(iosSplashDir, "Contents.json"), JSON.stringify({
    images: [{ filename: "splash.png", idiom: "universal", scale: "1x" }],
    info: { author: "xcode", version: 1 },
  }, null, 2));
  console.log("✔ iOS splash");

  console.log("\n✅ Icons generated successfully!");
  console.log("Next: run `pnpm cap:sync` to push assets to native projects.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
