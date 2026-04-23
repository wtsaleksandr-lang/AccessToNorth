import { test, expect } from "@playwright/test";

test.describe("blog", () => {
  test("blog index renders with category filter", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.getByRole("heading", { name: "Canadian Trade & Tax Blog" })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId("blog-category-filter")).toBeVisible();
    await expect(page.getByTestId("blog-filter-all")).toBeVisible();
  });

  test("first published post loads with real content + JSON-LD", async ({ page }) => {
    await page.goto("/blog/register-gst-hst-non-resident-canada");
    await expect(page.getByTestId("blog-post-title")).toBeVisible({ timeout: 15_000 });

    // Key-takeaways card rendered
    await expect(page.getByText("Key takeaways")).toBeVisible();

    // Body sections rendered
    await expect(page.getByRole("heading", { name: "Who must register" })).toBeVisible();

    // JSON-LD BlogPosting schema in head (injected by JsonLd component)
    const schemaCount = await page
      .locator('script[type="application/ld+json"]')
      .count();
    expect(schemaCount).toBeGreaterThan(0);
  });

  test("rss.xml is served with at least one item", async ({ request }) => {
    const res = await request.get("/rss.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<item>");
  });

  test("blog hero SVG loads", async ({ request }) => {
    const res = await request.get("/blog/register-gst-hst-non-resident-canada.svg");
    expect(res.ok()).toBeTruthy();
    expect(res.headers()["content-type"]).toMatch(/svg/i);
  });

  test("future-dated post is hidden from index but URL still works", async ({ page }) => {
    // Direct URL to a future post works (for preview)
    await page.goto("/blog/year-end-compliance-checklist-2026");
    await expect(page.getByTestId("blog-post-title")).toBeVisible({ timeout: 15_000 });

    // But it should NOT appear in the index's current view
    await page.goto("/blog");
    const futurePostTitle = await page
      .locator("h2", { hasText: "Year-End Trade Compliance" })
      .count();
    expect(futurePostTitle).toBe(0);
  });
});
