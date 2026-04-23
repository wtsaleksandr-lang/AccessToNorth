# AccessToNorth Blog Publishing Schedule

**25 SEO-optimized articles over 25 weeks.** Each Monday, the next post in the registry goes live automatically (the `publishDate` field in `client/src/data/blog/posts.ts` gates visibility — past dates = live, future dates = hidden from the index, sitemap, and RSS, but the URL works for preview).

## How publishing works

- `getPublishedPosts()` in [posts.ts](../client/src/data/blog/posts.ts) filters `POSTS` by `publishDate <= today`
- This powers the blog index, sitemap.xml, rss.xml, and prerender
- No cron job or deploy needed — rebuild once per week and everything updates
- Recommended cadence: rebuild every Sunday night or Monday morning (CI schedule)

## Schedule

| # | Publish | Slug | Primary keyword | Category | CTA |
|---|---|---|---|---|---|
| 1 | 2026-04-20 ✅ | register-gst-hst-non-resident-canada | "non-resident gst hst canada" | Registration & Tax | GST/HST Registration |
| 2 | 2026-05-04 | canada-30000-rule-gst-hst | "30000 threshold gst hst" | Registration & Tax | GST/HST Registration |
| 3 | 2026-05-11 | do-i-need-canadian-business-number-checklist | "do i need a business number" | Registration & Tax | GST/HST Registration |
| 4 | 2026-05-18 | voluntary-vs-mandatory-gst-hst | "voluntary gst hst registration" | Registration & Tax | GST/HST Registration |
| 5 | 2026-05-25 | non-resident-amazon-fba-canada | "amazon fba canada non-resident" | E-commerce & NR | Non-Resident Importer |
| 6 | 2026-06-01 | gst-hst-missed-deadline-penalties | "missed gst hst deadline" | Registration & Tax | GST/HST Registration |
| 7 | 2026-06-08 | carm-onboarding-checklist | "carm onboarding" | CARM & Imports | CARM Registration |
| 8 | 2026-06-15 | carm-bond-vs-cash-security | "carm bond vs cash" | CARM & Imports | CARM Registration |
| 9 | 2026-06-22 | rpp-program-explained | "release prior to payment" | CARM & Imports | CARM Registration |
| 10 | 2026-06-29 | delegating-customs-broker-carm | "carm broker delegation" | CARM & Imports | CARM Registration |
| 11 | 2026-07-06 | carm-common-errors | "carm errors" | CARM & Imports | CARM Registration |
| 12 | 2026-07-13 | find-canadian-hs-code | "find hs code canada" | HS Classification | HS Classification |
| 13 | 2026-07-20 | hs-misclassification-mistakes | "hs code misclassification" | HS Classification | HS Classification |
| 14 | 2026-07-27 | cusma-origin-certification | "cusma origin certification" | HS Classification | Compliance Review |
| 15 | 2026-08-03 | customs-valuation-methods | "customs valuation canada" | HS Classification | Compliance Review |
| 16 | 2026-08-10 | cbsa-shipment-hold-guide | "cbsa shipment hold" | HS Classification | Customs Clearance |
| 17 | 2026-08-17 | sima-duty-2026-cases | "sima duty canada 2026" | Compliance & Duties | Compliance Review |
| 18 | 2026-08-24 | amps-penalties-canada | "amps penalties canada" | Compliance & Duties | Compliance Review |
| 19 | 2026-08-31 | certificate-of-origin-cusma-requirements | "cusma certificate of origin" | Compliance & Duties | Compliance Review |
| 20 | 2026-09-07 | canadian-import-permits-by-commodity | "canadian import permits" | Compliance & Duties | Customs Clearance |
| 21 | 2026-09-14 | shopify-canada-tax-duty-guide | "shopify canada tax" | E-commerce & NR | Non-Resident Importer |
| 22 | 2026-09-21 | shipping-us-to-canada-2026-costs | "shipping us to canada cost" | E-commerce & NR | Customs Clearance |
| 23 | 2026-09-28 | ddp-vs-dap-ecommerce-canada | "ddp vs dap canada" | E-commerce & NR | Non-Resident Importer |
| 24 | 2026-10-05 | customs-audits-what-to-expect | "cbsa audit preparation" | Advanced | Compliance Review |
| 25 | 2026-10-12 | year-end-compliance-checklist-2026 | "year-end trade compliance" | Seasonal | All Services |

## Internal linking structure (pillar-cluster SEO)

Each article links to 2–3 related posts via the `relatedPosts` field. The clustering is:

**Cluster 1 — GST/HST & Business Number** (posts 1, 2, 3, 4, 6)
Pillar: post 1 (non-resident registration). All five cross-link back to post 1.

**Cluster 2 — CARM onboarding** (posts 7, 8, 9, 10, 11)
Pillar: post 7 (onboarding checklist). All five cross-link back.

**Cluster 3 — HS codes & classification** (posts 12, 13, 14, 15, 16)
Pillar: post 12 (find your HS code). Post 14 also links into the CUSMA cluster.

**Cluster 4 — Compliance, SIMA, and audits** (posts 17, 18, 19, 20, 24)
Pillar: post 24 (audits). Posts 17, 18 link forward to post 24.

**Cluster 5 — E-commerce non-resident** (posts 5, 21, 22, 23)
Pillar: post 23 (DDP vs DAP — highest conversion intent).

**Seasonal** (post 25) — cross-links back into the audit + AMPS posts.

## To add a new post

1. Add a new object to `POSTS` in `client/src/data/blog/posts.ts`
2. Set `publishDate` to the Monday you want it to go live (future date = hidden until then)
3. Pick a `category` from the 7 options
4. Cross-link via `relatedPosts` to 2–3 adjacent posts in the same cluster
5. Rebuild (`npm run build`) — sitemap, RSS, prerender, and hero image regenerate automatically

## Weekly publishing checklist

Every Sunday night:

1. `git pull` to refresh from production
2. `npm run build` — regenerates sitemap, RSS, prerender, and blog hero images
3. Deploy (`vercel --prod` / Replit deploy / your CI)
4. Ping Google Search Console with the updated sitemap URL (optional)
5. Share the live URL on LinkedIn / X / email newsletter

That's it. No CMS, no manual scheduling, no cron job. The build does everything.

## Future additions (beyond the first 25)

Suggested topics for weeks 26–50:

- "Canadian Customs Bonded Warehouses: When They Save You Money"
- "Transfer Pricing for Cross-Border Trade"
- "Free Trade Zones in Canada"
- "US IOR vs Canadian IOR: Which Should You Be?"
- "Export Controls for Canadian Businesses"
- "Duty Drawback Claims: The 4-Year Window"
- "ACE vs CARM: Cross-Border Compliance for Dual-Country Operators"
- "AI and CBSA: How Algorithmic Audits Are Changing in 2027"
- "The True Cost of a Non-Resident Importer Setup"
- "Canadian Sales Tax for SaaS: The Digital Economy Tax Deep Dive"

Write them the same way as the first 25 — same data shape, same publishing cadence.
