# Sensify 🎮📱

**Five sensors. Five games.** Sensify turns your phone's hardware sensors into a
collection of fast, fully-offline mini-games. Tilt, rotate, shake, cover the
light sensor, and chase a compass heading — every game is powered by a real
device sensor.

- **Package:** `com.rajat.sensify`
- **Version:** 1.0.0
- **Platform:** Android & iOS (built with Expo)
- **Privacy:** 100% offline — no accounts, no network, no data collection.

## 🎯 Games

| Game | Sensor | How to play |
|------|--------|-------------|
| **Tilt Ball** | Accelerometer | Tilt your device to roll the glowing ball into targets before time runs out. |
| **Gyro Balance** | Gyroscope | Rotate left/right to keep the ball balanced on a shrinking beam. |
| **Light Control** | Light sensor | Cover or expose the ambient light sensor to keep brightness inside the target zone. |
| **Compass Hunt** | Magnetometer | Lay the phone flat and rotate it to match the target compass heading. |
| **Shake Detector** | Device motion | Shake the device to score and build up a shake streak. |

Each game has multiple difficulty levels and tracks your best score locally.

## 🛠️ Tech stack

- **[Expo](https://expo.dev) SDK 55** with the **New Architecture** and React Compiler
- **[Expo Router](https://docs.expo.dev/router/introduction)** for file-based, typed routing
- **[expo-sensors](https://docs.expo.dev/versions/latest/sdk/sensors/)** — Accelerometer, Gyroscope, Magnetometer, LightSensor, DeviceMotion
- **React Native 0.83** / **React 19**
- **TypeScript**

## 📁 Project structure

```
accelerometer-sensor/
├── app.json                 # Expo app config (name, icons, plugins, build props)
├── eas.json                 # EAS Build/Submit profiles
├── src/
│   ├── app/                 # Screens (file-based routes)
│   │   ├── index.tsx        # Home — game menu
│   │   ├── tilt-game.tsx
│   │   ├── gyroscope-game.tsx
│   │   ├── light-game.tsx
│   │   ├── compass-game.tsx
│   │   └── shake-detector.tsx
│   └── hooks/               # Sensor hooks (one per sensor)
│       ├── use-accelerometer.ts
│       ├── use-gyroscope.ts
│       ├── use-light.ts
│       ├── use-megnometer.ts
│       ├── use-devicemotion.ts
│       └── use-shake.ts
├── assets/images/           # App icon, adaptive icon, splash, favicon
├── scripts/                 # Icon + screenshot generation (PIL)
└── store/                   # Play Store listing, graphics & screenshots
```

## 🚀 Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

   Then open it on a **physical device** (Expo Go or a dev build) or an emulator.

> **Note:** the games rely on real hardware sensors, so they only run on a
> physical device or an emulator with sensor support — not in the web browser.

## 📦 Building for production (EAS)

Production builds are configured in [`eas.json`](eas.json).

```bash
# Android App Bundle (.aab) for Google Play
eas build --platform android --profile production
```

The production profile enables R8/ProGuard minification and resource shrinking
(via `expo-build-properties`) so the upload includes a deobfuscation mapping.

## 🏪 Publishing

All Google Play store assets and guidance live in the [`store/`](store/) folder:

- [`store/PLAY_STORE_LISTING.md`](store/PLAY_STORE_LISTING.md) — listing text, content rating & data-safety answers
- [`store/RELEASE_NOTES.md`](store/RELEASE_NOTES.md) — release notes
- [`store/privacy-policy.html`](store/privacy-policy.html) — hostable privacy policy
- [`store/store-icon-512.png`](store/store-icon-512.png) — 512×512 app icon
- [`store/feature-graphic-1024x500.png`](store/feature-graphic-1024x500.png) — feature graphic
- [`store/screenshots/`](store/screenshots/) — phone, 7" and 10" tablet screenshots ([workflow](store/screenshots/README.md))
- [`PUBLISHING.md`](PUBLISHING.md) — full publishing checklist

## 🎨 Regenerating assets

```bash
python3 scripts/generate_icons.py        # app icon, adaptive icon, splash, store graphics
python3 scripts/frame_screenshots.py     # frame raw screenshots into store sizes
```

## 📄 Privacy

See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for full privacy details. Sensify
collects no data and works entirely offline.
