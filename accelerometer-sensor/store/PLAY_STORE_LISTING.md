# Sensify — Google Play Store Listing

Copy-paste these values into the Google Play Console. Fields marked **TODO**
need a value only you can provide (email, hosted URL, etc.).

---

## App details
| Field | Value |
|-------|-------|
| App name | **Sensify** |
| Package name | `com.rajat.sensify` |
| Default language | English (United States) – `en-US` |
| App or game | **Game** |
| Category | **Arcade** (alt: Casual) |
| Free or paid | **Free** |
| Contact email | **TODO: your public support email** |
| Website (optional) | TODO (optional) |
| Privacy policy URL | **TODO: host PRIVACY_POLICY.md and paste the URL** |

---

## Short description (≤ 80 characters)
> Turn your phone's motion, light & compass sensors into fun mini-games.

*(72 characters)*

## Full description (≤ 4000 characters)
```
Sensify turns the hidden sensors inside your phone into a set of fun, fast
mini-games. No sign-up, no ads, no internet required — just pick a game and play.

🎮 TILT BALL GAME (Accelerometer)
Roll a glowing ball into targets by physically tilting your device.

⚖️ GYRO BALANCE (Gyroscope)
Keep the ball steady on a shrinking beam — the smallest movement counts.

💡 LIGHT CONTROL (Light Sensor)
Cover and uncover your phone's light sensor to keep brightness in the zone.

🧭 COMPASS HUNT (Magnetometer)
Lay your phone flat and rotate it to match the target compass heading.

📳 SHAKE DETECTOR (Device Motion)
Shake your device to trigger events and build up your shake streak.

WHY SENSIFY?
• Five different sensors, five different games
• 100% offline — works anywhere, anytime
• No accounts, no tracking, no ads
• Lightweight and instant to play
• A fun way to see what your phone's hardware can really do

Whether you're curious about how device sensors work or just want quick,
hands-on fun, Sensify makes your phone the controller.

Download Sensify and start playing with your sensors today!
```

---

## Store graphics (already generated, in `store/`)
| Asset | File | Size |
|-------|------|------|
| App icon (listing) | `store/store-icon-512.png` | 512 × 512 |
| Feature graphic | `store/feature-graphic-1024x500.png` | 1024 × 500 |
| Phone screenshots | **TODO: capture 2–8** | see below |

### How to capture screenshots
1. Run the app on a device/emulator: `npx expo start` (or install the build).
2. Open each game screen and take a screenshot:
   - Android device: Power + Volume-Down.
   - Emulator: camera icon in the toolbar.
3. Requirements: PNG or JPEG, 2–8 images, each side between 320px and 3840px,
   ratio between 16:9 and 9:16 (a normal portrait phone screenshot is fine).
4. Suggested shots: Home (SENSIFY) screen, Tilt Ball, Gyro Balance,
   Light Control, Compass Hunt.

---

## "Set up your app" — exact answers

### App access
- Choose: **All functionality is available without special access**
  (no login or restricted areas).

### Ads
- Does your app contain ads? → **No**

### Content rating (questionnaire)
- Category: **Game**
- Violence / sexual / drugs / gambling / profanity questions → **No** to all
- User-generated content / sharing → **No**
- Expected result: **Everyone / PEGI 3 / IARC Rated for ages 3+**

### Target audience and content
- Target age groups → choose the ranges you want (e.g. **13+**, or include
  younger). If you include children under 13, a privacy policy is mandatory
  (you already have one) and extra "designed for families" rules apply — for a
  simpler first launch, target **13 and older**.
- Is the app appealing to children? → No (unless you intend a kids app)

### Data safety
- Does your app collect or share any required user data? → **No**
  - Sensify reads accelerometer, gyroscope, magnetometer, light and motion
    sensors **on-device only**. Nothing is stored, transmitted, or shared.
- Data encrypted in transit → N/A (no data leaves the device)
- Users can request data deletion → N/A (no data collected)

### Government / Financial / Health declarations
- All → **No**

### News app
- Is this a news app? → **No**

---

## App signing
- Use **Play App Signing** (default). EAS generated your upload keystore;
  Google holds the app signing key. Nothing to upload manually.

---

## Release the build
1. The `.aab` comes from EAS:
   https://expo.dev/accounts/rajat17/projects/sensify/builds
   (download "Application archive") — or use `eas submit`.
2. Recommended first flow: **Testing → Internal testing → Create new release**,
   upload the `.aab`, add yourself as a tester, install via the opt-in link.
3. When happy: **Production → Create new release**, reuse the bundle, roll out.
4. New apps go through Google review (a few hours up to ~7 days).

> NOTE: The **first** upload for a brand-new app must be done **manually** in
> the Play Console. After that, `eas submit -p android` (with a Google service
> account key) can automate future uploads.
