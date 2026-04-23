# Blog Image Briefs

Every blog post auto-generates a category-branded SVG hero ([generator](../script/generateBlogImages.ts)) at build time. The SVG includes post title, category label, AccessToNorth branding, and a keyword-selected motif icon. **You can ship with these immediately** — they're professional-grade.

When you're ready to upgrade to custom illustrations or stock photos, each post's `heroImageUrl` field overrides the SVG. Drop a real image at `client/public/blog/<slug>.jpg`, set `heroImageUrl: "/blog/<slug>.jpg"`, rebuild.

Below: detailed image briefs for each post, suitable for Midjourney, DALL-E 3, a stock-photo search, or a human designer.

---

## Socialsync-style automated fetch

For each post, pass the **search keywords** (below) to your image source of choice:

- **Pexels API:** `GET https://api.pexels.com/v1/search?query={keywords}&per_page=5&orientation=landscape`
- **Unsplash API:** `GET https://api.unsplash.com/search/photos?query={keywords}&orientation=landscape`
- **Pixabay API:** `GET https://pixabay.com/api/?key={key}&q={keywords}&image_type=photo&orientation=horizontal`

Pick the first result that passes a quick subject-match heuristic (contains expected object, no people's faces if licensing restricts, aspect ratio ≥1.5). Save to `client/public/blog/<slug>.jpg`. The post auto-uses it on next build.

---

## Per-post briefs

### 1. register-gst-hst-non-resident-canada
- **Search keywords:** `canada cra tax registration paperwork`
- **AI prompt:** "A stylized globe with Canada highlighted in red, a manila folder of CRA tax forms beside it, modern flat illustration, blue and white palette"
- **Alt:** Illustration of global trade with Canadian tax registration paperwork

### 2. canada-30000-rule-gst-hst
- **Search keywords:** `business revenue chart threshold financial growth`
- **AI prompt:** "Upward line chart crossing a horizontal threshold marked CA$30,000, editorial infographic style, blue and gold accents"
- **Alt:** Chart illustrating the CA$30,000 GST/HST small-supplier threshold

### 3. do-i-need-canadian-business-number-checklist
- **Search keywords:** `decision flowchart checklist business question`
- **AI prompt:** "Decision-tree flowchart with five diamond nodes and a CRA business number highlighted at the root, clean vector infographic, blue on light"
- **Alt:** Flowchart showing five questions to determine if you need a Canadian Business Number

### 4. voluntary-vs-mandatory-gst-hst
- **Search keywords:** `balance scale comparison business decision`
- **AI prompt:** "Minimalist balance scale weighing a stack of tax forms against a stack of recovered dollar bills, blue-green accent, flat illustration"
- **Alt:** Balance scale weighing voluntary GST/HST registration against mandatory

### 5. non-resident-amazon-fba-canada
- **Search keywords:** `amazon warehouse pallets fulfillment canada`
- **AI prompt:** "Industrial warehouse interior with pallets stacked high, a Canadian flag visible through the loading dock, semi-realistic illustration, muted palette"
- **Alt:** Non-resident Amazon FBA seller shipping inventory into a Canadian warehouse

### 6. gst-hst-missed-deadline-penalties
- **Search keywords:** `calendar deadline missed red circle warning`
- **AI prompt:** "Wall calendar with a red-circled past date, a rising dollar-sign chart to its right showing penalty growth, flat editorial"
- **Alt:** Illustration of a missed GST/HST filing deadline with escalating penalties

### 7. carm-onboarding-checklist
- **Search keywords:** `checklist steps business process workflow`
- **AI prompt:** "Numbered 5-step checklist on a clipboard with CBSA portal icons and a customs-form background, clean infographic, CBSA red and slate"
- **Alt:** Five-step CARM onboarding checklist for Canadian importers

### 8. carm-bond-vs-cash-security
- **Search keywords:** `financial security coins bond comparison`
- **AI prompt:** "Two stacks of coins side-by-side labeled 'bond premium' (short) and 'tied-up cash' (tall), with a customs bond certificate between them, clean editorial, blue and gold"
- **Alt:** Comparison of customs bond premium vs cash deposit for CARM security

### 9. rpp-program-explained
- **Search keywords:** `timeline payment schedule monthly billing`
- **AI prompt:** "Horizontal timeline showing shipment release → statement generation → payment due date, clean infographic, blue and white"
- **Alt:** Timeline of the RPP monthly billing cycle

### 10. delegating-customs-broker-carm
- **Search keywords:** `handshake digital partnership business authorization`
- **AI prompt:** "Digital handshake between an importer icon and a customs broker icon inside a portal window, clean flat illustration, slate and blue"
- **Alt:** Customs broker delegation flow inside the CARM Client Portal

### 11. carm-common-errors
- **Search keywords:** `computer error warning red alert technician`
- **AI prompt:** "Customs portal screen with red error banners and a technician fixing issues on a laptop, clean realistic illustration, blue and red accent"
- **Alt:** Common CARM Client Portal errors and their fixes

### 12. find-canadian-hs-code
- **Search keywords:** `magnifying glass code book search detailed`
- **AI prompt:** "A magnifying glass hovering over a Canadian customs tariff book, HS code branches radiating out like a tree diagram, editorial illustration, blue and green"
- **Alt:** Finding the correct Canadian HS code for a product

### 13. hs-misclassification-mistakes
- **Search keywords:** `sorting conveyor boxes mistakes customs warehouse`
- **AI prompt:** "Boxes on a sorting conveyor at a customs facility, some marked with red 'wrong' stamps, semi-realistic illustration, industrial palette with red accent"
- **Alt:** Common HS code misclassification mistakes at a customs sorting facility

### 14. cusma-origin-certification
- **Search keywords:** `canada us mexico flags trade agreement certificate`
- **AI prompt:** "Three country flags (Canada, US, Mexico) hovering above a certificate-of-origin document with a signature, clean editorial illustration, official colors"
- **Alt:** CUSMA origin certification for cross-border trade

### 15. customs-valuation-methods
- **Search keywords:** `staircase steps methodology hierarchy levels`
- **AI prompt:** "Six-step staircase labeled with valuation methods ascending in complexity, isometric infographic, blue and teal"
- **Alt:** The six Canadian customs valuation methods in hierarchical order

### 16. cbsa-shipment-hold-guide
- **Search keywords:** `truck stopped border checkpoint customs inspection`
- **AI prompt:** "Container truck stopped at a CBSA border checkpoint at dusk, dashboard displaying a 'hold' alert, realistic illustration, blue-red tone"
- **Alt:** CBSA hold at a Canadian border checkpoint

### 17. sima-duty-2026-cases
- **Search keywords:** `steel coils industrial import duty measurement`
- **AI prompt:** "Stacked steel coils in a warehouse with a semi-transparent percentage-rate meter overlay showing anti-dumping rates, editorial photo-style, blue-grey palette"
- **Alt:** SIMA anti-dumping duty cases affecting Canadian imports of steel

### 18. amps-penalties-canada
- **Search keywords:** `customs officer ticket fine penalty documentation`
- **AI prompt:** "A customs officer holding a ticket-book labeled AMPS with fine codes stacked behind, editorial photo illustration, slate and amber palette"
- **Alt:** CBSA AMPS administrative monetary penalty system

### 19. certificate-of-origin-cusma-requirements
- **Search keywords:** `certificate document checkmarks requirements compliance`
- **AI prompt:** "A CUSMA certificate document on a desk with green checkmarks next to each required data element, clean editorial illustration, white and blue"
- **Alt:** CUSMA certificate of origin data elements checklist

### 20. canadian-import-permits-by-commodity
- **Search keywords:** `government permit stamps agencies regulatory commodities`
- **AI prompt:** "Five permit stamps from different Canadian agencies (CFIA, Health Canada, GAC, ECCC, NRCan) arranged around a central commodity grid, editorial illustration, institutional blue-green"
- **Alt:** Canadian import permit requirements by commodity and regulating agency

### 21. shopify-canada-tax-duty-guide
- **Search keywords:** `online store checkout tax configuration ecommerce`
- **AI prompt:** "Shopify-style checkout screen mockup with tax and duty line items visible, small Canadian flag in upper corner, UI mockup illustration, green and white"
- **Alt:** Shopify Canada checkout showing tax and duty compliance

### 22. shipping-us-to-canada-2026-costs
- **Search keywords:** `freight truck cost comparison cross border shipping`
- **AI prompt:** "Split truck illustration showing freight cost on one side and total landed cost (freight + duty + GST + brokerage) on the other, editorial infographic, blue-gold"
- **Alt:** True landed cost of shipping from US to Canada in 2026

### 23. ddp-vs-dap-ecommerce-canada
- **Search keywords:** `checkout comparison ecommerce pricing shipping options`
- **AI prompt:** "Two checkout screens side-by-side: DDP showing one all-in price, DAP showing a base price plus duty at delivery; UI mockup illustration, green-amber contrast"
- **Alt:** DDP vs DAP checkout comparison for Canadian e-commerce

### 24. customs-audits-what-to-expect
- **Search keywords:** `audit documents review compliance binder examination`
- **AI prompt:** "An open audit binder with paper tabs, highlighted tables visible on the pages, a CBSA seal in the corner, realistic editorial illustration, slate-blue palette"
- **Alt:** Canadian customs audit documentation and record review

### 25. year-end-compliance-checklist-2026
- **Search keywords:** `checklist clipboard calendar december year end business`
- **AI prompt:** "A checklist on a clipboard with a Canadian maple leaf, a December calendar beside it, and a customs building in the soft-focus background, editorial illustration, clean year-end palette"
- **Alt:** Year-end Canadian trade compliance checklist

---

## Integration with Socialsync

When your Socialsync service goes live, automate this:

```pseudo
for each post in POSTS:
  keywords = post.imageKeywords  // add this field
  images = pexels.search(keywords, limit=5)
  best = images.filter(by aspect_ratio >= 1.5)[0]
  download(best, to=`client/public/blog/${post.slug}.jpg`)
  post.heroImageUrl = `/blog/${post.slug}.jpg`
```

Keep the SVG generator as the fallback — if the API is down or rate-limited, the SVG still renders a clean, on-brand hero.
