# Erzeugt App-Icons (180/192/512 + maskable): roter Gummistempel-Abdruck „B!“ auf Amtsgrün.
# Aufruf: python3 tools/make_icons.py
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WAND, PAPIER, ROT = (220, 227, 211), (246, 238, 220), (180, 35, 47)

def font(size):
    for p in ["/System/Library/Fonts/Supplemental/AmericanTypewriter.ttc", "/System/Library/Fonts/Supplemental/Courier New Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        try: return ImageFont.truetype(p, size, index=2) if p.endswith(".ttc") else ImageFont.truetype(p, size)
        except OSError: pass
    return ImageFont.load_default()

def icon(size, maskable=False):
    s = 4
    W = size * s
    img = Image.new("RGB", (W, W), WAND)
    pad = W * (0.18 if maskable else 0.1)
    # Akte (Papier)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([pad, pad * 1.1, W - pad, W - pad * 0.9], radius=W * 0.03, fill=PAPIER)
    # Stempelabdruck, gedreht
    st = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    inner = W - 2 * pad
    box = [W / 2 - inner * 0.36, W / 2 - inner * 0.26, W / 2 + inner * 0.36, W / 2 + inner * 0.26]
    sd.rounded_rectangle(box, radius=inner * 0.05, outline=ROT, width=int(inner * 0.05))
    sd.text((W / 2, W / 2 + inner * 0.02), "B!", font=font(int(inner * 0.36)), fill=ROT, anchor="mm")
    st = st.rotate(12, resample=Image.BICUBIC, center=(W / 2, W / 2))
    img.paste(st, (0, 0), st)
    return img.resize((size, size), Image.LANCZOS)

out = ROOT / "icons"
icon(180).save(out / "apple-touch-icon.png")
icon(192).save(out / "icon-192.png")
icon(512).save(out / "icon-512.png")
icon(512, maskable=True).save(out / "icon-512-maskable.png")
print("Icons geschrieben")
