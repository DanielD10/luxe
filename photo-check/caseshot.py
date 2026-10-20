import asyncio, urllib.request
from playwright.async_api import async_playwright
P = "https://daniel-digital-atelier.vercel.app"
pass
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        await pg.goto(P + "/work/luxe", wait_until="networkidle"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path="photo-check/live/pf-case.jpg", type="jpeg", quality=70)
        await pg.goto(P + "/", wait_until="networkidle"); await pg.wait_for_timeout(3000)
        el = pg.locator(".art-luxe").first
        if await el.count():
            await el.scroll_into_view_if_needed(); await pg.wait_for_timeout(1500)
            await pg.screenshot(path="photo-check/live/pf-home-panel.jpg", type="jpeg", quality=70)
        await b.close()
asyncio.run(main())
