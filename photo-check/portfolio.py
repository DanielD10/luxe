import asyncio, json, urllib.request, urllib.error
from playwright.async_api import async_playwright
P = "https://daniel-digital-atelier.vercel.app"
out = {}
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None
op = urllib.request.build_opener(NoRedirect)
for path in ["/luxe", "/luxe/index.html", "/api/luxe/ai", "/work/luxe"]:
    try:
        r = op.open(urllib.request.Request(P + path, headers={"User-Agent": "Mozilla/5.0"}), timeout=30)
        out[path] = [r.status, r.headers.get("location")]
    except urllib.error.HTTPError as e:
        out[path] = [e.code, e.headers.get("location")]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        await pg.goto(P + "/work/luxe", wait_until="networkidle")
        await pg.wait_for_timeout(1500)
        out["title"] = await pg.title()
        out["links"] = await pg.evaluate("[...document.querySelectorAll('a')].map(a=>a.href).filter(h=>h.includes('luxe'))")
        out["text_has_old"] = await pg.evaluate("['Try it here','sample content','iframe','prototype'].filter(s=>document.body.innerHTML.toLowerCase().includes(s.toLowerCase()))")
        out["stats"] = await pg.evaluate("[...document.querySelectorAll('.nxo-stats dd')].map(d=>d.textContent)")
        await pg.screenshot(path="photo-check/live/portfolio-luxe.jpg", type="jpeg", quality=70)
        await pg.goto(P + "/luxe", wait_until="networkidle")
        out["luxe_lands_on"] = pg.url
        await b.close()
asyncio.run(main())
json.dump(out, open("photo-check/live/portfolio.json", "w"), indent=1)
print(json.dumps(out, indent=1))
