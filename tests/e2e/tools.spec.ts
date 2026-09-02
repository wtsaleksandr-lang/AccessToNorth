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

    // The calculation is local and should reveal results immediately.
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
    await expect(page.getByTestId("container-icon-20dc")).toBeVisible();
    await expect(page.getByTestId("container-icon-40hc")).toBeVisible();
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
    await page.getByTestId("input-cargo-color-0").evaluate((input: HTMLInputElement) => {
      input.value = "#155e75";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await expect(page.getByTestId("input-cargo-color-0")).toHaveValue("#155e75");
    await page.getByTestId("button-calculate").click();

    await expect(page.getByTestId("notice-all-fit")).toContainText("1 × 40' High Cube", { timeout: 10_000 });
    await expect(page.getByTestId("notice-container-recommendation")).toContainText("40' Standard");
    await expect(page.getByTestId("container-comparison-panel")).toBeVisible();
    await expect(page.getByTestId("container-comparison-20dc")).toHaveCount(0);
    await page.getByTestId("button-toggle-container-comparison").click();
    await expect(page.getByTestId("container-comparison-20dc")).toContainText("2 containers");
    await expect(page.getByTestId("container-comparison-40dc")).toContainText("Best fit");
    await expect(page.getByTestId("container-results-workspace")).toBeVisible();
    await expect(page.getByTestId("button-share-loading-plan")).toBeVisible();
    await expect(page.getByTestId("result-tab-plan")).toHaveAttribute("aria-selected", "true");
    await expect(page.getByTestId("button-export-csv")).toBeVisible();
    await expect(page.getByTestId("container-guide-details")).not.toHaveAttribute("open", "");
    await expect(page.getByTestId("button-toggle-container-branding")).toHaveCount(0);

    // A browser with WebGL gets the guarded manual layout editor. Browsers
    // without it retain the universal 2D fallback and all load-plan details.
    if (await page.getByTestId("button-arrange-cargo").count()) {
      await expect(page.getByTestId("container-viewer-workspace")).toBeVisible();
      await expect(page.getByTestId("button-container-fullscreen")).toBeVisible();
      await expect(page.getByTestId("container-viewer-sidebar")).toBeVisible();
      await expect(page.getByTestId("button-container-view-doors")).toBeVisible();
      await page.getByTestId("button-container-view-doors").click();
      await page.getByTestId("button-container-layer-grid").click();
      await expect(page.getByTestId("button-arrange-cargo")).toBeVisible();
      await page.getByTestId("button-arrange-cargo").click();
      await expect(page.getByTestId("button-reset-cargo-layout")).toBeVisible();
      await page.getByTestId("button-loading-sequence").click();
      await expect(page.getByTestId("loading-sequence-controls")).toBeVisible();
      await expect(page.getByTestId("loading-sequence-controls")).toContainText("Loading step 1 of 7");
    }

    await page.getByTestId("result-tab-overview").click();
    await expect(page.getByTestId("plan-review-panel")).toBeVisible();
    await expect(page.getByTestId("plan-review-fit")).toContainText("Ready");
    await expect(page.getByTestId("plan-review-securement")).toContainText("Manual");
    await expect(page.getByTestId("container-balance-panel")).toBeVisible();
    await expect(page.getByTestId("container-balance-panel")).toContainText("Weight Balance & Center of Gravity");
    await page.getByTestId("button-toggle-container-balance").click();
    await expect(page.getByTestId("container-balance-panel")).toContainText("Treat this as guidance");
    await expect(page.getByTestId("cargo-mix-panel")).toBeVisible();

    await page.getByTestId("result-tab-details").click();
    await expect(page.getByTestId("table-loading-details-0")).toBeVisible();

    await page.setViewportSize({ width: 360, height: 800 });
    const tabsFitMobile = await page.getByTestId("result-workspace-tabs").evaluate((element) => (
      element.scrollWidth <= element.clientWidth + 1
    ));
    expect(tabsFitMobile, "Loading Plan, Overview, and Cargo Details must fit without horizontal scrolling").toBe(true);

    // Any fit-affecting edit must invalidate the old plan so stale results
    // cannot be mistaken for the result of the new cargo inputs.
    await page.getByTestId("input-cargo-height-0").fill("150");
    await expect(page.getByTestId("results-section")).toHaveCount(0);

    // Three.js often logs GPU warnings — filter those out but fail on real errors.
    const realErrors = errors.filter((e) => !/WebGL|GPU|THREE\./i.test(e));
    expect(realErrors, `Uncaught errors on /tools/container-calculator: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("Truck Load Planner — builds a spatial pallet plan", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/truck-load-planner");

    await expect(page.getByTestId("text-tool-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("mode-tabs")).toBeVisible();
    await expect(page.getByTestId("tab-mode-pro")).toBeVisible();
    await expect(page.getByTestId("tab-mode-beginner")).toBeVisible();
    await expect(page.getByTestId("trailer-dryvan53").getByRole("img")).toHaveAttribute("aria-label", "Dry van trailer");
    await expect(page.getByTestId("trailer-reefer53").getByRole("img")).toHaveAttribute("aria-label", "Refrigerated trailer");
    await expect(page.getByTestId("trailer-curtain53").getByRole("img")).toHaveAttribute("aria-label", "Curtain-side trailer");
    await expect(page.getByTestId("trailer-flatbed53").getByRole("img")).toHaveAttribute("aria-label", "Flatbed trailer");
    await expect(page.getByTestId("trailer-stepdeck53").getByRole("img")).toHaveAttribute("aria-label", "Step-deck trailer");
    await expect(page.getByTestId("trailer-rgn").getByRole("img")).toHaveAttribute("aria-label", "RGN lowboy trailer");

    await page.getByTestId("tab-cargo-pallets").click();
    await page.getByTestId("input-pallet-name-0").fill("Test pallets");
    await page.getByTestId("select-pallet-type-0").selectOption("48x48");
    await page.getByTestId("input-pallet-h-0").fill("61");
    await page.getByTestId("input-pallet-wt-0").fill("1657");
    await page.getByTestId("input-pallet-qty-0").fill("7");
    await page.getByTestId("button-calculate").click();

    await expect(page.getByTestId("fitment-result")).toContainText("Fits in one trailer");
    await expect(page.getByTestId("truck-spatial-plan")).toBeVisible();
    await expect(page.getByTestId("truck-3d-preview")).toBeVisible();
    await expect(page.getByTestId("truck-loading-sequence-controls")).toBeVisible();
    await expect(page.getByTestId("truck-balance-panel")).toContainText("Not an axle-weight calculation");
    await expect(page.getByTestId("button-truck-pdf")).toBeVisible();

    const realErrors = errors.filter((e) => !/WebGL|GPU|THREE\./i.test(e));
    expect(realErrors, `Uncaught errors on /tools/truck-load-planner: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("Pallet Builder — creates a real layer plan and transfers it", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/pallet-builder");

    await expect(page.getByTestId("text-pallet-builder-title")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("pallet-carton-name-0").fill("Export cartons");
    await page.getByTestId("pallet-carton-lengthIn-0").fill("24");
    await page.getByTestId("pallet-carton-widthIn-0").fill("18");
    await page.getByTestId("pallet-carton-heightIn-0").fill("12");
    await page.getByTestId("pallet-carton-weight-0").fill("20");
    await page.getByTestId("pallet-carton-quantity-0").fill("20");

    await expect(page.getByTestId("pallet-metric-pallets-required")).toContainText("1");
    await expect(page.getByTestId("pallet-metric-cartons-planned")).toContainText("20");
    await expect(page.getByTestId("pallet-metric-loaded-height")).toContainText("65.5 in");
    await expect(page.getByTestId("pallet-3d-preview")).toBeVisible();

    await page.getByTestId("pallet-to-container").click();
    await expect(page).toHaveURL(/\/tools\/container-calculator\?from=pallet-builder/);
    await expect(page.getByTestId("input-cargo-name-0")).toHaveValue("Built pallet", { timeout: 15_000 });
    await expect(page.getByTestId("input-cargo-qty-0")).toHaveValue("1");

    const realErrors = errors.filter((error) => !/WebGL|GPU|THREE\./i.test(error));
    expect(realErrors, `Uncaught errors during pallet-builder transfer: ${realErrors.join("\n")}`).toEqual([]);
  });

  test("Freight Quote — structured RFQ workflow renders", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/freight-quote");

    await expect(page.getByTestId("text-freight-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("freight-step-shipment")).toBeVisible();
    await expect(page.getByTestId("input-freight-origin")).toBeVisible();
    await expect(page.getByTestId("input-freight-destination")).toBeVisible();
    await expect(page.getByTestId("input-freight-commodity")).toBeVisible();
    await expect(page.getByTestId("button-freight-next")).toBeVisible();

    await page.getByTestId("input-freight-origin").fill("Shanghai, China");
    await page.getByTestId("input-freight-destination").fill("Toronto, Ontario, Canada");
    await page.getByTestId("input-freight-commodity").fill("Consumer goods");
    await page.getByTestId("button-freight-next").click();
    await expect(page.getByTestId("freight-market-estimator")).toBeVisible();
    await expect(page.getByTestId("button-freight-estimate")).toBeVisible();

    expect(errors, `Uncaught errors on /tools/freight-quote: ${errors.join("\n")}`).toEqual([]);
  });

  test("Shipment Tracking — secure request lookup renders", async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto("/tools/shipment-tracking");

    await expect(page.getByTestId("text-tracking-title")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId("input-tracking-id")).toBeVisible();
    await expect(page.getByTestId("input-tracking-email")).toBeVisible();
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
