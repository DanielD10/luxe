"""Browser check of the live LUXE site: every page at desktop and phone width.
Records console errors, failed requests, broken images, layout overflow, and
screenshots. Writes photo-check/live/report.json."""
import asyncio, json, os, time
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "https://luxe-six-chi.vercel.app").rstrip("/")
SLUGS = json.load(open("photo-check/slugs.json"))
OUT = "photo-check/live"
os.makedirs(OUT, exist_ok=True)
PAGES = ["/", "/destinations", "/how-it-works", "/plan", "/saved", "/about", "/privacy", "/terms", "/this-page-does-not-exist"] + [f"/destinations/{s}" for s in SLUGS]
SHOTS = {"/", "/destinations", "/destinations/amalfi-coast", "/destinations/fiji", "/plan", "/how-it-works", "/this-page-does-not-exist"}
IGNORE = ("_vercel/insights", "_vercel/speed-insights")

report = {"base": BASE, "when": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()), "pages": [], "flows": {}}


async def check(ctx, width, path):
    pg = await ctx.new_page()
    errs, failed = [], []
    pg.on("console", lambda m: errs.append(m.text[:300]) if m.type == "error" and not any(x in m.text for x in IGNORE) else None)
    pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)[:300]))
    pg.on("requestfailed", lambda r: failed.append(f"{r.url[:160]} {r.failure}") if not any(x in r.url for x in IGNORE) else None)
    bad_status = []
    pg.on("response", lambda r: bad_status.append(f"{r.status} {r.url[:160]}") if r.status >= 400 and not any(x in r.url for x in IGNORE) and r.url.rstrip("/") != (BASE + path).rstrip("/") else None)
    t0 = time.time()
    resp = await pg.goto(BASE + path, wait_until="networkidle", timeout=60000)
    load = round(time.time() - t0, 2)
    # scroll to the bottom in steps so lazy images load
    h = await pg.evaluate("document.body.scrollHeight")
    y = 0
    while y < h:
        y += 700
        await pg.evaluate(f"window.scrollTo(0, {y})")
        await pg.wait_for_timeout(120)
        h = await pg.evaluate("document.body.scrollHeight")
    await pg.wait_for_timeout(1500)
    info = await pg.evaluate("""() => {
      const imgs = [...document.images];
      const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc).map(i => i.currentSrc.slice(0, 140));
      const pending = imgs.filter(i => !i.complete).length;
      const failedFlag = [...document.querySelectorAll('img[data-failed]')].map(i => (i.currentSrc || i.src).slice(0, 140));
      return {
        title: document.title,
        h1: (document.querySelector('h1') || {}).textContent || '',
        imgs: imgs.length, broken, pending, failedFlag,
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
      };
    }""")
    if path in SHOTS:
        name = path.strip("/").replace("/", "_") or "home"
        await pg.evaluate("window.scrollTo(0, 0)")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=f"{OUT}/{name}-{width}.jpg", type="jpeg", quality=70)
    await pg.close()
    return {"path": path, "width": width, "status": resp.status if resp else None, "load_s": load,
            "errors": errs, "failed": failed, "bad_status": bad_status, **info}


async def flows(ctx):
    """What a visitor sees with no keys set: AI and live rates hidden, and the
    trip form refusing to fake success."""
    out = {}
    pg = await ctx.new_page()
    r = await pg.request.get(BASE + "/api/health")
    out["health"] = await r.json() if r.ok else r.status
    r = await pg.request.get(BASE + "/api/ai")
    out["ai_get"] = await r.json() if r.ok else r.status
    r = await pg.request.get(BASE + "/api/rates")
    out["rates_get"] = await r.json() if r.ok else r.status
    await pg.goto(BASE + "/", wait_until="networkidle")
    out["ask_button_visible"] = await pg.locator(".fab").count() > 0 and await pg.locator(".fab").first.is_visible()
    out["matchmaker_text"] = (await pg.locator("#match, .matchmaker").first.inner_text())[:300] if await pg.locator("#match, .matchmaker").count() else None
    # search
    await pg.fill(".hero-search input", "kyoto")
    await pg.click(".hero-search button")
    await pg.wait_for_load_state("networkidle")
    await pg.wait_for_timeout(800)
    out["search_url"] = pg.url
    out["search_cards"] = await pg.locator(".grid .card").count()
    # save a place
    await pg.locator(".grid .card .heart").first.click()
    await pg.wait_for_timeout(300)
    out["saved_count"] = await pg.locator(".saved-link .count").inner_text() if await pg.locator(".saved-link .count").count() else None
    # destination page price check
    await pg.goto(BASE + "/destinations/kyoto", wait_until="networkidle")
    out["price_block"] = (await pg.locator(".price-check, #price").first.inner_text())[:300] if await pg.locator(".price-check, #price").count() else None
    # trip form: should not pretend to send without email configured
    await pg.goto(BASE + "/plan?d=kyoto", wait_until="networkidle")
    await pg.wait_for_timeout(800)
    try:
        sel = await pg.evaluate("""() => [...document.querySelectorAll('form input, form select, form textarea')].map(e => ({tag: e.tagName, name: e.name, id: e.id, type: e.type}))""")
        out["form_fields"] = sel
        res = await pg.request.post(BASE + "/api/inquiry", data=json.dumps({}), headers={"content-type": "application/json"})
        out["inquiry_empty_post"] = [res.status, (await res.text())[:200]]
    except Exception as e:
        out["form_error"] = str(e)[:300]
    await pg.close()
    return out


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for width, height, scale in [(1440, 900, 1), (390, 844, 2)]:
            ctx = await b.new_context(viewport={"width": width, "height": height}, device_scale_factor=scale,
                                      is_mobile=width < 500, has_touch=width < 500)
            sem = asyncio.Semaphore(4)

            async def one(path):
                async with sem:
                    try:
                        return await check(ctx, width, path)
                    except Exception as e:
                        return {"path": path, "width": width, "crash": str(e)[:300]}
            report["pages"] += await asyncio.gather(*(one(x) for x in PAGES))
            if width == 1440:
                try:
                    report["flows"] = await flows(ctx)
                except Exception as e:
                    report["flows"]["crash"] = str(e)[:400]
            await ctx.close()
        await b.close()
    issues = []
    for r in report["pages"]:
        tag = f"{r['width']} {r['path']}"
        if r.get("crash"): issues.append(f"{tag} CRASH {r['crash']}")
        else:
            exp = 404 if "does-not-exist" in r["path"] else 200
            if r["status"] != exp: issues.append(f"{tag} status {r['status']}")
            for k in ("errors", "failed", "bad_status", "broken", "failedFlag"):
                for v in r[k]: issues.append(f"{tag} {k}: {v}")
            if r["overflowX"]: issues.append(f"{tag} horizontal overflow")
            if r["pending"]: issues.append(f"{tag} {r['pending']} images still loading")
    report["issues"] = issues
    report["image_total"] = sum(r.get("imgs", 0) for r in report["pages"])
    json.dump(report, open(f"{OUT}/report.json", "w"), indent=1)
    print("ISSUES", len(issues))
    for i in issues[:80]: print(" ", i)


asyncio.run(main())
