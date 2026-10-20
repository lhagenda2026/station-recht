# Erzeugt App-Icons (180/192/512 + maskable) mit PIL. Aufruf: python3 tools/make_icons.py
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BG, GRUEN, TEXT = (10, 22, 27), (82, 227, 143), (230, 240, 242)

def font(size):
    for p in ["/System/Library/Fonts/SFNS.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf"]:
        try: return ImageFont.truetype(p, size)
        except OSError: pass
    return ImageFont.load_default()

def icon(size, maskable=False):
    s = 4  # Supersampling
    W = size * s
    img = Image.new("RGB", (W, W), BG)
    d = ImageDraw.Draw(img)
    pad = W * (0.2 if maskable else 0.1)
    inner = W - 2 * pad
    # Paragraph-Zeichen oben
    f = font(int(inner * 0.46))
    d.text((W / 2, pad + inner * 0.30), "§", font=f, fill=TEXT, anchor="mm")
    # EKG-Linie unten
    y = pad + inner * 0.74
    a = inner * 0.20
    xs = [0, .28, .36, .42, .48, .53, .60, .68, 1]
    ys = [0, 0, -.15, .2, -1, .45, 0, 0, 0]
    pts = [(pad + x * inner, y + v * a) for x, v in zip(xs, ys)]
    d.line(pts, fill=GRUEN, width=int(W * 0.035), joint="curve")
    return img.resize((size, size), Image.LANCZOS)

out = ROOT / "icons"
out.mkdir(exist_ok=True)
icon(180).save(out / "apple-touch-icon.png")
icon(192).save(out / "icon-192.png")
icon(512).save(out / "icon-512.png")
icon(512, maskable=True).save(out / "icon-512-maskable.png")
print("Icons erzeugt:", sorted(p.name for p in out.iterdir()))
