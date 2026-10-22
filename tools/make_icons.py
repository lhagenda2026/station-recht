# Erzeugt App-Icons (180/192/512 + maskable) mit PIL: Akte mit rotem Stempel auf Amtsmint.
# Aufruf: python3 tools/make_icons.py
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WAND, MAPPE, MAPPE_TIEF, PAPIER, ROT, TINTE = (185, 201, 182), (227, 191, 98), (201, 162, 69), (251, 248, 239), (184, 35, 43), (72, 84, 76)

def font(size):
    for p in ["/System/Library/Fonts/Avenir Next Condensed.ttc", "/System/Library/Fonts/Supplemental/Futura.ttc", "/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(p, size, index=0)
        except OSError: pass
    return ImageFont.load_default()

def icon(size, maskable=False):
    s = 4
    W = size * s
    img = Image.new("RGB", (W, W), WAND)
    d = ImageDraw.Draw(img)
    pad = W * (0.2 if maskable else 0.12)
    inner = W - 2 * pad
    # Aktenmappe mit Reiter
    x0, y0, x1, y1 = pad, pad + inner * 0.12, pad + inner, pad + inner
    d.rounded_rectangle((x0, y0 - inner * 0.08, x0 + inner * 0.4, y0 + inner * 0.05), radius=W * 0.02, fill=MAPPE_TIEF)
    d.rounded_rectangle((x0, y0, x1, y1), radius=W * 0.03, fill=MAPPE)
    # Papier
    d.rectangle((x0 + inner * 0.08, y0 + inner * 0.08, x1 - inner * 0.08, y1 - inner * 0.06), fill=PAPIER)
    for i in range(4):
        y = y0 + inner * (0.2 + i * 0.12)
        d.line((x0 + inner * 0.16, y, x1 - inner * (0.2 + 0.12 * (i % 2)), y), fill=TINTE, width=int(W * 0.012))
    # Stempel (gedreht)
    st = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    cx, cy, bw, bh = W / 2, pad + inner * 0.68, inner * 0.62, inner * 0.3
    box = (cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2)
    sd.rounded_rectangle(box, radius=W * 0.02, outline=ROT + (235,), width=int(W * 0.025))
    sd.rounded_rectangle((box[0] + W * 0.03, box[1] + W * 0.03, box[2] - W * 0.03, box[3] - W * 0.03), radius=W * 0.01, outline=ROT + (235,), width=int(W * 0.01))
    sd.text((cx, cy + W * 0.005), "§ OK", font=font(int(bh * 0.62)), fill=ROT + (235,), anchor="mm")
    st = st.rotate(14, center=(cx, cy), resample=Image.BICUBIC)
    img.paste(st, (0, 0), st)
    return img.resize((size, size), Image.LANCZOS)

out = ROOT / "icons"
out.mkdir(exist_ok=True)
icon(180).save(out / "apple-touch-icon.png")
icon(192).save(out / "icon-192.png")
icon(512).save(out / "icon-512.png")
icon(512, maskable=True).save(out / "icon-512-maskable.png")
print("Icons erzeugt:", sorted(p.name for p in out.iterdir()))
