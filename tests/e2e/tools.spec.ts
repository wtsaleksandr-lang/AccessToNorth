import { test, expect, type Page } from "@playwright/test";

/**
 * Tool + calculator coverage.
 *
 * Each tool is verified at three levels:
 *   1. The route loads and doesn't throw an uncaught JS error during mount
 *      (lazy-loaded chunks, three.js initialization, etc.).
 *   2. Primary controls render (identified by data-testid).
 *   3. Where the tool is pure-client, one real interaction runs end-to-end.
 *
 * API-dependent tools (HS Code Finder, Customs Calculator) are verified to
 * render without crashing even if the HS-code DB is empty in this
 * environment. If you want to also validate DB-backed results, seed the
 * database first and enable the assertions marked `@needs-db`.
 */

/** Collect uncaught page errors during a test so a silent runtime crash fails. */
function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore noisy third-party warnings that don't indicate a real failure.
      if (/Failed to load resource|favicon|tawk/i.test(text)) return;
      errors.push(text);
    }
  });
  return errors;
}

test.describe("tool pages load without runtime errors", () => {
  test("HS Code Finder — page mounts + search controls present", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/hs-code-finder");

    await expect(page.getByTestId("text-hs-finder-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("card-hs-search")).toBeVisible();
    await expect(page.getByTestId("input-hs-search")).toBeVisible();

    // Type a query; the UI should not crash whether the DB returns 0 or N hits.
    await page.getByTestId("input-hs-search").fill("cotton shirt");
    // Debounced fetch fires; give it a moment and confirm the page didn't blow up.
    await page.waitForTimeout(600);

    expect(errors, `Uncaught errors on /tools/hs-code-finder: ${errors.join("\n")}`).toEqual([]);
  });

  test("Customs Calculator — hero, form, and HS input render", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/customs-calculator");

    // First assertion waits for lazy chunk + hydration — give it more room than
    // the 5s Playwright default. Subsequent assertions inherit once the tree is up.
    await expect(page.getByTestId("text-customs-heading")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("card-calculator-form")).toBeVisible();
    await expect(page.getByTestId("input-hs-code")).toBeVisible();

    // Filter the expected "no backend" noise that Customs Calculator logs when
    // /api/customs/countries returns 503 in the static-serve harness. This is
    // the defensive branch in CustomsCalculator.tsx — not a crash.
    const realErrors = errors.filter(
      (e) => !/failed to load countries|Failed to load resource.*503/i.test(e),
    );
    expect(realErrors, `Uncaught errors on /customs-calculator: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("CARM Security Calculator — pure-client, runs a real calculation", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/carm-security-calculator");

    await expect(page.getByTestId("text-calc-heading")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("card-calculator-form")).toBeVisible();

    // Fill the required monthly-payable input with a known-good number.
    await page.getByTestId("input-monthly-payable").fill("50000");
    await page.getByTestId("button-calculate").click();

    // The "calculating" overlay (data-testid=card-calculating) runs a
    // 3-step framer-motion animation before section-results mounts. That
    // takes about 1.2–1.5s on a cold JIT. Give it 8s to be safe.
    await expect(page.getByTestId("section-results")).toBeVisible({ timeout: 8_000 });

    expect(errors, `Uncaught errors on /carm-security-calculator: ${errors.join("\n")}`).toEqual([]);
  });

  test("Container Calculator — 3D viewer and controls mount", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/container-calculator");

    await expect(page.getByTestId("text-calculator-title")).toBeVisible({ timeout: 15_000 });
    // Container-size picker renders on mount — the 3D viewer itself only
    // appears after the user adds cargo, so don't assert on it here.
    await expect(page.getByTestId("button-container-custom")).toBeVisible();
    // Unit-system toggle should be interactive on mount.
    await expect(page.getByTestId("button-unit-imperial")).toBeVisible();
    await expect(page.getByTestId("button-unit-metric")).toBeVisible();

    // Regression: 5,260 kg is the total row weight for all 7 pallets. It must
    // not be multiplied by quantity, and the best-fit recommendation is 1x40' DC.
    await page.getByTestId("button-unit-metric-table").click();
    await page.getByTestId("button-container-40hc").click();
    await page.getByTestId("input-cargo-name-0").fill("7 Pallets");
    await page.getByTestId("input-cargo-length-0").fill("121.92");
    await page.getByTestId("input-cargo-width-0").fill("121.92");
    await page.getByTestId("input-cargo-height-0").fill("154.94");
    await page.getByTestId("input-cargo-qty-0").fill("7");
    await page.getByTestId("input-cargo-weight-0").fill("5260");
    await page.getByTestId("button-calculate").click();

    await expect(page.getByTestId("notice-all-fit")).toContainText("1 × 40' High Cube", { timeout: 10_000 });
    await expect(page.getByTestId("notice-container-recommendation")).toContainText("40' Standard");

    // Three.js often logs GPU warnings — filter those out but fail on real errors.
    const realErrors = errors.filter((e) => !/WebGL|GPU|THREE\./i.test(e));
    expect(realErrors, `Uncaught errors on /tools/container-calculator: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("Truck Load Planner — tabs, trailer controls render", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/truck-load-planner");

    await expect(page.getByTestId("text-tool-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mode-tabs")).toBeVisible();
    await expect(page.getByTestId("tab-mode-pro")).toBeVisible();
    await expect(page.getByTestId("tab-mode-beginner")).toBeVisible();

    const realErrors = errors.filter((e) => !/WebGL|GPU|THREE\./i.test(e));
    expect(realErrors, `Uncaught errors on /tools/truck-load-planner: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("Freight Quote — waitlist form renders (service marked coming soon)", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/freight-quote");

    await expect(page.getByTestId("text-freight-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("input-freight-email")).toBeVisible();
    await expect(page.getByTestId("button-freight-notify")).toBeVisible();

    expect(errors, `Uncaught errors on /tools/freight-quote: ${errors.join("\n")}`).toEqual([]);
  });

  test("Shipment Tracking — tracking input + waitlist form render", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/shipment-tracking");

    await expect(page.getByTestId("text-tracking-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("input-tracking-id")).toBeVisible();
    await expect(page.getByTestId("button-track")).toBeVisible();

    expect(errors, `Uncaught errors on /tools/shipment-tracking: ${errors.join("\n")}`).toEqual([]);
  });
});

// The API checks require the full Express server + DB. When the tests
// run against the static-serve harness (no backend), skip them cleanly
// instead of failing with 503 by setting E2E_SKIP_BACKEND=1.
const hasBackend = !process.env.E2E_SKIP_BACKEND;

test.describe("tool-backing API endpoints respond", () => {
  test.beforeEach(() => {
    test.skip(!hasBackend, "Backend not available (E2E_SKIP_BACKEND=1)");
  });
  test("GET /api/customs/countries returns an array", async ({ request }) => {
    const res = await request.get("/api/customs/countries");
    expect(res.ok(), `countries endpoint should return 2xx, got ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body) || Array.isArray(body?.countries)).toBeTruthy();
  });

  test("GET /api/customs/hs-search with a query returns 2xx", async ({ request }) => {
    const res = await request.get("/api/customs/hs-search?q=cotton&limit=5");
    expect(res.ok(), `hs-search endpoint should return 2xx, got ${res.status()}`).toBeTruthy();
    const body = await res.json();
    // Either an array or an object wrapping one — don't assert content, just shape.
    expect(Array.isArray(body) || typeof body === "object").toBeTruthy();
  });
});
