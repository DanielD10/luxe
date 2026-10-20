import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 879}, device_scale_factor=1.5)
        await pg.goto("https://luxe-six-chi.vercel.app/", wait_until="networkidle")
        await pg.wait_for_timeout(4000)
        await pg.screenshot(path="photo-check/live/case-hero.png")
        await b.close()
asyncio.run(main())
