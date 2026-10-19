"""Search Unsplash in a real browser for each destination, open every free
result's photo page, and keep the ones whose location, title or description
names the place. Lays the keepers out as labeled contact sheets."""
import asyncio, json, io, os, glob, re, urllib.request
from PIL import Image, ImageDraw, ImageFont
from playwright.async_api import async_playwright

Q = json.load(open("photo-check/queries.json"))
OUT = "photo-check/cand"
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(f"{OUT}/*"):
    os.remove(f)
TW, TH, COLS, ROWS = 480, 330, 4, 3
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
F = ImageFont.truetype(FONT, 22) if os.path.exists(FONT) else ImageFont.load_default()
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
PER_DEST = int(os.environ.get("PER_DEST", "28"))
log = []

SEARCH_JS = """() => {
  const out = [];
  for (const a of document.querySelectorAll('a[href^="/photos/"]')) {
    const img = a.querySelector('img[src*="images.unsplash.com/photo-"]');
    if (!img) continue;
    const m = img.src.match(/(photo-[0-9]+-[0-9a-f]+)/);
    if (!m) continue;
    out.push({ href: a.getAttribute('href'), id: m[1], alt: img.alt || '' });
  }
  return out;
}"""

PAGE_JS = """() => {
  const meta = (s) => (document.querySelector(s) || {}).content || '';
  const h1 = (document.querySelector('h1') || {}).textContent || '';
  const loc = [...document.querySelectorAll('a[href*="/s/photos/"]')].map(a => a.textContent.trim()).filter(Boolean).slice(0, 12);
  return { desc: meta('meta[name="description"]'), title: meta('meta[property="og:title"]'), h1, links: loc,
           premium: !!document.querySelector('img[src*="plus.unsplash.com"]') && !document.querySelector('img[src*="images.unsplash.com/photo-"]') };
}"""


def img(pid):
    url = f"https://images.unsplash.com/{pid}?w={TW}&h={TH}&fit=crop&q=60&fm=jpg"
    try:
        return Image.open(io.BytesIO(urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=30).read())).convert("RGB")
    except Exception as e:
        log.append(f"img {pid}: {e}")
        return None


async def main():
    allc = {}
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(user_agent=UA, viewport={"width": 1400, "height": 1000}, locale="en-US")
        sem = asyncio.Semaphore(6)

        async def details(c):
            async with sem:
                pg = await ctx.new_page()
                try:
                    await pg.goto("https://unsplash.com" + c["href"], wait_until="domcontentloaded", timeout=45000)
                    await pg.wait_for_timeout(800)
                    c.update(await pg.evaluate(PAGE_JS))
                except Exception as e:
                    log.append(f"page {c['href']}: {e}")
                finally:
                    await pg.close()
            return c

        for d in Q:
            seen, found = set(), []
            for q in d["q"]:
                pg = await ctx.new_page()
                try:
                    await pg.goto("https://unsplash.com/s/photos/" + q.replace(" ", "-") + "?license=free",
                                  wait_until="domcontentloaded", timeout=45000)
                    for _ in range(3):
                        await pg.mouse.wheel(0, 2500)
                        await pg.wait_for_timeout(700)
                    for r in await pg.evaluate(SEARCH_JS):
                        if r["id"] not in seen:
                            seen.add(r["id"])
                            found.append(r)
                except Exception as e:
                    log.append(f"search {q}: {e}")
                finally:
                    await pg.close()
            log.append(f"{d['key']}: {len(found)} search results")
            found = found[:PER_DEST * 2]
            found = await asyncio.gather(*(details(c) for c in found))
            keep = []
            for c in found:
                text = " ".join([c.get("desc", ""), c.get("title", ""), c.get("h1", ""), c["href"], c.get("alt", "")]).lower()
                hits = [t for t in d["must"] if t in text]
                if hits and not c.get("premium"):
                    m = re.search(r"by (.+?) \(@", c.get("desc", ""))
                    c["by"] = m.group(1) if m else ""
                    c["slug"] = c["href"].split("/photos/")[1]
                    c["hits"] = hits
                    keep.append(c)
            keep = keep[:PER_DEST]
            allc[d["key"]] = keep
            ims = await asyncio.gather(*(asyncio.to_thread(img, c["id"]) for c in keep))
            per = COLS * ROWS
            for s in range(0, len(keep), per):
                sheet = Image.new("RGB", (COLS * TW, ROWS * (TH + 34)), (20, 20, 20))
                dr = ImageDraw.Draw(sheet)
                for k, (c, im) in enumerate(zip(keep[s:s + per], ims[s:s + per])):
                    x, y = (k % COLS) * TW, (k // COLS) * (TH + 34)
                    if im:
                        sheet.paste(im.resize((TW, TH)), (x, y + 34))
                    dr.text((x + 8, y + 5), f"{d['key']} c{s + k + 1}", fill=(255, 230, 160), font=F)
                sheet.save(f"{OUT}/{d['key']}-{s // per + 1}.jpg", quality=80)
        await b.close()
    json.dump(allc, open(f"{OUT}/candidates.json", "w"), indent=1, ensure_ascii=False)
    open(f"{OUT}/log.txt", "w").write("\n".join(log) + "\n")
    print({k: len(v) for k, v in allc.items()})


asyncio.run(main())
