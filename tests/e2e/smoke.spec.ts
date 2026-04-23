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
  });

  test("pricing page shows CA$99 anchor and at least one Add to Cart button", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByTestId("text-pricing-page-title")).toContainText("CA$99");
    // Business Number card should have an Add to Cart button
    await expect(page.getByTestId("button-add-bn")).toBeVisible();
  });

  test("404 page is branded, not the Replit dev placeholder", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    // SPA — returns 200 with NotFound component rendered client-side
    expect(res?.status()).toBe(200);
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
