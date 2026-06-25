# Sensify — Publishing Checklist

A start-to-finish checklist for getting Sensify onto the Google Play Store.
Detailed copy/answers live in [store/PLAY_STORE_LISTING.md](store/PLAY_STORE_LISTING.md).

## ✅ Already done (in this repo)
- [x] App renamed to **Sensify**
- [x] Custom branded icon, splash, and adaptive icons (no more Expo logo)
- [x] `android.package` = `com.rajat.sensify`, `ios.bundleIdentifier` set
- [x] `eas.json` created (production = Android **app-bundle**)
- [x] Production EAS build started → produces the `.aab`
- [x] Store icon (512×512) — `store/store-icon-512.png`
- [x] Feature graphic (1024×500) — `store/feature-graphic-1024x500.png`
- [x] Store listing copy — `store/PLAY_STORE_LISTING.md`
- [x] Privacy policy — `PRIVACY_POLICY.md` + `store/privacy-policy.html`

## ☐ You need to do

### 1. Wait for the EAS build to finish
- Track: https://expo.dev/accounts/rajat17/projects/sensify/builds
- Download the **Application archive** (`.aab`) when it's "Finished".

### 2. Host the privacy policy (need a public URL)
Easiest free option — GitHub Pages:
1. Push this repo to GitHub.
2. Repo → Settings → Pages → deploy from `main` branch.
3. Your policy URL becomes:
   `https://<your-username>.github.io/<repo>/store/privacy-policy.html`
- First replace the **TODO email** in `store/privacy-policy.html`.

### 3. Create a Google Play Developer account
- https://play.google.com/console — pay the one-time **$25** fee.
- Complete identity verification (can take a few hours–days).

### 4. Create the app & fill the listing
- Use the exact values in `store/PLAY_STORE_LISTING.md`.
- Upload the 512 icon, feature graphic, and 2–8 screenshots.

### 5. Complete the "Set up your app" tasks
- App access: no restrictions · Ads: No · Data safety: No data collected
- Content rating questionnaire → Everyone
- Target audience: 13+ (simplest)
- Add the privacy policy URL.

### 6. Upload the `.aab` and release
- Start with **Internal testing**, install on your phone to verify.
- Then **Production → Create release** → roll out.
- New apps go through Google review (hours up to ~7 days).

## Useful commands
```bash
# check build status / list builds
eas build:list --platform android

# (after the FIRST manual upload) automate future uploads
eas submit --platform android --profile production

# regenerate all icons + store graphics
python3 scripts/generate_icons.py
```
