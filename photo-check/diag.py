import asyncio, json
from playwright.async_api import async_playwright
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(user_agent=UA, viewport={"width": 1400, "height": 1000}, locale="en-US")
        out = {}
        for url in ["https://unsplash.com/s/photos/serengeti?license=free", "https://unsplash.com/photos/positano-cliffside-houses-in-italy-z0L0mo__9bg"]:
            pg = await ctx.new_page()
            r = await pg.goto(url, wait_until="domcontentloaded", timeout=45000)
            await pg.wait_for_timeout(3000)
            await pg.mouse.wheel(0, 2000); await pg.wait_for_timeout(1500)
            info = await pg.evaluate("""() => ({
              title: document.title,
              imgs: [...document.querySelectorAll('img')].slice(0, 15).map(i => ({src: (i.src||'').slice(0,140), srcset: (i.srcset||'').slice(0,100), alt: i.alt})),
              links: [...document.querySelectorAll('a')].map(a => a.getAttribute('href')).filter(Boolean).slice(0, 60),
              metaDesc: (document.querySelector('meta[name="description"]')||{}).content || '',
              bodyText: document.body.innerText.slice(0, 800)
            })""")
            info["status"] = r.status if r else None
            out[url] = info
            await pg.screenshot(path=f"photo-check/diag-{len(out)}.png")
            await pg.close()
        json.dump(out, open("photo-check/diag.json", "w"), indent=1)
        await b.close()
asyncio.run(main())
