# Sensify — Play Store Screenshots

All Play Store graphic assets and how to (re)generate them.

## ✅ Ready to upload now
| Asset | File(s) | Size |
|-------|---------|------|
| App icon (listing) | `../store-icon-512.png` | 512 × 512 |
| Feature graphic | `../feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshot | `phone/home.png` | 1080 × 1920 |
| 7-inch tablet | `tablet7/home.png` | 1200 × 1920 |
| 10-inch tablet | `tablet10/home.png` | 1600 × 2560 |

These are real captures of the app's home screen, framed on-brand. Google Play
requires a **minimum of 2 phone screenshots**, so add at least one more (see below).

## 📸 Capturing the 5 game screens
The game screens use live device sensors (accelerometer, gyroscope, compass,
light, motion). They **only work on a real device or Android emulator** — not in
the web preview — so capture them there for the best-looking shots (moving ball,
rotating compass, live values):

1. Install the build on a device, or run an emulator:
   - `npx expo start` then press `a` (Android emulator / connected device), or
   - install the production `.aab`/`.apk` from EAS.
2. Open each game and take a screenshot:
   - Physical device: **Power + Volume-Down**.
   - Emulator: camera icon in the toolbar.
3. Save them into `store/screenshots/raw/` using these names so captions match:
   - `tilt.png`, `gyro.png`, `light.png`, `compass.png`, `shake.png`
   - (`home.png` is already there.)

## 🖼️ Framing them into store sizes
Once your raw screenshots are in `store/screenshots/raw/`, run:

```bash
python3 scripts/frame_screenshots.py
```

This regenerates **phone (1080×1920)**, **7-inch (1200×1920)** and
**10-inch (1600×2560)** versions for every raw screenshot, with the Sensify
gradient background, device mockup, and a caption. Captions are mapped per
filename in `scripts/frame_screenshots.py` (edit the `CAPTIONS` dict to taste).

## 🎨 Regenerating the icon + feature graphic
```bash
python3 scripts/generate_icons.py
```

## Play Console upload locations
- **Store listing → App icon** → `store-icon-512.png`
- **Store listing → Feature graphic** → `feature-graphic-1024x500.png`
- **Store listing → Phone screenshots** → everything in `phone/`
- **Store listing → 7-inch tablet** → everything in `tablet7/`
- **Store listing → 10-inch tablet** → everything in `tablet10/`

> Tip: phone screenshots are required; tablet screenshots are optional but
> recommended (and required if you mark the app as supporting tablets).
