"""Run axe-core (WCAG 2.1 A + AA) against the running app.

Usage: python3 scripts/run_axe.py [url]   # default http://localhost:8080
Requires: playwright (with chromium installed).
"""

import asyncio
import json
import sys

from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080"
AXE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js"
TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]


async def main() -> int:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        await page.goto(URL, wait_until="networkidle")
        await page.add_script_tag(url=AXE_CDN)
        result = await page.evaluate(
            "async (tags) => await axe.run(document, { runOnly: { type: 'tag', values: tags } })",
            TAGS,
        )

        violations = result["violations"]
        print(f"{URL}: {len(violations)} violations, {len(result['passes'])} passes")
        for violation in violations:
            print(f"\n[{violation['impact']}] {violation['id']}: {violation['help']}")
            for node in violation["nodes"]:
                print("  ", json.dumps(node.get("target")))
                print("  ", node["failureSummary"].replace("\n", "\n   "))

        await browser.close()
        return 1 if violations else 0


sys.exit(asyncio.run(main()))
