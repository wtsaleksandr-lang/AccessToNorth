import { test, expect } from "@playwright/test";

/**
 * High-signal smoke tests — fast, no external services, no DB mutation.
 * These run on every commit to catch outright breakage of the public site.
 */

test.describe("public marketing surface", () => {
  test("home page renders with hero + nav + footer", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AccessToNorth/i);

    // Hero headline
    await expect(page.getByTestId("text-hero-title")).toBeVisible();

    // Primary CTA button
    await expect(page.getByTestId("button-start-registration")).toBeVisible();

    // Footer rendered
    await expect(page.getByTestId("footer")).toBeVisible();
    await expect(page.getByTestId("link-footer-home")).toContainText("AccessToNorth.com");
    await expect(page.getByText("Reference agencies only — not affiliated or endorsed.")).toHaveCount(0);
    const disclaimer = page.getByText("Service disclaimer");
    await expect(disclaimer).toBeVisible();
    await expect(page.getByText("No legal, tax, accounting, or customs-brokerage advice.")).not.toBeVisible();
    await disclaimer.click();
    await expect(page.getByText("No legal, tax, accounting, or customs-brokerage advice.")).toBeVisible();
  });

  test("home filing workflow stays readable on a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    const workflow = page.getByTestId("hero-filing-workflow");
    await expect(workflow).toBeVisible();
    await expect(workflow).toContainText("What do you need set up?");
    await expect(workflow).toContainText("BN + GST/HST");
    await expect(workflow).toContainText("CA$299");
    await expect(page.getByTestId("hero-help-choose")).toBeVisible();
    await page.getByTestId("hero-help-choose").click();
    await expect(page.getByTestId("hero-choice-guide")).toBeVisible();
    await page.getByTestId("hero-option-business-number").click();
    await expect(page.getByTestId("hero-selected-service")).toContainText("CA$99");
    await expect(page.getByTestId("hero-client-proof")).toBeVisible();
    await expect(page.getByTestId("hero-client-proof")).toContainText("Canadian & non-resident clients");
    await expect(page.getByTestId("hero-trust-signals")).toBeVisible();
    await expect(page.getByTestId("trust-badge-cra")).toBeVisible();
    await expect(page.getByTestId("trust-badge-guarantee")).toBeVisible();
    await expect(page.getByTestId("trust-badge-secure")).toBeVisible();
    await expect(page.getByTestId("hero-agency-row")).toBeVisible();
    await expect(page.getByTestId("inst-badge-cra")).toBeVisible();
    await expect(page.getByTestId("inst-badge-cbsa")).toBeVisible();
    await expect(page.getByTestId("inst-badge-irs")).toBeVisible();

    const workflowCardBox = await page.getByTestId("hero-workflow-card").boundingBox();
    const trustSignalsBox = await page.getByTestId("hero-trust-signals").boundingBox();
    expect(workflowCardBox).not.toBeNull();
    expect(trustSignalsBox).not.toBeNull();
    expect(trustSignalsBox!.y, "Trust badges must sit below—not over—the workflow card").toBeGreaterThanOrEqual(
      workflowCardBox!.y + workflowCardBox!.height,
    );

    const fitsViewport = await workflow.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= document.documentElement.clientWidth + 1;
    });
    expect(fitsViewport, "Hero workflow must remain inside the mobile viewport").toBe(true);
  });

  test("pricing page shows CA$99 anchor and at least one Add to Cart button", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("text-pricing-page-title")).toContainText("CA$99");
    // Business Number card should have an Add to Cart button
    await expect(page.getByTestId("button-add-bn")).toBeVisible();
  });

  test("404 page is branded, not the Replit dev placeholder", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByText(/Page not found/i)).toBeVisible();
    // The dev placeholder should NOT appear
    await expect(page.getByText(/forget to add the page/i)).toHaveCount(0);
  });

  test("robots.txt and sitemap.xml are served", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("public pages consolidate on their trailing-slash canonical", async ({ request }) => {
    const response = await request.get("/resources/how-to-import-into-canada?source=test", {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe("/resources/how-to-import-into-canada/?source=test");
  });
});

const hasBackend = !process.env.E2E_SKIP_BACKEND;

test.describe("portal login gating", () => {
  test.beforeEach(() => {
    test.skip(!hasBackend, "Backend not available (E2E_SKIP_BACKEND=1)");
  });
  test("unauthenticated API call is rejected with 401", async ({ request }) => {
    const res = await request.get("/api/portal/order/DOES-NOT-EXIST");
    expect(res.status()).toBe(401);
  });

  test("invalid login credentials return 401", async ({ request }) => {
    const res = await request.post("/api/portal/login", {
      data: { email: "nobody@example.com", orderId: "ATN-INVALID" },
    });
    expect(res.status()).toBe(401);
  });
});
