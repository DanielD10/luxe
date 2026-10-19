import asyncio
from playwright.async_api import async_playwright
B = "http://localhost:3000"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        d = await b.new_page(viewport={"width": 1600, "height": 900})
        async def go(pg, path, wait=2500):
            await pg.goto(B + path, wait_until="networkidle"); await pg.wait_for_timeout(wait)
        await go(d, "/", 3500)
        await d.screenshot(path="photo-check/shots/home-1600.png")
        await d.screenshot(path="photo-check/shots/hero-1600x740.png", clip={"x": 0, "y": 0, "width": 1600, "height": 740})
        await d.screenshot(path="photo-check/shots/home-full.jpg", full_page=True, quality=60, type="jpeg")
        await go(d, "/destinations")
        await d.mouse.wheel(0, 500); await d.wait_for_timeout(1500)
        await d.screenshot(path="photo-check/shots/dest-1600.png")
        for slug in ["amalfi-coast", "serengeti", "fiji"]:
            await go(d, "/destinations/" + slug)
            await d.screenshot(path=f"photo-check/shots/{slug}-1600.png")
        await go(d, "/destinations/amalfi-coast")
        await d.screenshot(path="photo-check/shots/amalfi-full.jpg", full_page=True, quality=60, type="jpeg")
        m = await b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await go(m, "/", 3000)
        await m.screenshot(path="photo-check/shots/home-390.png")
        await go(m, "/destinations/napa-valley")
        await m.screenshot(path="photo-check/shots/napa-390.png")
        await go(m, "/destinations")
        await m.mouse.wheel(0, 900); await m.wait_for_timeout(1500)
        await m.screenshot(path="photo-check/shots/dest-390.png")
        await b.close()
asyncio.run(main())
