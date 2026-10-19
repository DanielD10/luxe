"""Search Unsplash for each destination, keep free photos whose caption or
description names the place, and lay the candidates out as contact sheets."""
import json, io, os, glob, urllib.request, urllib.parse, concurrent.futures as cf, re
from PIL import Image, ImageDraw, ImageFont

Q = json.load(open("photo-check/queries.json"))
OUT = "photo-check/cand"
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(f"{OUT}/*"):
    os.remove(f)

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36", "Accept": "application/json"}
TW, TH, COLS, ROWS = 480, 330, 4, 3
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = ImageFont.truetype(FONT, 22) if os.path.exists(FONT) else ImageFont.load_default()
log = []


def search(q, page):
    url = "https://unsplash.com/napi/search/photos?" + urllib.parse.urlencode({"query": q, "per_page": 30, "page": page})
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30)
        return json.loads(r.read())["results"]
    except Exception as e:
        log.append(f"search {q!r} p{page}: {e}")
        return []


def img(pid):
    url = f"https://images.unsplash.com/{pid}?w={TW}&h={TH}&fit=crop&q=60&fm=jpg"
    try:
        return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30).read())).convert("RGB")
    except Exception as e:
        log.append(f"img {pid}: {e}")
        return None


allc = {}
for d in Q:
    seen, cands = set(), []
    for q in d["q"]:
        for page in (1, 2):
            for r in search(q, page):
                if r.get("premium") or r.get("plus") or r["id"] in seen:
                    continue
                seen.add(r["id"])
                m = re.search(r"/(photo-[0-9]+-[0-9a-f]+)", r["urls"]["raw"])
                if not m:
                    continue
                loc = r.get("location") or {}
                text = " ".join(str(x) for x in [r.get("description"), r.get("alt_description"), r.get("slug"),
                                                  loc.get("title"), loc.get("name"), loc.get("city"), loc.get("country")] if x).lower()
                hits = [t for t in d["must"] if t in text]
                if not hits:
                    continue
                cands.append({"id": m.group(1), "slug": r.get("slug"), "by": r["user"]["name"],
                              "desc": r.get("description"), "alt": r.get("alt_description"), "hits": hits,
                              "w": r.get("width"), "h": r.get("height"), "likes": r.get("likes")})
    cands = cands[:24]
    allc[d["key"]] = cands
    with cf.ThreadPoolExecutor(12) as ex:
        ims = list(ex.map(lambda c: img(c["id"]), cands))
    per = COLS * ROWS
    for s in range(0, len(cands), per):
        sheet = Image.new("RGB", (COLS * TW, ROWS * (TH + 34)), (20, 20, 20))
        dr = ImageDraw.Draw(sheet)
        for k, (c, im) in enumerate(zip(cands[s:s + per], ims[s:s + per])):
            x, y = (k % COLS) * TW, (k // COLS) * (TH + 34)
            if im:
                sheet.paste(im.resize((TW, TH)), (x, y + 34))
            dr.text((x + 8, y + 5), f"{d['key']} c{s + k + 1}", fill=(255, 230, 160), font=F)
        sheet.save(f"{OUT}/{d['key']}-{s // per + 1}.jpg", quality=80)

json.dump(allc, open(f"{OUT}/candidates.json", "w"), indent=1, ensure_ascii=False)
open(f"{OUT}/log.txt", "w").write("\n".join(log) + "\n")
print({k: len(v) for k, v in allc.items()})
