/**
 * Single source of truth for per-route SEO metadata. Consumed by:
 *   - script/generateSeoFiles.ts   (sitemap.xml / robots.txt)
 *   - script/prerender.ts          (static per-route HTML shells)
 *   - script/generateRss.ts        (RSS feed)
 *
 * Keep in sync with the wouter route table in client/src/App.tsx and the
 * `usePageMeta` calls inside each page component.
 *
 * Blog posts are merged in automatically from client/src/data/blog/posts.ts —
 * no need to add them manually. Only posts with publishDate <= today are
 * included.
 */
import { getPublishedPosts } from "../client/src/data/blog/posts";

export interface RouteMeta {
  path: string;
  /** For sitemap priority (0–1 string). */
  priority: string;
  /** For sitemap changefreq. */
  changefreq?: string;
  /** If false, the route is excluded from sitemap.xml but still prerendered. */
  sitemap?: boolean;
  /** Per-page meta tags — drive both prerender and the client hook. */
  title: string;
  description: string;
  ogImage?: string;
}

const SITE = "https://www.accesstonorth.com";
const DEFAULT_OG = `${SITE}/og-image.png`;

export const SITE_URL = SITE;

const STATIC_ROUTES: RouteMeta[] = [
  {
    path: "/",
    priority: "1.0",
    changefreq: "weekly",
    title: "AccessToNorth.com — Canadian GST/HST & Business Registration",
    description:
      "Flat-fee Canadian business registration. GST/HST, Business Numbers, CARM, customs clearance, and non-resident compliance. From CA$99. 5–10 business days.",
  },
  {
    path: "/services",
    priority: "0.9",
    changefreq: "monthly",
    title: "Services | AccessToNorth.com",
    description:
      "Canadian business registration, GST/HST, CARM, customs clearance, HS classification, export declarations, and import compliance services. Flat-rate pricing.",
  },
  {
    path: "/pricing",
    priority: "0.9",
    changefreq: "weekly",
    title: "Pricing | AccessToNorth.com",
    description:
      "All-in fees from CA$99. One-time payment, no subscriptions, no surprise invoices. Bundles available. Satisfaction guaranteed.",
  },
  {
    path: "/about",
    priority: "0.6",
    changefreq: "monthly",
    title: "About | AccessToNorth.com",
    description:
      "Canadian business registration and customs setup firm serving residents and non-residents. CRA-authorized representation, flat-fee pricing, and a satisfaction guarantee.",
  },
  {
    path: "/contact",
    priority: "0.6",
    changefreq: "monthly",
    title: "Contact | AccessToNorth.com",
    description:
      "Call, email, or live chat with our Canadian trade and tax registration team. Mon–Fri, 9 a.m.–6 p.m. ET.",
  },
  {
    path: "/faq",
    priority: "0.7",
    changefreq: "monthly",
    title: "Frequently Asked Questions | AccessToNorth.com",
    description:
      "Answers to common questions about GST/HST registration, Business Numbers, CARM, non-resident compliance, customs clearance, and HS classification in Canada.",
  },
  {
    path: "/tools",
    priority: "0.7",
    changefreq: "monthly",
    title: "Free Trade Tools | AccessToNorth.com",
    description:
      "Free tools for Canadian importers and exporters: HS code finder, duty calculator, CARM security calculator, container planner, and more.",
  },
  {
    path: "/resources",
    priority: "0.7",
    changefreq: "weekly",
    title: "Resources | AccessToNorth.com",
    description:
      "Practical guides for Canadian importers and exporters: CARM, GST/HST, HS codes, Incoterms, customs clearance, CFIA, and more.",
  },

  // Services
  {
    path: "/services/business-number-bn",
    priority: "0.8",
    title: "Business Number (BN) Registration | AccessToNorth.com",
    description:
      "Register for a CRA Business Number (BN) quickly and correctly. Required for GST/HST, payroll, import/export, and corporate tax accounts. From CA$99.",
  },
  {
    path: "/services/gst-hst-registration",
    priority: "0.8",
    title: "GST/HST Registration Canada | AccessToNorth.com",
    description:
      "Complete GST/HST registration with the CRA. Includes Business Number, filing guidance, and compliance review. Flat fee CA$249. No hidden costs.",
  },
  {
    path: "/services/customs-clearance-canada",
    priority: "0.8",
    title: "Canadian Customs Clearance | AccessToNorth.com",
    description:
      "Flat-rate commercial customs clearance into Canada. LVS, commercial, and compliance packages for Canadian and non-resident importers.",
  },
  {
    path: "/services/import-compliance-review",
    priority: "0.7",
    title: "Import Compliance Review | AccessToNorth.com",
    description:
      "Comprehensive audit of your Canadian import operations — tariff classification, valuation, origin, and SIMA exposure.",
  },
  {
    path: "/services/hs-code-classification-canada",
    priority: "0.8",
    title: "HS Code Classification Canada | AccessToNorth.com",
    description:
      "Accurate Canadian tariff classification to avoid penalties and overpayment. Single-line from CA$95 or bulk packages available.",
  },
  {
    path: "/services/carm-registration-canada",
    priority: "0.8",
    title: "CARM Portal Registration | AccessToNorth.com",
    description:
      "End-to-end CARM registration for Canadian importers. BN setup, RM import account, portal onboarding, and delegate management.",
  },
  {
    path: "/services/rpp-bond-coordination",
    priority: "0.7",
    title: "RPP / Customs Bond Coordination | AccessToNorth.com",
    description:
      "Release Prior to Payment program enrollment and surety bond coordination with CBSA. Keep your imports moving without cash-flow hits.",
  },
  {
    path: "/services/b13-export-declaration",
    priority: "0.7",
    title: "B13 Export Declaration | AccessToNorth.com",
    description:
      "Canadian Export Declaration (B13) filing for goods leaving Canada over CA$2,000. CERS submission handled end-to-end.",
  },
  {
    path: "/services/non-resident-importer-canada",
    priority: "0.8",
    title: "Non-Resident Importer Services Canada | AccessToNorth.com",
    description:
      "Complete NRI setup for foreign businesses selling in Canada. GST/HST registration, BN setup, CARM onboarding, and simplified regime compliance.",
  },

  // Tools
  {
    path: "/tools/hs-code-finder",
    priority: "0.7",
    title: "HS Code Finder — Canadian Tariff Lookup | AccessToNorth.com",
    description:
      "Search Canadian HS codes by keyword. Find the right 10-digit classification for your product with duty rates and descriptions.",
  },
  {
    path: "/customs-calculator",
    priority: "0.7",
    title: "Canadian Customs Duty & Tax Calculator | AccessToNorth.com",
    description:
      "Estimate Canadian duty, GST, and PST on your imports. Free online calculator for Canadian importers.",
  },
  {
    path: "/carm-security-calculator",
    priority: "0.7",
    title: "CARM Financial Security Calculator | AccessToNorth.com",
    description:
      "Calculate your required RPP security amount for CARM enrollment. Get an estimate based on your monthly duty and tax exposure.",
  },
  {
    path: "/tools/container-calculator",
    priority: "0.6",
    title: "Container Load Calculator | AccessToNorth.com",
    description:
      "Plan cargo loading in 20', 40', and 40' HC containers. 3D visualization with weight and volume optimization.",
  },
  {
    path: "/tools/truck-load-planner",
    priority: "0.6",
    title: "Truck Load Planner | AccessToNorth.com",
    description:
      "Plan truckload cargo with capacity, weight, and stacking constraints. Free for Canadian shippers.",
  },
  {
    path: "/tools/freight-quote",
    priority: "0.5",
    title: "Freight Quote Tool | AccessToNorth.com",
    description: "Get a shipping rate estimate for your Canadian imports and exports.",
  },
  {
    path: "/tools/shipment-tracking",
    priority: "0.5",
    title: "Shipment Tracking | AccessToNorth.com",
    description: "Track your Canadian import and export shipments in real time.",
  },

  // Resources
  {
    path: "/resources/how-to-import-into-canada",
    priority: "0.7",
    title: "How to Import Into Canada — Step-by-Step Guide | AccessToNorth.com",
    description:
      "Complete guide to importing goods into Canada. Business Number, CARM registration, customs clearance, HS codes, duties, and compliance requirements explained.",
  },
  {
    path: "/resources/customs-clearance-under-2500",
    priority: "0.7",
    title: "LVS Customs Clearance Under CA$2,500 | AccessToNorth.com",
    description:
      "How low-value shipments (LVS) under CA$2,500 are cleared through Canadian customs. Simplified process, documentation requirements, and when you still need a broker.",
  },
  {
    path: "/resources/what-is-sima-duty",
    priority: "0.7",
    title: "What Is SIMA Duty? Anti-Dumping & Countervailing Duties | AccessToNorth.com",
    description:
      "Understand SIMA duties in Canada — anti-dumping and countervailing measures that protect Canadian industries. Learn when they apply and how to check your products.",
  },
  {
    path: "/resources/what-is-carm",
    priority: "0.7",
    title: "What Is CARM? CBSA Assessment and Revenue Management | AccessToNorth.com",
    description:
      "Everything importers need to know about CARM — the CBSA's new portal for duties, taxes, and trade compliance. Registration requirements and deadlines explained.",
  },
  {
    path: "/resources/hs-code-vs-tariff-treatment",
    priority: "0.7",
    title: "HS Code vs. Tariff Treatment — What's the Difference? | AccessToNorth.com",
    description:
      "Understanding the difference between HS code classification and tariff treatment in Canadian customs. How trade agreements affect your duty rate.",
  },
  {
    path: "/resources/incoterms-for-canadian-importers",
    priority: "0.7",
    title: "Incoterms for Canadian Importers — FOB, CIF, DDP Explained | AccessToNorth.com",
    description:
      "How Incoterms like FOB, CIF, EXW, and DDP affect Canadian importers. Learn which shipping terms determine your duty, insurance, and delivery responsibilities.",
  },
  {
    path: "/resources/fcl-vs-lcl-cost-comparison",
    priority: "0.7",
    title: "FCL vs. LCL Shipping — Cost Comparison for Canadian Importers | AccessToNorth.com",
    description:
      "Full container load vs. less-than-container load shipping to Canada. Compare costs, transit times, and when each option makes sense for your imports.",
  },
  {
    path: "/resources/b13-export-declaration-explained",
    priority: "0.7",
    title: "B13 Export Declaration — When and How to File | AccessToNorth.com",
    description:
      "Canadian Export Declaration (B13) explained. When it's required, how to file through CERS, and penalties for non-compliance on goods leaving Canada.",
  },
  {
    path: "/resources/when-do-you-need-cfia-approval",
    priority: "0.7",
    title: "CFIA Import Permits — When Do You Need Approval? | AccessToNorth.com",
    description:
      "Which imports require Canadian Food Inspection Agency (CFIA) permits? Food, plants, animals, and regulated products that need pre-clearance before entering Canada.",
  },

  // Legal
  {
    path: "/terms",
    priority: "0.3",
    title: "Terms of Service | AccessToNorth.com",
    description: "Terms of service for AccessToNorth.com.",
  },
  {
    path: "/privacy",
    priority: "0.3",
    title: "Privacy Policy | AccessToNorth.com",
    description: "Privacy policy for AccessToNorth.com.",
  },
  {
    path: "/refunds",
    priority: "0.3",
    title: "Refund Policy | AccessToNorth.com",
    description: "Refund policy for AccessToNorth.com services.",
  },
].map((r) => ({ ogImage: DEFAULT_OG, ...r } as RouteMeta));

/**
 * The full route list — static pages + published blog posts.
 * Computed lazily so unpublished blog posts (future publishDate) are
 * automatically excluded at generation time.
 */
export const ROUTES: RouteMeta[] = [
  ...STATIC_ROUTES,
  {
    path: "/blog",
    priority: "0.8",
    changefreq: "weekly",
    title: "Blog — Canadian Trade & Tax Insights | AccessToNorth.com",
    description:
      "Practical, no-fluff guides on Canadian GST/HST registration, CARM, customs clearance, HS classification, and non-resident trade compliance. Updated weekly.",
    ogImage: DEFAULT_OG,
  },
  ...getPublishedPosts().map((post): RouteMeta => ({
    path: `/blog/${post.slug}`,
    priority: "0.7",
    changefreq: "monthly",
    title: post.metaTitle,
    description: post.metaDescription,
    ogImage: post.heroImageUrl ?? `${SITE}/blog/${post.slug}.svg`,
  })),
];

export const DISALLOW = [
  "/admin",
  "/admin/",
  "/portal",
  "/portal/",
  "/checkout",
  "/complete-order",
  "/payment-success",
  "/payment-cancel",
  "/api/",
];
