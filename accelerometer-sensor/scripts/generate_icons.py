"""
Generates the Sensify branded icon / splash asset set.

Design: a "sensor radar" motif — a glowing central node with concentric
sweeping arc waves, in the app's orange accent gradient on a deep dark
background. Matches the in-app theme (#100A06 bg, #FF6B2B accent).

Run:  python3 scripts/generate_icons.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "assets", "images")
STORE = os.path.join(ROOT, "store")

# Brand palette
BG_DARK = (16, 10, 6)      # #100A06
BG_DARK2 = (28, 20, 16)    # #1C1410
ACCENT = (255, 107, 43)    # #FF6B2B
ACCENT_LIGHT = (255, 179, 71)  # #FFB347
WHITE = (255, 255, 255)

SS = 4  # supersample factor for crisp anti-aliased output


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(len(a)))


def radial_background(size, inner, outer):
    """Vertical-ish radial gradient background."""
    img = Image.new("RGB", (size, size), outer)
    px = img.load()
    cx = cy = size / 2
    maxd = math.hypot(cx, cy)
    for y in range(size):
        for x in range(size):
            d = math.hypot(x - cx, y - cy) / maxd
            d = min(1.0, d)
            px[x, y] = lerp(inner, outer, d ** 1.15)
    return img


def draw_sensor_mark(size, color_inner, color_outer, glow=True, bg=None,
                     dot_only_scale=1.0):
    """Draw the radar/sensor mark on a transparent (or given bg) canvas.

    Returns an RGBA image of dimension `size`.
    """
    S = size * SS
    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    cx = cy = S / 2
    base = S * 0.40 * dot_only_scale  # overall mark radius

    # central glowing node
    dot_r = base * 0.16
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=color_inner + (255,),
    )

    # concentric sweeping arc waves (gap rotates -> motion feel)
    rings = [
        (base * 0.42, 0.55, 300, 30),
        (base * 0.66, 0.72, 300, 130),
        (base * 0.92, 1.0, 300, 230),
    ]
    for r, tcol, span, start in rings:
        col = lerp(color_inner, color_outer, tcol)
        width = max(2, int(base * 0.085))
        bbox = [cx - r, cy - r, cx + r, cy + r]
        draw.arc(bbox, start, start + span, fill=col + (255,), width=width)

    if glow:
        glow_layer = canvas.filter(ImageFilter.GaussianBlur(radius=S * 0.012))
        out = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        out = Image.alpha_composite(out, glow_layer)
        out = Image.alpha_composite(out, canvas)
        canvas = out

    canvas = canvas.resize((size, size), Image.LANCZOS)

    if bg is not None:
        base_img = bg.convert("RGBA")
        base_img = Image.alpha_composite(base_img, canvas)
        return base_img
    return canvas


def rounded_full_icon(size):
    """Full-bleed app icon: gradient bg + sensor mark."""
    bg = radial_background(size, BG_DARK2, BG_DARK)
    img = draw_sensor_mark(size, ACCENT, ACCENT_LIGHT, glow=True, bg=bg)
    return img.convert("RGB")


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path)
    print(f"wrote {name}  ({img.size[0]}x{img.size[1]})")


def load_font(size):
    """Load a bold system font, falling back to PIL default."""
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Avenir Next.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    from PIL import ImageFont
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def save_store(img, name):
    os.makedirs(STORE, exist_ok=True)
    path = os.path.join(STORE, name)
    img.save(path)
    print(f"wrote store/{name}  ({img.size[0]}x{img.size[1]})")


def store_icon(size=512):
    """Opaque 512x512 Play Store listing icon (no transparency)."""
    bg = radial_background(size, BG_DARK2, BG_DARK)
    img = draw_sensor_mark(size, ACCENT, ACCENT_LIGHT, glow=True, bg=bg)
    return img.convert("RGB")


def feature_graphic(w=1024, h=500):
    """1024x500 Play Store feature graphic: mark + SENSIFY wordmark."""
    from PIL import ImageDraw
    # gradient background
    img = Image.new("RGB", (w, h), BG_DARK)
    px = img.load()
    for y in range(h):
        for x in range(w):
            d = (x / w) * 0.6 + (y / h) * 0.4
            px[x, y] = lerp(BG_DARK2, BG_DARK, min(1.0, d))
    img = img.convert("RGBA")

    # sensor mark on the left
    mark_size = int(h * 0.74)
    mark = draw_sensor_mark(mark_size, ACCENT, ACCENT_LIGHT, glow=True)
    mx = int(w * 0.05)
    my = (h - mark_size) // 2
    img.alpha_composite(mark, (mx, my))

    draw = ImageDraw.Draw(img)
    tx = mx + mark_size + int(w * 0.04)

    title_font = load_font(96)
    sub_font = load_font(33)

    title = "SENSIFY"
    sub = "Sensor-powered mini games"

    tb = draw.textbbox((0, 0), title, font=title_font)
    sb = draw.textbbox((0, 0), sub, font=sub_font)
    title_h = tb[3] - tb[1]
    gap = 28
    sub_h = sb[3] - sb[1]
    block_h = title_h + gap + sub_h
    ty = (h - block_h) // 2 - tb[1]

    draw.text((tx, ty), title, font=title_font, fill=WHITE)
    underline_y = ty + tb[3] + 14
    draw.rectangle([tx + 4, underline_y, tx + (tb[2] - tb[0]) * 0.55,
                    underline_y + 9], fill=ACCENT)
    draw.text((tx, ty + title_h + gap + 18), sub, font=sub_font,
              fill=(210, 190, 175))

    return img.convert("RGB")


def main():
    os.makedirs(OUT, exist_ok=True)

    # 1. Main app icon (full bleed, 1024)
    icon = rounded_full_icon(1024)
    save(icon, "icon.png")

    # 2. Favicon (web)
    save(icon.resize((196, 196), Image.LANCZOS), "favicon.png")

    # 3. Android adaptive FOREGROUND — mark only, transparent, safe zone.
    #    Adaptive icons crop ~33%, so keep mark within the inner ~66%.
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mark = draw_sensor_mark(1024, ACCENT, ACCENT_LIGHT, glow=True,
                            dot_only_scale=0.78)
    fg = Image.alpha_composite(fg, mark)
    save(fg, "android-icon-foreground.png")

    # 4. Android adaptive BACKGROUND — solid gradient fill.
    bg = radial_background(1024, BG_DARK2, BG_DARK).convert("RGBA")
    save(bg, "android-icon-background.png")

    # 5. Android MONOCHROME — white silhouette on transparent.
    mono = draw_sensor_mark(1024, WHITE, WHITE, glow=False,
                            dot_only_scale=0.78)
    save(mono, "android-icon-monochrome.png")

    # 6. Splash icon — mark on transparent (splash bg set via app.json).
    splash = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    smark = draw_sensor_mark(1024, ACCENT, ACCENT_LIGHT, glow=True,
                             dot_only_scale=0.95)
    splash = Image.alpha_composite(splash, smark)
    save(splash, "splash-icon.png")

    # --- Play Store listing assets ---
    save_store(store_icon(512), "store-icon-512.png")
    save_store(feature_graphic(1024, 500), "feature-graphic-1024x500.png")

    print("\nAll Sensify icon assets generated.")


if __name__ == "__main__":
    main()
