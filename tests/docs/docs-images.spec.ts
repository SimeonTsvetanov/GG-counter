// `pnpm docs:images` — generates every docs image in the light and dark theme from tests/docs/shots.ts.
// Fixed viewport, 2x, reduced motion, animations off and English: re-running gives the same images, and
// the light and dark image of a shot show the same content. GG Counter uses no random numbers, so
// (unlike TeamSync) nothing is seeded; the clock and the time zone are fixed, because the history sheet
// shows the time of each change (and shots.ts steps the clock past the 3 s merge window).
// bypassCSP: the app's meta CSP would block the CSS Playwright injects for `style` and `mask`.
import { expect, test } from "@playwright/test";
import { DOCS_SHOTS } from "./shots.ts";

const VIEWPORTS = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 800 } } as const;
/** Toasts ("Ready to work offline ✓", "Saved … ✓") come and go — they don't belong in a docs image. */
const HIDE_TOASTS = ".toast-region, .toast { display: none !important; }";
/** Returns `box` with `margin` CSS pixels on every side; fails the shot when the crop is not on screen. */
function grown(box: { x: number; y: number; width: number; height: number } | null, margin: number): { x: number; y: number; width: number; height: number } {
  if (box === null) throw new Error("The crop element is not visible.");
  return { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin };
}

/** The fixed start time of every shot: an evening game night. */
const GAME_NIGHT = new Date("2026-11-20T19:30:00Z");

for (const shot of DOCS_SHOTS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`docs image ${shot.page}/${shot.name}-${colorScheme}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: VIEWPORTS[shot.device], deviceScaleFactor: 2, colorScheme, reducedMotion: "reduce", locale: "en-US", timezoneId: "UTC", bypassCSP: true });
      const page = await context.newPage();
      await page.clock.install({ time: GAME_NIGHT });
      await page.goto("./");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // explicit ready signal, never networkidle
      await shot.setUp(page);
      await page.mouse.move(-1, -1); // no hover state in the picture
      const options = { path: `docs/images/${shot.page}/${shot.name}-${colorScheme}.png`, animations: "disabled", mask: shot.mask?.(page) ?? [], maskColor: "#8E8E93", style: shot.showToasts ? "" : HIDE_TOASTS } as const;
      const crop = shot.crop?.(page);
      if (crop === undefined) await page.screenshot(options);
      else if (shot.cropMargin === undefined) await crop.screenshot(options);
      else await page.screenshot({ ...options, clip: grown(await crop.boundingBox(), shot.cropMargin) });
      await context.close();
    });
  }
}
