import json, io, urllib.request, concurrent.futures as cf, os, math, glob
from PIL import Image, ImageDraw, ImageFont

items = json.load(open("photo-check/list.json"))
for f in glob.glob("photo-check/out/*"):
    os.remove(f)
os.makedirs("photo-check/out", exist_ok=True)
TW, TH, COLS, ROWS = 480, 330, 4, 3


def font(sz):
    f = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    return ImageFont.truetype(f, sz) if os.path.exists(f) else ImageFont.load_default()


F = font(22)


def get(it):
    url = f"https://images.unsplash.com/{it['id']}?w={TW}&h={TH}&fit=crop&q=60&fm=jpg"
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=30)
        return it, r.status, Image.open(io.BytesIO(r.read())).convert("RGB")
    except Exception as e:
        return it, getattr(e, "code", str(e)), None


with cf.ThreadPoolExecutor(16) as ex:
    res = list(ex.map(get, items))

json.dump([{"label": it["label"], "id": it["id"], "status": st} for it, st, _ in res],
          open("photo-check/out/status.json", "w"), indent=1)

per = COLS * ROWS
for s in range(math.ceil(len(res) / per)):
    chunk = res[s * per:(s + 1) * per]
    sheet = Image.new("RGB", (COLS * TW, ROWS * (TH + 34)), (20, 20, 20))
    d = ImageDraw.Draw(sheet)
    for k, (it, st, im) in enumerate(chunk):
        x, y = (k % COLS) * TW, (k // COLS) * (TH + 34)
        if im:
            sheet.paste(im.resize((TW, TH)), (x, y + 34))
        else:
            d.text((x + 10, y + 120), f"FAILED {st}", fill=(255, 80, 80), font=F)
        d.text((x + 8, y + 5), it["label"], fill=(255, 230, 160), font=F)
    sheet.save(f"photo-check/out/sheet-{s + 1:02d}.jpg", quality=80)
print("done", len(res), sum(1 for _, _, im in res if im is None), "failed")
