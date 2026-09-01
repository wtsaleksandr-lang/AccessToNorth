# SEO and indexing roadmap

Last updated: 2026-09-01

## Completed in code

- [x] Use one canonical origin: `https://accesstonorth.com/`
- [x] Keep canonical URLs, Open Graph URLs, RSS, sitemap entries, and structured data consistent
- [x] Add permanent `www` → non-`www` redirect and redirect the outdated CA$2,500 CLVS article
- [x] Generate route-specific titles, descriptions, canonical tags, crawl directives, and JSON-LD during the production build
- [x] Add WebApplication schema for free calculators and Article/BlogPosting schema for editorial pages
- [x] Remove invalid `fr-CA` hreflang that pointed to the same English URL
- [x] Exclude coming-soon tools from the sitemap
- [x] Preserve meaningful `lastmod` dates instead of changing every URL on every build
- [x] Add the security and customs-clearance landing pages to the sitemap
- [x] Expand crawlable copy and FAQs on the container and truck loading tools
- [x] Strengthen internal links between guides, calculators, services, and the main navigation
- [x] Update the Canadian Courier Low Value Shipment threshold from CA$2,500 to CA$3,300
- [x] Replace the favicon with the blue ShieldCheck business icon
- [x] Add SVG, ICO, 32 px, Apple touch, and maskable favicon variants
- [x] Add the missing 1200 × 630 Open Graph image
- [x] Add a web app manifest
- [x] Serve full crawl-visible article bodies in the prerendered HTML for every published blog post
- [x] Add crawl-visible service guidance for BN registration, CARM onboarding, and non-resident importer setup
- [x] Add visible official-source citations and schema citations to priority regulatory articles
- [x] Add automated checks for internal links, missing alt text, metadata, sitemap coverage, schema, and primary sources
- [x] Add IndexNow verification and submission tooling

## Search Console setup

- [x] Add and DNS-verify the Domain property `accesstonorth.com`
- [x] Submit `https://accesstonorth.com/sitemap.xml` (63 URLs, zero errors and warnings on September 1, 2026)
- [x] Inspect and request indexing for these initial URLs:
  - `https://accesstonorth.com/`
  - `https://accesstonorth.com/resources/how-to-import-into-canada/`
  - `https://accesstonorth.com/tools/container-calculator/`
  - `https://accesstonorth.com/tools/hs-code-finder/`
  - `https://accesstonorth.com/customs-calculator/`
- [x] Connect OAuth Search Console reporting and URL inspection
- [ ] Review Page indexing, Core Web Vitals, HTTPS, and Manual actions after Google completes the first sitemap crawl
- [ ] Export the first 28 days of query/page data and use impressions with low click-through rates to improve titles and snippets

The Search Console API requires OAuth 2.0 or a service account with property access. A browser/API key by itself cannot read Search Console data or manage a private property. Google's Indexing API must not be used for these pages; it is restricted to qualifying job-posting and livestream pages.

## Next ranking work

### Highest value

- [x] Replace meta-only prerendering with full static HTML rendering for blog articles and priority tool/service introductions
- [ ] Add a real expert/reviewer profile with name, role, experience, and a profile page. Do not invent credentials.
- [x] Add detailed original worked examples to the major public calculators
- [x] Publish initial tool-supporting articles for pallet capacity, 20 ft versus 40 ft containers, Canadian HS-code examples, and trailer load planning
- [ ] Earn relevant links from freight partners, chambers of commerce, Canadian business directories, logistics associations, and useful guest contributions. Technical SEO alone will not place a new domain above established CBSA and brokerage sites.

### Quality and maintenance

- [ ] Review all regulatory articles quarterly against current CRA, CBSA, CFIA, and Global Affairs sources
- [x] Add an `updatedDate` field to blog posts so sitemap and Article schema show the real revision date
- [x] Add automated checks for broken internal links and missing image alt text
- [x] Return a true HTTP 404 for unknown public routes while preserving the branded page
- [ ] Measure Core Web Vitals on the deployed site and optimize only confirmed bottlenecks
- [ ] Create unique French URLs before restoring `fr-CA` hreflang

## Expectations

Indexing and ranking are different. The site can be indexed while still ranking below older, more authoritative domains. No code change or Search Console setting can guarantee page one. The practical target is to first win specific long-tail searches, build useful backlinks and user engagement, and then move toward broader terms.
