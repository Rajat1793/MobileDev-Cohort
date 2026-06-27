"""
Frames raw app screenshots into Play Store-ready images at the exact sizes
Google Play expects, with on-brand Sensify styling (dark/orange gradient,
device mockup, caption).

Input:  store/screenshots/raw/*.png   (your real device/web screenshots)
Output: store/screenshots/phone/      1080 x 1920
        store/screenshots/tablet7/    1200 x 1920
        store/screenshots/tablet10/   1600 x 2560

Run:  python3 scripts/frame_screenshots.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "store", "screenshots", "raw")
BASE = os.path.join(ROOT, "store", "screenshots")

BG_DARK = (16, 10, 6)
BG_DARK2 = (30, 22, 17)
ACCENT = (255, 107, 43)
ACCENT_LIGHT = (255, 179, 71)
WHITE = (255, 255, 255)
DEVICE = (8, 5, 3)

# Output targets: (folder, width, height)
TARGETS = [
    ("phone", 1080, 1920),
    ("tablet7", 1200, 1920),
    ("tablet10", 1600, 2560),
]

# Optional caption per raw filename stem.
CAPTIONS = {
    "home": "Five sensors. Five games.",
    "tilt": "Tilt to roll the ball",
    "gyro": "Balance on the beam",
    "light": "Control it with light",
    "compass": "Hunt the heading",
    "shake": "Shake to score",
}


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def load_font(size):
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()


def gradient_bg(w, h):
    img = Image.new("RGB", (w, h), BG_DARK)
    px = img.load()
    cx, cy = w * 0.5, h * 0.22
    maxd = math.hypot(max(cx, w - cx), max(cy, h - cy))
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy) / maxd
            px[x, y] = lerp(BG_DARK2, BG_DARK, min(1.0, d ** 1.1))
    return img


def rounded_mask(size, radius):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    d.rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return m


def trim_right(img, tol=12):
    """Trim near-black columns on the right edge (browser clip artifact)."""
    g = img.convert("RGB")
    w, h = g.size
    px = g.load()
    cut = w
    for x in range(w - 1, max(0, w - 6), -1):
        col_dark = all(sum(px[x, y]) < tol * 3 for y in range(0, h, max(1, h // 40)))
        if col_dark:
            cut = x
        else:
            break
    return img.crop((0, 0, cut, h)) if cut < w else img


def frame_one(shot, w, h, caption):
    canvas = gradient_bg(w, h).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # caption
    if caption:
        f = load_font(int(w * 0.052))
        bb = draw.textbbox((0, 0), caption, font=f)
        tw = bb[2] - bb[0]
        ty = int(h * 0.06)
        draw.text(((w - tw) / 2, ty), caption, font=f, fill=WHITE)
        uw = int(tw * 0.4)
        ux = int((w - uw) / 2)
        uy = ty + (bb[3] - bb[1]) + int(h * 0.018)
        draw.rounded_rectangle([ux, uy, ux + uw, uy + max(5, int(h * 0.006))],
                               radius=4, fill=ACCENT)

    # device size: keep screenshot near native res (avoid heavy upscaling)
    src_w, src_h = shot.size
    screen_w = min(int(w * 0.52), int(src_w * 1.6))
    screen_h = int(screen_w * src_h / src_w)
    bezel = max(10, int(screen_w * 0.045))
    dev_w = screen_w + bezel * 2
    dev_h = screen_h + bezel * 2

    dx = (w - dev_w) // 2
    dy = int(h * 0.20)
    if dy + dev_h > h - int(h * 0.05):
        dy = h - int(h * 0.05) - dev_h

    # device body with soft shadow
    radius = int(dev_w * 0.10)
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle([dx, dy + 14, dx + dev_w, dy + dev_h + 14],
                         radius=radius, fill=(0, 0, 0, 150))
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    canvas = Image.alpha_composite(canvas, shadow)
    draw = ImageDraw.Draw(canvas)

    # accent ring + device
    draw.rounded_rectangle([dx - 2, dy - 2, dx + dev_w + 2, dy + dev_h + 2],
                           radius=radius + 2, outline=ACCENT + (90,), width=3)
    draw.rounded_rectangle([dx, dy, dx + dev_w, dy + dev_h],
                           radius=radius, fill=DEVICE + (255,))

    # screen
    screen = shot.convert("RGBA").resize((screen_w, screen_h), Image.LANCZOS)
    sr = int(radius * 0.7)
    screen.putalpha(rounded_mask((screen_w, screen_h), sr))
    canvas.alpha_composite(screen, (dx + bezel, dy + bezel))

    return canvas.convert("RGB")


def main():
    raws = sorted(f for f in os.listdir(RAW) if f.lower().endswith(".png")) \
        if os.path.isdir(RAW) else []
    if not raws:
        print(f"No raw screenshots in {RAW}")
        return

    for folder, w, h in TARGETS:
        out = os.path.join(BASE, folder)
        os.makedirs(out, exist_ok=True)

    for fn in raws:
        stem = os.path.splitext(fn)[0]
        caption = CAPTIONS.get(stem.lower().lstrip("0123456789-_"), "Sensify")
        shot = trim_right(Image.open(os.path.join(RAW, fn)))
        # shave a thin safety margin off the right edge (web render artifact)
        sw, sh = shot.size
        shot = shot.crop((0, 0, sw - max(6, int(sw * 0.02)), sh))
        for folder, w, h in TARGETS:
            framed = frame_one(shot, w, h, caption)
            path = os.path.join(BASE, folder, fn)
            framed.save(path)
            print(f"wrote {folder}/{fn}  ({w}x{h})")

    print("\nDone. Add more device screenshots to store/screenshots/raw/ "
          "and re-run to frame them.")


if __name__ == "__main__":
    main()
