import type { BlogPost } from "./types";

const TEAM = { name: "AccessToNorth Team", role: "Trade & Tax Specialists" };

/**
 * Blog post registry. Publish dates drive visibility — posts with a
 * publishDate in the future are hidden from the index, sitemap, and RSS
 * feed (but the URL works if visited directly, so you can preview).
 *
 * Ordering inside this file is publish date ascending. Keep it that way
 * for readability.
 */
export const POSTS: BlogPost[] = [
  // ============================================================
  // WEEK 1 — 2026-04-20 (launch post, published before schedule starts)
  // ============================================================
  {
    slug: "register-gst-hst-non-resident-canada",
    title: "How to Register for GST/HST as a Non-Resident in Canada",
    metaTitle: "How to Register for GST/HST as a Non-Resident (2026) | AccessToNorth.com",
    metaDescription:
      "Step-by-step guide to registering for Canadian GST/HST as a non-resident business in 2026. Eligibility, simplified regime, required documents, and timelines.",
    publishDate: "2026-04-20",
    category: "registration-tax",
    tags: ["non-resident gst hst", "simplified regime", "canadian sales tax", "cra registration"],
    author: TEAM,
    readingTime: 7,
    intro:
      "If your business sells taxable goods or services to Canadian customers and you don't have a physical presence in Canada, you're almost certainly required to register for GST/HST. The rules changed substantially in 2021 and tightened again in 2024 — here's exactly how registration works in 2026, what documents you need, and what to expect from the CRA.",
    keyTakeaways: [
      "Non-residents selling digital services, physical goods, or marketplace sales to Canadian consumers generally must register",
      "The CRA offers two regimes: full (normal) registration and the simplified regime for digital/remote sellers",
      "You need a Business Number (BN) before you can open a GST/HST account",
      "Registration takes 5–15 business days once the right forms are filed",
      "Once registered, returns are typically quarterly for under CA$1.5M revenue, monthly above that",
    ],
    sections: [
      {
        heading: "Who must register",
        body: [
          "Canada's GST/HST legislation captures non-residents under three primary tests: (1) you carry on business in Canada, (2) you sell to Canadian consumers via a marketplace or directly, or (3) you operate a digital economy business (SaaS, streaming, e-books, online courses) with Canadian customers.",
          "If your worldwide taxable supplies to Canadian consumers exceed CA$30,000 in four consecutive calendar quarters, registration is mandatory. Below that threshold you can register voluntarily to claim Input Tax Credits.",
        ],
      },
      {
        heading: "Simplified vs normal registration",
        body: [
          "The simplified regime is designed for non-resident digital sellers and marketplace operators who supply digital products or services, short-term accommodation, or goods sold via a distribution platform. It's lighter — no ITCs, quarterly filing in CAD, no need for a Canadian bank account.",
          "The normal regime gives you ITC recovery on Canadian business expenses (useful if you pay Canadian freight, storage, or agency fees) but requires a CA bank account and full records retention.",
        ],
        note: "Pick normal registration if you'll incur Canadian input costs. Pick simplified if you're a pure digital seller with no Canadian operating expenses.",
      },
      {
        heading: "What you need to apply",
        list: [
          "Legal entity name, registered address, and incorporation number in your home country",
          "Proof of business activity — website, invoices, or marketplace listings",
          "Authorized representative contact (you, or us) with ID",
          "Projected annual Canadian revenue and industry (NAICS code)",
          "For normal registration: Canadian bank account details and a T2062 if you have property in Canada",
        ],
      },
      {
        heading: "Timeline and what to expect",
        body: [
          "After submission, the CRA typically assigns a BN within 3–5 business days and the GST/HST account within another 5–10. You'll receive your 15-character account number (e.g. 12345 6789 RT0001) by mail to the authorized representative's address.",
          "First return is due one month after the end of your first reporting period. Quarterly filers get CA$5K+ typical first returns; set a calendar reminder because late-filing penalties start at 1% of the net tax owed plus 0.25% per month.",
        ],
      },
      {
        heading: "Common mistakes non-residents make",
        list: [
          "Registering for a BN but forgetting to open the RT (GST/HST) program account — the BN alone doesn't authorize tax collection",
          "Charging tax before the effective date of registration — CRA will demand refunds to customers",
          "Picking the simplified regime when you have Canadian input costs you could ITC-recover",
          "Missing the first filing deadline because the letter went to the wrong address",
        ],
      },
    ],
    relatedPosts: [
      "canada-30000-rule-gst-hst",
      "voluntary-vs-mandatory-gst-hst",
      "non-resident-amazon-fba-canada",
    ],
    heroImage: {
      subject: "A globe with Canadian provinces highlighted and a stylized CRA/tax form overlay",
      style: "flat illustration, blue + maple-leaf-red accent, clean vector",
      alt: "Illustration of global trade with Canadian tax registration paperwork",
    },
  },

  // ============================================================
  // WEEK 2 — 2026-05-04
  // ============================================================
  {
    slug: "canada-30000-rule-gst-hst",
    title: "Canada's $30,000 Rule: When to Register for GST/HST",
    metaTitle: "Canada's CA$30,000 GST/HST Threshold Explained | AccessToNorth.com",
    metaDescription:
      "Everything you need to know about Canada's CA$30,000 small-supplier threshold for GST/HST — how the four-quarter test works, when registration becomes mandatory, and why voluntary registration often saves money.",
    publishDate: "2026-05-04",
    category: "registration-tax",
    tags: ["30000 threshold", "small supplier canada", "gst hst threshold", "when to register"],
    author: TEAM,
    readingTime: 6,
    intro:
      "The CA$30,000 small-supplier threshold is the most misunderstood rule in Canadian sales tax. Most business owners think \"I haven't hit $30k so I'm fine\" — but the test isn't annual, it's rolling four quarters, and the day you cross it you're on the hook for GST/HST on everything from then on. Here's how the rule actually works.",
    keyTakeaways: [
      "The threshold is CA$30,000 in worldwide taxable supplies over any four consecutive calendar quarters",
      "Cross it once and registration becomes mandatory on the 30th day after the trigger",
      "If you exceed it in a single quarter, you're registered retroactively — the whole quarter counts as taxable",
      "Voluntary registration below the threshold lets you claim Input Tax Credits",
      "Taxi, ride-share, and commercial ride-hailing drivers must register regardless of revenue",
    ],
    sections: [
      {
        heading: "How the four-quarter test works",
        body: [
          "CRA measures the threshold on a rolling four-quarter basis. Every time you add a quarter of revenue, you compare the trailing four quarters against CA$30,000. The instant cumulative worldwide taxable supplies cross that line, you're no longer a small supplier.",
          "This is why businesses that operate seasonally or have one big-invoice quarter can trip the threshold unexpectedly. A slow Q3 followed by a Q4 with a CA$35,000 contract puts you over the line even if annual revenue is only CA$45,000.",
        ],
      },
      {
        heading: "The single-quarter trap",
        body: [
          "There's a second trigger most people miss: if in ANY single calendar quarter your taxable supplies exceed CA$30,000 by themselves, you lose small-supplier status immediately — effective from the moment of the sale that put you over.",
          "Practical effect: that CA$30,000 sale is itself taxable, and you owe GST/HST on it. If you didn't collect tax at the invoice, you have to go back to the customer for it or absorb it yourself.",
        ],
        note: "One-time spike sales are the classic 'surprise registration' scenario. A consulting engagement that pays CA$40K in a single quarter puts you on the GST/HST treadmill from day one of that quarter.",
      },
      {
        heading: "Why register voluntarily below the threshold",
        body: [
          "If you're under CA$30,000 you CAN register anyway, and there are three good reasons to do it: (1) you can claim Input Tax Credits on business expenses (software, equipment, professional fees), (2) it signals credibility to B2B Canadian clients who expect GST/HST on their invoices, (3) it avoids the retroactive trigger risk.",
          "The trade-off is you now charge tax on every invoice, file quarterly returns, and maintain proper records. For most B2B operators, the ITC savings alone justify it.",
        ],
      },
      {
        heading: "What counts toward the threshold",
        list: [
          "Taxable sales of goods and services to Canadian customers (zero-rated + taxable = both count)",
          "Worldwide taxable supplies if you are a resident; Canadian-sourced only if you are a non-resident under simplified regime",
          "Sales through marketplaces when you are the supplier of record",
          "Reimbursements, late fees, and other amounts included in the 'consideration' for a supply",
        ],
      },
      {
        heading: "What does NOT count",
        list: [
          "Exempt supplies (most financial services, residential rents, certain healthcare)",
          "Capital property sales (separate rules apply, but outside the $30K test)",
          "Supplies made by your employees when acting as your employees",
          "Supplies outside Canada with no Canadian connection",
        ],
      },
    ],
    relatedPosts: [
      "register-gst-hst-non-resident-canada",
      "voluntary-vs-mandatory-gst-hst",
      "gst-hst-missed-deadline-penalties",
    ],
    heroImage: {
      subject: "Line chart crossing a CA$30,000 threshold with a CRA seal watermark",
      style: "editorial infographic, blue + gold accent, modern flat design",
      alt: "Chart illustrating the CA$30,000 GST/HST small-supplier threshold",
    },
  },

  // ============================================================
  // WEEK 3 — 2026-05-11
  // ============================================================
  {
    slug: "do-i-need-canadian-business-number-checklist",
    title: "Do I Need a Canadian Business Number? A 5-Question Checklist",
    metaTitle: "Do I Need a Canadian Business Number? 5-Question Checklist | AccessToNorth.com",
    metaDescription:
      "Five quick questions that tell you whether you need a CRA Business Number — for incorporated companies, sole proprietors, non-residents, and importers.",
    publishDate: "2026-05-11",
    category: "registration-tax",
    tags: ["business number", "cra bn", "who needs a business number", "bn canada"],
    author: TEAM,
    readingTime: 5,
    intro:
      "The 9-digit Business Number (BN) is the foundation for every CRA account you'll ever hold — GST/HST, payroll, corporate income tax, import/export. You don't need one to exist as a business, but the moment you do almost anything taxable with the CRA, you need one. Here's a 5-question test to find out.",
    keyTakeaways: [
      "The BN is a 9-digit identifier assigned by the CRA for all tax matters",
      "You need one if you register for GST/HST, have employees, import commercially, or incorporate federally/provincially (some cases)",
      "Sole proprietors without payroll or GST/HST often don't need one",
      "Non-residents importing into Canada or selling taxable supplies must have one",
      "BN applications take 3–5 business days for straightforward cases",
    ],
    sections: [
      {
        heading: "Question 1 — Are you selling taxable goods or services to Canadian customers?",
        body: "If yes AND your worldwide taxable supplies exceed CA$30,000 over four consecutive quarters, you must register for GST/HST — which requires a BN. If you're under the threshold but want to voluntarily register, same answer: you need a BN.",
      },
      {
        heading: "Question 2 — Do you have employees in Canada?",
        body: "If you pay wages to anyone in Canada, you need to open a Payroll program account (RP0001 extension). That requires a BN. This applies even if you're a non-resident employer of record — the CRA's payroll remittance obligations don't care about your tax residency.",
      },
      {
        heading: "Question 3 — Will you import goods commercially into Canada?",
        body: "Yes → BN required, specifically with an import/export program account (RM0001). CBSA requires this number on every commercial release, and under CARM you can't onboard without it.",
        note: "Courier LVS imports below CA$2,500 where the courier acts as importer of record don't require you to have a BN. Everything above that or with a formal entry does.",
      },
      {
        heading: "Question 4 — Are you operating as a corporation?",
        body: "Federally incorporated corporations are automatically assigned a BN at registration. Provincially incorporated corporations in most provinces also get one. If you're a sole proprietor or partnership, incorporation ISN'T what triggers the BN need — it's the activities above.",
      },
      {
        heading: "Question 5 — Do you file Canadian corporate income tax?",
        body: "If your corporation is Canadian-resident or has a permanent establishment in Canada, you need an RC (corporate income tax) account extension, which requires a BN. Non-resident corporations with no Canadian PE but with Canadian-source income may still need to file — and therefore still need a BN — but the specifics depend on the tax treaty with your home country.",
      },
    ],
    relatedPosts: [
      "register-gst-hst-non-resident-canada",
      "canada-30000-rule-gst-hst",
      "voluntary-vs-mandatory-gst-hst",
    ],
    heroImage: {
      subject: "Decision-tree flowchart with CRA BN logo and five diamond nodes",
      style: "clean vector infographic, blue on light background",
      alt: "Flowchart showing five questions to determine if you need a Canadian Business Number",
    },
  },

  // ============================================================
  // WEEK 4 — 2026-05-18
  // ============================================================
  {
    slug: "voluntary-vs-mandatory-gst-hst",
    title: "Voluntary vs. Mandatory GST/HST Registration: Which Is Right for You?",
    metaTitle: "Voluntary vs Mandatory GST/HST Registration Explained | AccessToNorth.com",
    metaDescription:
      "When does voluntary GST/HST registration make sense? A straight comparison of voluntary vs mandatory registration — ITC recovery, compliance burden, and cash-flow impact.",
    publishDate: "2026-05-18",
    category: "registration-tax",
    tags: ["voluntary gst hst registration", "mandatory registration", "itc recovery", "input tax credits"],
    author: TEAM,
    readingTime: 6,
    intro:
      "Registration is mandatory once you cross CA$30,000 in taxable supplies. But thousands of Canadian small businesses register voluntarily while they're still under the threshold — and it usually saves them money. Here's how to tell if you should.",
    keyTakeaways: [
      "Voluntary registration is allowed as soon as you have or intend to have a commercial activity",
      "ITC recovery is the #1 reason to register early — you can claim tax back on business expenses",
      "The compliance cost is a quarterly return plus bookkeeping that tracks GST/HST separately",
      "Once voluntarily registered you must stay registered for at least 1 year before deregistering",
      "B2B businesses almost always benefit from voluntary registration; B2C depends on whether your customers can claim the tax back",
    ],
    sections: [
      {
        heading: "The core math: ITC recovery",
        body: [
          "When you're registered, every business expense you pay that includes GST/HST becomes recoverable as an Input Tax Credit. A CA$10,000 software subscription attracts CA$500 in HST (Ontario). Registered, you recover that $500. Unregistered, you eat it.",
          "For a growing business spending CA$50K–200K/year on Canadian taxable inputs, the recoverable tax is CA$2,500–10,000. The registration and filing cost is well under that — usually a few hundred dollars a year in bookkeeping time.",
        ],
      },
      {
        heading: "The downside: you must charge tax on every invoice",
        body: [
          "Once registered, you charge GST/HST on every taxable sale. For B2B customers who are themselves registered, this is a wash — they recover the tax you charged as their own ITC.",
          "For B2C customers who are NOT registered (consumers, exempt-sector buyers), your prices effectively go up by 5–15% or you absorb the tax from your margin. This is where registration hurts: consumer-facing businesses often delay registration until they legally must.",
        ],
      },
      {
        heading: "When voluntary is a clear YES",
        list: [
          "B2B business — your customers are other registered businesses",
          "You're incurring material Canadian input costs (software, freight, storage, professional fees)",
          "You expect to cross CA$30,000 within 6–12 months anyway",
          "You want to appear more established to enterprise clients who expect GST/HST on invoices",
          "You're building up to import activity — you'll need a BN and tax accounts either way",
        ],
      },
      {
        heading: "When voluntary is a clear NO",
        list: [
          "Your customers are consumers who would balk at higher prices",
          "Your margins are thin and absorbing the tax would wipe them out",
          "Your input costs are mostly outside Canada (no ITC to recover)",
          "You're a hobby business testing product-market fit",
        ],
      },
      {
        heading: "The 1-year lock-in",
        body: "Once you register voluntarily, you must stay registered for at least one full year before you can apply to cancel. Plan accordingly — don't register for one big ITC claim and assume you can deregister.",
        note: "Deregistration isn't automatic. You file a cancellation form, and the CRA may claw back ITCs if the decision looks strategic rather than commercial.",
      },
    ],
    relatedPosts: [
      "register-gst-hst-non-resident-canada",
      "canada-30000-rule-gst-hst",
      "do-i-need-canadian-business-number-checklist",
    ],
    heroImage: {
      subject: "Split-screen balance showing CRA forms on one side, recovered-tax dollars on the other",
      style: "minimalist illustration, blue/green accent",
      alt: "Balance scale weighing voluntary GST/HST registration against mandatory",
    },
  },

  // ============================================================
  // WEEK 5 — 2026-05-25
  // ============================================================
  {
    slug: "non-resident-amazon-fba-canada",
    title: "Non-Resident Taxes for US Amazon FBA Sellers: 2026 Update",
    metaTitle: "Non-Resident Taxes for US Amazon FBA Sellers (2026) | AccessToNorth.com",
    metaDescription:
      "What US Amazon sellers need to know about Canadian taxes, import accounts, and CARM when using Amazon FBA Canada. Business Number, GST/HST, and duty drawback explained.",
    publishDate: "2026-05-25",
    category: "ecommerce-non-resident",
    tags: ["amazon fba canada", "non-resident importer", "us seller canada", "fba tax"],
    author: TEAM,
    readingTime: 7,
    intro:
      "Amazon FBA Canada looks simple from the seller dashboard: ship pallets to an Amazon warehouse, let them distribute. In reality, the moment your inventory crosses the border you become an importer of record — with Canadian sales tax obligations, a CARM account, and potentially an RPP bond. Here's what every US-based FBA seller needs in 2026.",
    keyTakeaways: [
      "Amazon Canada sellers are the importer of record — Amazon does not clear your goods for you at scale",
      "You need a BN, GST/HST, and an import (RM) account with CBSA before your first shipment",
      "CARM onboarding and financial security are mandatory even if you're fully non-resident",
      "Amazon collects marketplace tax on B2C sales; you may still owe GST/HST on B2B sales and inputs",
      "Duty drawback is available on goods that leave Canada without being sold here",
    ],
    sections: [
      {
        heading: "The three accounts you need before shipment",
        body: [
          "Business Number (BN) with RC (corporate tax) and RT (GST/HST) extensions, plus an RM (import/export) extension. All three are issued by the CRA but have different forms and can sometimes be consolidated in a single application if you're strategic.",
          "Without the RM extension on your BN, CBSA will not let your commercial shipment clear. Amazon does NOT cover this — you own it.",
        ],
      },
      {
        heading: "CARM onboarding as a non-resident",
        body: [
          "Since 2024 every commercial importer must onboard through the CARM Client Portal. Non-residents face an extra step: you need a Canadian authorized representative with a valid Canadian identity to claim the business account inside CARM. Most non-resident sellers use their customs broker or a compliance firm for this.",
          "Once claimed, you post financial security — either cash (CA$5,000 minimum), a customs bond (CA$25,000+ face), or enroll in the Release Prior to Payment program. Without security, your shipments are held at the border.",
        ],
        note: "Plan CARM onboarding to finish at least 10 business days BEFORE your first FBA shipment. Delays at the border cost real money in storage + demurrage.",
      },
      {
        heading: "Marketplace tax collection — what Amazon does and doesn't cover",
        body: [
          "Since 2021, Amazon collects GST/HST on B2C sales to Canadian consumers and remits it directly to the CRA. You DON'T charge tax on those sales in your pricing.",
          "What Amazon does NOT cover: B2B sales where your customer requires a tax invoice in their name, wholesale/bulk sales outside the marketplace, and — importantly — the GST/HST you pay on your own Canadian input costs (Amazon fees, fulfillment fees, storage). If you want to recover that tax via ITC, YOU must be registered for GST/HST yourself.",
        ],
      },
      {
        heading: "Duty drawback on returned or re-exported inventory",
        body: [
          "If inventory enters Canada, gets stored at FBA, and then leaves Canada (sold to a US buyer via cross-border FBA, returned to you, disposed of) you paid duty on import that you can get back via a duty drawback claim.",
          "Drawback claims must be filed within 4 years of the original import. Most FBA sellers don't bother because the paperwork is onerous — but for high-duty categories (apparel, footwear) the drawback amounts are material and we recommend claiming.",
        ],
      },
      {
        heading: "Common compliance traps",
        list: [
          "Shipping before CARM security is posted — shipment held, CA$100+/day storage",
          "Using Amazon's FBA program without a BN — CBSA catches this on the import entry",
          "Assuming Amazon's marketplace tax covers your own ITC recovery (it doesn't)",
          "Missing the HS classification on the commercial invoice — Amazon forwarders use a default code that often overpays duty",
        ],
      },
    ],
    relatedPosts: [
      "ddp-vs-dap-ecommerce-canada",
      "shipping-us-to-canada-2026-costs",
      "shopify-canada-tax-duty-guide",
    ],
    heroImage: {
      subject: "Amazon Canada warehouse with pallets and a Canadian customs officer silhouette",
      style: "semi-realistic illustration, muted industrial palette",
      alt: "Non-resident Amazon FBA seller shipping inventory into a Canadian warehouse",
    },
  },

  // ============================================================
  // WEEK 6 — 2026-06-01
  // ============================================================
  {
    slug: "gst-hst-missed-deadline-penalties",
    title: "What Happens If You Miss a GST/HST Filing Deadline",
    metaTitle: "Missed GST/HST Deadline? Penalties & Fixes (2026) | AccessToNorth.com",
    metaDescription:
      "What the CRA does when you miss a GST/HST return — late-filing penalties, interest rates, voluntary disclosures, and how to catch up without triggering an audit.",
    publishDate: "2026-06-01",
    category: "registration-tax",
    tags: ["missed gst hst deadline", "late filing penalty", "cra interest", "voluntary disclosure"],
    author: TEAM,
    readingTime: 6,
    intro:
      "Missing a GST/HST return isn't the end of the world — but the penalties compound fast and the CRA's automated systems flag repeat offenders for audit. If you've just noticed you missed a deadline, here's exactly what the CRA will do, what it'll cost you, and how to minimize damage.",
    keyTakeaways: [
      "Late-filing penalty: 1% of net tax owing plus 0.25% per month (max 12 months), capped at 15%",
      "Interest accrues at the CRA's prescribed rate — roughly 10% annually in 2026",
      "Three or more late filings in four years triggers 'repeat failure' penalty: 2% + 2%/month (max 20%)",
      "File the missed return before CRA contacts you — that's your best cost-minimization lever",
      "For unreported tax, the Voluntary Disclosures Program can eliminate penalties if you qualify",
    ],
    sections: [
      {
        heading: "What the CRA does on day 1 after the deadline",
        body: [
          "The CRA's systems flag your file the moment the return is late. You don't get an immediate letter — the first automated notice typically goes out 30–60 days after the due date.",
          "Interest starts accruing immediately on any net tax owing from the day after the due date. If you're in a refund position, no interest accrues and the filing-late penalty is typically CA$0 (but the repeat-failure rule can still trigger on pattern).",
        ],
      },
      {
        heading: "Penalty calculation — worked example",
        body: [
          "Say you owe CA$10,000 in net tax on a return due March 31 and you file July 15 (about 3.5 months late). The late-filing penalty is 1% + (3 × 0.25%) = 1.75% of CA$10,000 = CA$175.",
          "Plus interest at ~10% annually on the unpaid tax from April 1 until payment: about CA$300. Total damage: ~CA$475. Not great, but not ruinous — provided it's a one-off.",
        ],
      },
      {
        heading: "The repeat-failure escalation",
        body: [
          "The cost multiplies if you have a history. If CRA has assessed a late-filing penalty on any of your last three GST/HST returns (or any of the prior four years), the next one triggers the 'repeat failure' rule: 2% plus 2% per month, capped at 20% of net tax owing.",
          "On our CA$10,000 example under repeat-failure, same 3.5-month delay = 2% + (3 × 2%) = 8% = CA$800 in penalty alone, not counting interest.",
        ],
        note: "One late return costs you a few hundred dollars. Four late returns in a row can cost you 20% of the tax owing on every one. File on time, even if you can't pay — the penalty is on the filing, not the payment.",
      },
      {
        heading: "Voluntary Disclosures Program — when it applies",
        body: [
          "If you didn't file AT ALL for several periods (not late filing — just never filed), the Voluntary Disclosures Program (VDP) can wipe out penalties and reduce interest if you come forward before the CRA contacts you.",
          "Four conditions: disclosure must be voluntary (before any CRA contact), complete (cover all years), involve a penalty, and include payment or a payment arrangement. Most non-resident sellers who realize mid-year they should have registered qualify.",
        ],
      },
      {
        heading: "What to do right now if you've missed a deadline",
        list: [
          "File the missed return today — even if you can't pay the tax in full, filing stops the late-filing clock",
          "Calculate and set aside the penalty + interest (expect 2–3% of net tax for a first offense within 3 months)",
          "Use CRA's pre-authorized debit to schedule payment — avoids missed payment interest",
          "If you missed multiple years, talk to a tax professional about VDP before CRA contacts you",
          "Set up recurring calendar reminders 5 days before every future deadline",
        ],
      },
    ],
    relatedPosts: [
      "register-gst-hst-non-resident-canada",
      "canada-30000-rule-gst-hst",
      "voluntary-vs-mandatory-gst-hst",
    ],
    heroImage: {
      subject: "Calendar with a red-circled past date and a rising dollar-sign chart beside it",
      style: "flat editorial, red + slate palette, clean icons",
      alt: "Illustration of a missed GST/HST filing deadline with escalating penalties",
    },
  },

  // ============================================================
  // WEEK 7 — 2026-06-08
  // ============================================================
  {
    slug: "carm-onboarding-checklist",
    title: "CARM Onboarding Checklist: Every Step in One Page",
    metaTitle: "CARM Onboarding Checklist — Every Step in One Page | AccessToNorth.com",
    metaDescription:
      "The complete CARM onboarding checklist: BN + RM account, GCKey/Sign-In Partner, portal claim, financial security, and broker delegation. No fluff.",
    publishDate: "2026-06-08",
    category: "carm-imports",
    tags: ["carm onboarding", "carm checklist", "cbsa portal", "carm steps"],
    author: TEAM,
    readingTime: 6,
    intro:
      "CARM onboarding looks intimidating because the CBSA documentation is 200+ pages. In practice it boils down to five discrete steps that must happen in order. Do them right the first time and you'll be cleared to import in 2–3 weeks; miss one and you'll get held at the border.",
    keyTakeaways: [
      "The 5 steps: BN/RM → GCKey → claim business account → post security → delegate broker",
      "The bottleneck is financial security — start that step first if you have a shipment incoming",
      "A Canadian authorized representative is required if you're non-resident",
      "Total timeline: 2–3 weeks for residents, 3–4 weeks for non-residents",
      "Every commercial importer needs this, including one-off importers and NRI model sellers",
    ],
    sections: [
      {
        heading: "Step 1 — Business Number + RM extension",
        body: [
          "If you don't already have a BN with the RM (import/export) program account, apply now. Form RC1 for residents; RC1 + BN-extension letter for non-residents. Processing: 3–5 business days for straightforward cases, 10+ for non-residents.",
          "Verify your full number looks like: 12345 6789 RM0001. The RM extension is what CBSA reads on every import entry.",
        ],
      },
      {
        heading: "Step 2 — GCKey or Sign-In Partner",
        body: [
          "You need a credential to log into the CARM Client Portal. GCKey is a Government of Canada identity — create one at gckey.gc.ca. Alternative: Sign-In Partner uses your existing Canadian online banking to authenticate.",
          "Non-residents typically use GCKey. Your authorized representative uses their own credential, not yours — CARM will link multiple users to one business account later.",
        ],
      },
      {
        heading: "Step 3 — Claim the business account in CARM",
        body: [
          "Log in to the CCP, choose 'link to my business', enter your BN + RM number, and answer a series of identity-verification questions drawn from your CRA records. Non-residents without a Canadian tax history use the alternative verification flow via their authorized representative.",
          "Once claimed, you're the Business Account Manager — you can invite other users (brokers, employees) into the account and set their permission level.",
        ],
        note: "Only ONE person can be the original Business Account Manager. Make sure it's someone stable at your company — transferring this role later is paperwork.",
      },
      {
        heading: "Step 4 — Post financial security",
        body: [
          "CBSA needs to know you can cover the duties and taxes on your imports. Choose one: (a) cash deposit (CA$5,000 minimum), (b) customs bond from a licensed surety (CA$25,000+ face, typical premium 1–3% annually), (c) Release Prior to Payment enrollment (RPP — released on security, settled monthly).",
          "Most importers pick a bond because it's cheaper than tying up cash. RPP enrollment is separate and highly recommended — without it, duty is payable at release which is a cash-flow nightmare.",
        ],
      },
      {
        heading: "Step 5 — Delegate your customs broker",
        body: [
          "Inside CARM, invite your broker by their BN and grant them the appropriate permissions (usually 'Edit' for your RM account). The broker accepts the delegation from their side and only then can they file release entries on your behalf.",
          "Without delegation, every entry gets rejected. This is the most common reason first-time importers get held at the border — they set up their account but forgot to invite the broker.",
        ],
      },
    ],
    relatedPosts: [
      "carm-bond-vs-cash-security",
      "rpp-program-explained",
      "delegating-customs-broker-carm",
    ],
    heroImage: {
      subject: "Numbered 5-step checklist with CBSA portal icons and a customs-form background",
      style: "clean infographic, CBSA red + slate palette",
      alt: "Five-step CARM onboarding checklist for Canadian importers",
    },
  },

  // ============================================================
  // WEEK 8 — 2026-06-15
  // ============================================================
  {
    slug: "carm-bond-vs-cash-security",
    title: "CARM Financial Security: Bond vs Cash Deposit Comparison",
    metaTitle: "CARM Bond vs Cash Security — Full Comparison (2026) | AccessToNorth.com",
    metaDescription:
      "Which CARM financial security option is cheapest? Full comparison of customs bonds, cash deposits, and RPP enrollment — premiums, minimums, and cash-flow impact.",
    publishDate: "2026-06-15",
    category: "carm-imports",
    tags: ["carm security", "customs bond canada", "rpp security", "cash deposit carm"],
    author: TEAM,
    readingTime: 6,
    intro:
      "CARM forces every commercial importer to post financial security — but the CBSA gives you three ways to do it, and the wrong choice can cost you thousands per year. Here's the unbiased comparison of customs bonds, cash deposits, and Release Prior to Payment.",
    keyTakeaways: [
      "Customs bond: lowest cost for most importers — annual premium 1–3% of face amount",
      "Cash deposit: simplest but ties up working capital, minimum CA$5,000",
      "RPP enrollment: mandatory if you want duty deferred until monthly settlement",
      "Security amount = 50% of your highest expected monthly duty & tax",
      "Minimums: CA$5,000 cash, CA$25,000 bond face (surety sets premium on face, not required security)",
    ],
    sections: [
      {
        heading: "How CBSA calculates the required amount",
        body: [
          "The CARM formula: estimate your highest expected monthly duty + GST exposure, multiply by 50%, that's your required security. Example: highest month is CA$20,000 in duty+tax → CA$10,000 security required.",
          "Underestimate and CBSA demands a top-up within 30 days — with late-security penalties. Overestimate and you're tying up extra capital (for cash) or paying an oversized bond premium. Use the CARM Security Calculator at /carm-security-calculator to get an honest estimate before picking an option.",
        ],
      },
      {
        heading: "Option A — Customs Bond",
        body: [
          "A customs bond is a guarantee from a licensed surety that CBSA can call on if you default. You pay an annual premium (1–3% of face, depending on your credit and industry) and get the full face amount available as security.",
          "Minimum face in the market is CA$25,000; on a CA$100,000 bond you'll pay CA$1,000–3,000/year in premium. No capital is tied up. This is what 90% of import-heavy operators choose.",
        ],
      },
      {
        heading: "Option B — Cash Deposit",
        body: [
          "Post cash or a certified cheque with CBSA for exactly the amount you need. Minimum CA$5,000. No premium, but the money is fully tied up — you can't use it for anything else while it's on deposit.",
          "Cash makes sense for (1) very low-volume importers where the bond premium is uneconomical vs the opportunity cost of tied capital, or (2) importers whose credit profile makes bond premiums high (>4%).",
        ],
        note: "One-time importers often pick cash and then forget to reclaim it. Set a calendar reminder to request the refund once your imports cease — you get your deposit back, but only if you ask.",
      },
      {
        heading: "Option C — Release Prior to Payment (RPP)",
        body: [
          "RPP is not a security option — it's a separate program that lets you take possession of goods BEFORE paying duty, then pay via monthly Statement of Account. You still post security (bond or cash) to enroll in RPP.",
          "Why it matters: without RPP, duty must be paid at release, which means your broker needs your cash ready at the moment of clearance. That's impossible to coordinate at scale. RPP + bond is the standard setup for active importers.",
        ],
      },
      {
        heading: "Cost comparison — 3 scenarios",
        list: [
          "Occasional importer (2 shipments/year, CA$8K total duty/tax): cash deposit CA$5K, zero premium — simplest",
          "Growing e-commerce seller (CA$10K/month duty): CA$5K security. Bond costs ~CA$50/year. Cash ties up CA$5K",
          "Established importer (CA$50K/month duty): CA$25K security. Bond costs ~CA$500/year. Cash ties up CA$25K",
        ],
      },
    ],
    relatedPosts: [
      "carm-onboarding-checklist",
      "rpp-program-explained",
      "carm-common-errors",
    ],
    heroImage: {
      subject: "Two stacks of coins — one labeled 'bond premium', taller one labeled 'tied-up cash' — with a CBSA flag",
      style: "clean editorial illustration, blue + gold palette",
      alt: "Comparison of customs bond premium vs cash deposit for CARM security",
    },
  },

  // ============================================================
  // WEEK 9 — 2026-06-22
  // ============================================================
  {
    slug: "rpp-program-explained",
    title: "Release Prior to Payment (RPP) Explained: Why You Need It",
    metaTitle: "What Is RPP? Release Prior to Payment Explained (2026) | AccessToNorth.com",
    metaDescription:
      "The Release Prior to Payment (RPP) program lets Canadian importers take possession of goods before paying duty — how it works, who qualifies, and how to apply.",
    publishDate: "2026-06-22",
    category: "carm-imports",
    tags: ["rpp", "release prior to payment", "monthly statement of account", "carm rpp"],
    author: TEAM,
    readingTime: 5,
    intro:
      "Without the Release Prior to Payment program, every Canadian import comes with a cash-flow crisis: duty must be paid at the moment of release, which means your broker needs your money in their trust account BEFORE the goods clear. For any business importing more than occasionally, this is unworkable. RPP fixes it — and it's simpler to enroll in than most people think.",
    keyTakeaways: [
      "RPP lets you take possession of goods at the border and pay duty/tax on a monthly Statement of Account",
      "Enrollment requires financial security (bond or cash) posted in CARM",
      "Payment is due by the last business day of the month following release",
      "The program applies across all your import accounts and all points of entry",
      "Almost every active Canadian importer uses RPP — without it, scale is impossible",
    ],
    sections: [
      {
        heading: "How non-RPP imports work",
        body: [
          "Without RPP, CBSA calculates duty and GST on your import entry and demands payment BEFORE release. Your customs broker either uses their own bond to front the money (for a fee) or asks you to wire the funds ahead of clearance.",
          "For predictable shipments this is manageable. For anything spot or seasonal, it's a constant coordination exercise and an operational bottleneck.",
        ],
      },
      {
        heading: "How RPP changes the timing",
        body: [
          "Under RPP, CBSA releases the goods on your financial security. The duty and tax is billed to you on the Statement of Account (SOA) generated on the 25th of the following month. You have until the last business day of that month to pay.",
          "Net effect: you get 25–55 days of float on duty payments, your broker doesn't need to front anything, and clearance speed is no longer gated on your ability to wire funds.",
        ],
      },
      {
        heading: "How to enroll",
        list: [
          "Complete CARM onboarding (claim your business account, post financial security)",
          "Inside the CCP, go to 'RPP Enrollment' and submit — this is a single form, not a separate application",
          "CBSA reviews and activates the program, typically within 5 business days",
          "Once active, all future releases under your RM account automatically use RPP",
        ],
        note: "RPP is account-level, not shipment-level. Once you're in, you don't elect it per shipment — it just applies.",
      },
      {
        heading: "What can go wrong",
        body: [
          "Late payment on an SOA triggers the 'failure to pay' penalty (5% of amount owing + 1%/month) and puts your RPP enrollment at risk. Two missed payments in a rolling 12-month window and CBSA can revoke RPP.",
          "Keep the SOA on your accounting close list. Automate the pre-authorized debit inside CARM so the CRA pulls funds on the due date — this is the simplest way to stay compliant.",
        ],
      },
      {
        heading: "Is RPP always the right choice?",
        body: "If you import more than once a quarter, yes. If you're a true one-off importer (say, bringing in equipment once and never again), RPP is still nice-to-have but the CARM security requirement is the same either way. The only scenario where skipping RPP makes sense is if you genuinely only ever ship under the LVS CA$2,500 threshold, handled by courier.",
      },
    ],
    relatedPosts: [
      "carm-onboarding-checklist",
      "carm-bond-vs-cash-security",
      "carm-common-errors",
    ],
    heroImage: {
      subject: "A timeline showing shipment release, statement generation, and payment due date",
      style: "clean horizontal timeline infographic, blue/white",
      alt: "Timeline of the RPP monthly billing cycle",
    },
  },

  // ============================================================
  // WEEK 10 — 2026-06-29
  // ============================================================
  {
    slug: "delegating-customs-broker-carm",
    title: "Delegating Your Customs Broker in CARM: Step-by-Step",
    metaTitle: "Delegate Broker in CARM — Step-by-Step (2026) | AccessToNorth.com",
    metaDescription:
      "How to delegate your customs broker authority inside the CARM Client Portal. Permission levels, invitation flow, and why forgetting this step holds shipments at the border.",
    publishDate: "2026-06-29",
    category: "carm-imports",
    tags: ["carm broker delegation", "customs broker authority", "carm permissions", "broker invite"],
    author: TEAM,
    readingTime: 4,
    intro:
      "The single most common reason first-time CARM-enrolled importers get shipments held at the border is a forgotten broker delegation. Your broker can't file entries on accounts they don't have access to — and CARM requires the delegation to flow through the portal, not via paper authorization. Here's the exact flow.",
    keyTakeaways: [
      "Brokers need portal-level delegation to file entries after CARM",
      "Three permission tiers: View, Edit, Manage",
      "Delegation is account-specific (per RM extension) and expires when revoked",
      "The broker must accept from their side — invitation alone isn't enough",
      "Allow 1–2 business days for acceptance before your first scheduled release",
    ],
    sections: [
      {
        heading: "Permission levels, explained",
        body: [
          "View: broker can read your import records but can't file or amend. Useful for auditors, not brokers.",
          "Edit: broker can file release entries, submit amendments, and respond to CBSA requests on your behalf. This is the standard for your customs broker.",
          "Manage: broker can also invite/remove other users from your account. Use sparingly — reserve for the single main broker of record.",
        ],
      },
      {
        heading: "The invitation flow",
        list: [
          "Log in to CARM Client Portal as your Business Account Manager",
          "Go to 'Manage authority' → 'Business relationships'",
          "Select 'Add a business to delegate to' and enter your broker's BN",
          "Choose the RM account(s) they'll operate on and the permission level (Edit, in most cases)",
          "Submit — the broker gets an automated notification",
        ],
      },
      {
        heading: "What the broker does on their side",
        body: [
          "The broker logs into CARM under their own account, sees the pending delegation, and accepts. Only after acceptance does the delegation become active.",
          "Brokers typically process delegations within 1 business day, but larger brokers with queues can take 2–3. Submit the invitation AT LEAST 5 business days before your first expected shipment.",
        ],
        note: "You can track status in the CCP under 'Pending invitations'. If it says 'Sent' for more than 2 days, call the broker — they may be waiting on something from their end.",
      },
      {
        heading: "How to revoke",
        body: "Same 'Manage authority' screen. Select the broker, click Revoke. Revocation is immediate — future entries will fail. Use this when switching brokers, and coordinate with both the outgoing and incoming broker so you don't have a gap where neither can file.",
      },
    ],
    relatedPosts: [
      "carm-onboarding-checklist",
      "carm-common-errors",
      "rpp-program-explained",
    ],
    heroImage: {
      subject: "Digital handshake between an importer icon and a customs broker icon inside a portal window",
      style: "clean flat illustration, slate + blue",
      alt: "Customs broker delegation flow inside the CARM Client Portal",
    },
  },

  // ============================================================
  // WEEK 11 — 2026-07-06
  // ============================================================
  {
    slug: "carm-common-errors",
    title: "CARM Common Errors (and How to Fix Them Fast)",
    metaTitle: "CARM Common Errors and Fixes | AccessToNorth.com",
    metaDescription:
      "The top CARM errors that hold importer shipments at the border — plus the exact fix for each. Business account claim failures, missing security, broker delegation gaps.",
    publishDate: "2026-07-06",
    category: "carm-imports",
    tags: ["carm errors", "carm troubleshooting", "shipment held at border", "carm portal issues"],
    author: TEAM,
    readingTime: 5,
    intro:
      "When a CARM-related error holds your shipment at the border, every hour costs storage + demurrage. Here are the seven most common errors we see every week, what each one actually means, and how to fix them without a 45-minute CBSA phone queue.",
    keyTakeaways: [
      "Most CARM errors fall into 5 buckets: security, delegation, business claim, account status, and HS code mismatch",
      "Fix most issues in the portal directly — call CBSA only if the portal won't accept your input",
      "Keep your broker's BN, your RM number, and your CARM login handy — you'll need them",
      "Shipment holds trigger storage fees starting CA$100+/day — treat errors as time-sensitive",
    ],
    sections: [
      {
        heading: "Error 1 — 'No financial security on file'",
        body: [
          "Meaning: you haven't posted (or topped up) security before the release. Happens most often when (a) you're a new importer and skipped the security step during onboarding, or (b) your monthly imports have grown and exceeded the 50% coverage threshold.",
          "Fix: log in to CCP, go to 'Financial security', post an additional bond or cash deposit. CBSA accepts and applies within 1 business day.",
        ],
      },
      {
        heading: "Error 2 — 'Broker not delegated to this RM account'",
        body: [
          "Meaning: you completed CARM onboarding but skipped delegating the broker (Step 5 in the checklist). Entries from their BN get rejected.",
          "Fix: send the delegation invitation right now; most brokers accept same-day if you call and ask.",
        ],
      },
      {
        heading: "Error 3 — 'Business account not claimed'",
        body: "Meaning: your BN/RM exists at the CRA/CBSA level but no-one has claimed it in CARM. This often happens when a prior broker onboarded under their own account and left — you have the number but no portal authority. Fix: complete the business-account claim using your CRA-known details, or an authorized representative if you're non-resident.",
        note: "This error can take longer to resolve if the verification questions fail — call the CARM help line with your RC number and last-filed tax year at hand.",
      },
      {
        heading: "Error 4 — 'RPP not enrolled'",
        body: "Meaning: your broker tried to release goods on security but you're not enrolled in RPP. Without RPP, duty must be paid at the moment of release — which your broker can't do from their end without your funds. Fix: enroll in RPP inside CCP (one form, 5-day activation) and have the broker re-submit once active. For the current shipment, pre-fund the broker.",
      },
      {
        heading: "Error 5 — 'HS code not permitted under current program'",
        body: "Meaning: you're trying to import something requiring an OGD (Other Government Department) permit you don't have — CFIA, Health Canada, Global Affairs. Fix: check the AIRS tool for your HS code to find the required permit, apply for it (lead times 5–30 days), and re-submit release. For time-sensitive shipments, sometimes the goods can be placed in bonded storage until the permit arrives.",
      },
      {
        heading: "Error 6 — 'Account suspended for unpaid SOA'",
        body: "Meaning: a prior month's Statement of Account went unpaid past the due date and your RPP was suspended. Fix: pay the outstanding SOA inside CCP immediately. RPP re-activates within 2 business days of payment. Two suspensions in 12 months and CBSA can revoke RPP entirely — treat the first one as a serious warning.",
      },
      {
        heading: "Error 7 — 'Importer not registered for GST/HST'",
        body: "Meaning: you have an RM account but not an RT (GST/HST) account. CBSA sometimes requires both depending on goods and end use. Fix: apply for the RT extension through CRA (same BN), which takes 5–10 days. You can also contact your broker about using a carrier bond workaround for the current shipment, but it's a one-time solution.",
      },
    ],
    relatedPosts: [
      "carm-onboarding-checklist",
      "carm-bond-vs-cash-security",
      "rpp-program-explained",
    ],
    heroImage: {
      subject: "Customs portal screen with red error banners and a technician fixing the issue on a laptop",
      style: "clean realistic illustration, blue + red accent",
      alt: "Common CARM Client Portal errors and their fixes",
    },
  },

  // ============================================================
  // WEEK 12 — 2026-07-13
  // ============================================================
  {
    slug: "find-canadian-hs-code",
    title: "How to Find Your Canadian HS Code (Without Guessing)",
    metaTitle: "How to Find the Right Canadian HS Code (2026) | AccessToNorth.com",
    metaDescription:
      "A practical method for finding the correct 10-digit Canadian HS code for your product — using the General Rules of Interpretation, CBSA rulings, and tariff cross-checks.",
    publishDate: "2026-07-13",
    category: "hs-classification",
    tags: ["how to find hs code", "canadian hs code lookup", "tariff classification", "10 digit hs code"],
    author: TEAM,
    readingTime: 6,
    intro:
      "Every mistake in Canadian customs starts with a wrong HS code. The code drives your duty rate, your tax treatment, your permit requirements, and whether SIMA duty applies. Here's the method trade professionals actually use — not the \"search a keyword and pick\" approach that gets you audited.",
    keyTakeaways: [
      "Canadian HS codes are 10 digits — 6 international + 4 Canada-specific",
      "Always start from the General Rules of Interpretation (GRIs), not keyword search",
      "Use CBSA's AIRS tool to check OGD permit requirements for each code",
      "Check CBSA's ruling database before finalizing — someone may have already classified an identical product",
      "When unsure, file an Advance Ruling — it's free and binds CBSA for future shipments",
    ],
    sections: [
      {
        heading: "Start with the General Rules of Interpretation",
        body: [
          "The Canadian Customs Tariff is organized into 97 chapters, 21 sections, and tens of thousands of tariff lines. Without method, you'll pick the wrong one. The GRIs are the 6 ordered rules that determine classification.",
          "GRI 1: classify by headings + section/chapter notes. GRI 2a: incomplete products can still classify to the finished heading. GRI 3: when multiple headings apply, prefer the most specific. Apply them in order — don't jump to the last rule that 'kind of fits'.",
        ],
      },
      {
        heading: "The practical 5-step method",
        list: [
          "Describe the product in technical terms: material, function, end use, stage of manufacture",
          "Identify the likely chapter (e.g. chapter 62 for made-up textile articles, chapter 84 for machinery)",
          "Read the chapter notes — they contain exclusions that often redirect you to another chapter",
          "Narrow to a heading (4-digit), then subheading (6-digit), then Canadian 10-digit lines",
          "Cross-check with CBSA's tariff database at cbsa-asfc.gc.ca and our HS Code Finder tool",
        ],
      },
      {
        heading: "Watch out for material-vs-function traps",
        body: [
          "A stainless steel spatula could be classified by material (chapter 73, articles of iron or steel) or by function (chapter 82, tools). GRI 3b tells you to classify by the component that gives it its essential character — function, in this case — so it goes in 8205.",
          "These traps are everywhere in chapters 39 (plastics), 73 (iron/steel), and 84–85 (machinery). When in doubt, function usually wins.",
        ],
        note: "Misclassifying to a material chapter when a function chapter applies often drops you INTO a higher duty rate. Getting this right can save 3–10% per shipment.",
      },
      {
        heading: "Advance Rulings — the underused tool",
        body: [
          "CBSA's Advance Ruling program lets you submit your product for pre-clearance classification. They respond in 120 days with a binding classification, tariff treatment, and origin determination valid for 4 years or until the tariff changes.",
          "It's free, it's anonymous to other importers, and it shifts the risk of misclassification onto CBSA. For any product you'll ship more than a few times, it's worth the paperwork.",
        ],
      },
      {
        heading: "Sanity-check the code before filing",
        list: [
          "Run it through AIRS — confirm no surprise OGD permit requirements",
          "Check the duty rate under your applicable tariff treatment (MFN, CUSMA, CPTPP, etc.)",
          "Check CBSA's SIMA Measures in Force for your HS code + country of origin",
          "Check the statistical unit — quantity on the invoice must match (kg, pieces, litres)",
        ],
      },
    ],
    relatedPosts: [
      "hs-misclassification-mistakes",
      "cusma-origin-certification",
      "customs-valuation-methods",
    ],
    heroImage: {
      subject: "A magnifying glass over a Canadian tariff book with tree-branching HS codes",
      style: "editorial illustration, blue + green",
      alt: "Finding the correct Canadian HS code for a product",
    },
  },

  // ============================================================
  // WEEK 13 — 2026-07-20
  // ============================================================
  {
    slug: "hs-misclassification-mistakes",
    title: "7 Most Common HS Code Misclassification Mistakes",
    metaTitle: "7 HS Code Misclassification Mistakes (and Fixes) | AccessToNorth.com",
    metaDescription:
      "The seven HS code errors CBSA catches most often — and the classification rules that prevent them. Apparel, electronics, food, and multipurpose products.",
    publishDate: "2026-07-20",
    category: "hs-classification",
    tags: ["hs code mistakes", "misclassification", "cbsa audit", "tariff errors"],
    author: TEAM,
    readingTime: 6,
    intro:
      "CBSA's post-entry review teams see the same mistakes over and over. Here are the seven most common HS misclassifications — and why each one either overpays duty or triggers an audit.",
    keyTakeaways: [
      "Apparel is the #1 misclassification category — blends and composition notes matter",
      "Food products often get stuck in the wrong chapter because of preparation state",
      "Electronics misclassify because 'smart' attributes get ignored",
      "'Parts of' classifications are their own minefield — parts vs. accessories vs. standalone",
      "Every mistake is reviewable within 4 years — plan refunds or expect reassessments",
    ],
    sections: [
      {
        heading: "Mistake 1 — Apparel: wrong textile composition",
        body: "A shirt that's 65% polyester and 35% cotton is classified under the polyester heading (synthetic fibres dominate). A shirt that's 65% cotton and 35% polyester flips to cotton. Chapter 61 and 62 duty rates vary from 12% to 18% depending on composition — a 1-percentage-point error in fibre content can move you to a different heading entirely. Always verify composition against the manufacturer's spec sheet and not the label.",
      },
      {
        heading: "Mistake 2 — Food: raw vs prepared vs cooked",
        body: [
          "The Canadian tariff distinguishes fresh (chapter 2, 7, 8), frozen (same chapters with 'frozen' subheadings), prepared (chapter 16, 20, 21), and cooked-but-not-prepared (varies). A cooked, frozen chicken breast is NOT the same HS code as a raw, frozen chicken breast.",
          "Rule of thumb: any cooking beyond minimal heat for pasteurization moves the product to a higher chapter. If your supplier's invoice says 'cooked', verify what that actually means operationally.",
        ],
      },
      {
        heading: "Mistake 3 — Electronics: dumb classification of smart products",
        body: "A smart watch isn't just a watch — it's a 'machine... for receiving and displaying data' that happens to show time. Goes in chapter 85, not chapter 91. Same issue with smart thermostats, smart locks, and any IoT-enabled consumer product. The 'smart' function is the essential character; classify there.",
      },
      {
        heading: "Mistake 4 — Parts vs accessories vs standalone",
        body: [
          "A phone charger is a standalone item (chapter 85, electrical apparatus) — not a 'part of' a phone. A replacement laptop battery IS a part. A generic USB-C cable is standalone; a vendor-specific proprietary cable might be a part.",
          "Parts usually get classified with the main product OR in specific 'parts' headings. Accessories go under their own heading. The distinction matters because duty rates often differ by 3–5%.",
        ],
        note: "Chapter notes explicitly list what is NOT a 'part' — read them. Chapter 85 note 2 is particularly instructive for electronics.",
      },
      {
        heading: "Mistake 5 — Multipurpose products classified by one use only",
        body: "A kitchen scale that also measures postage weight could be classified by either function. GRI 3b says classify by essential character — the manufacturer's marketing, the typical use case, and the features that dominate. Don't cherry-pick the lowest-duty use.",
      },
      {
        heading: "Mistake 6 — Sets and kits",
        body: "A first-aid kit is classified as a kit (typically chapter 30 under the essential-character component) even though it contains bandages (chapter 30), scissors (chapter 82), and a blanket (chapter 63). Sets are classified as a single entity under GRI 3b, NOT broken out per component.",
      },
      {
        heading: "Mistake 7 — Stale classifications from 5 years ago",
        body: "The Canadian Customs Tariff is updated every January. Subheadings are added, merged, or retired. An HS code that was correct in 2020 may not exist in 2026. Re-verify classifications annually, especially for products in fast-evolving categories (tech, EVs, renewable energy).",
      },
    ],
    relatedPosts: [
      "find-canadian-hs-code",
      "cusma-origin-certification",
      "sima-duty-2026-cases",
    ],
    heroImage: {
      subject: "Boxes labeled with HS codes on a sorting conveyor, some with red 'wrong' stamps",
      style: "semi-realistic illustration, industrial palette with red accent",
      alt: "Common HS code misclassification mistakes at a customs sorting facility",
    },
  },

  // ============================================================
  // WEEK 14 — 2026-07-27
  // ============================================================
  {
    slug: "cusma-origin-certification",
    title: "CUSMA Origin Certification: When and How",
    metaTitle: "CUSMA Origin Certification Explained (2026) | AccessToNorth.com",
    metaDescription:
      "How to certify origin under CUSMA for zero-duty treatment into Canada. Rules of origin, acceptable certification formats, and the 9 required data elements.",
    publishDate: "2026-07-27",
    category: "hs-classification",
    tags: ["cusma origin", "certificate of origin", "usmca canada", "free trade certification"],
    author: TEAM,
    readingTime: 6,
    intro:
      "CUSMA (the Canada-US-Mexico Agreement, known in the US as USMCA) replaced NAFTA in 2020. It simplified origin certification — no more rigid form — but ALSO tightened the rules of origin for several sectors. If you're importing goods from the US or Mexico and want the zero-duty rate, here's how to certify correctly.",
    keyTakeaways: [
      "CUSMA allows three parties to certify: exporter, producer, or importer",
      "No specific form required — 9 data elements on any commercial document work",
      "The certification can be blanket (covers a year) or shipment-specific",
      "Rules of origin changed materially for autos, textiles, and certain agricultural products",
      "CBSA can audit back 4 years — keep certifications and supporting records for 5",
    ],
    sections: [
      {
        heading: "Who can certify",
        body: [
          "Three choices under CUSMA: the exporter (most common), the producer (when different from the exporter), or the importer. Each has tradeoffs — exporter certifications are cheapest to obtain; importer certifications are stronger for due-diligence reasons because the importer has direct knowledge of origin.",
          "Non-resident importers selling DDP into Canada often self-certify as importer of record. This shifts origin verification responsibility to you — you must be able to substantiate origin on audit.",
        ],
      },
      {
        heading: "The 9 required data elements",
        list: [
          "Certifier — name, address, contact info, role (exporter/producer/importer)",
          "Certifier certification authority — signature and date",
          "Exporter — name, address (if different from certifier)",
          "Producer — name and address (multiple OK), or 'various' with a supporting statement",
          "Importer — name and address",
          "Description of the goods",
          "HS tariff classification to 6 digits",
          "Origin criterion (A, B, C, or D depending on how the good qualifies)",
          "Blanket period — start and end dates, if applicable",
        ],
      },
      {
        heading: "Origin criteria — which one applies",
        body: [
          "Criterion A: wholly obtained or produced in the territory (naturally grown, mined, or born). Rare for manufactured goods.",
          "Criterion B: the good satisfies a specific product rule of origin in the HS-specific annex. This is the most common path for manufactured goods — check the CUSMA Rules of Origin schedule for your HS code.",
          "Criterion C: produced entirely from originating materials. Used when all inputs are themselves CUSMA-origin.",
          "Criterion D: applies to specific cases like automobiles with regional value content. Rare outside auto manufacturing.",
        ],
        note: "Getting the criterion wrong is a common reason CBSA denies preferential treatment on audit. If you're unsure, Criterion B is the default for most non-trivial manufactured goods.",
      },
      {
        heading: "Blanket vs shipment-specific",
        body: "Blanket certifications cover all shipments of the listed goods for up to 12 months. Efficient for repeat imports from the same exporter. Shipment-specific certifications are one-offs — required when origin can change between shipments (e.g. the exporter sometimes buys from a different producer).",
      },
      {
        heading: "What happens on audit",
        body: [
          "CBSA can audit CUSMA origin claims for 4 years after import. If the certification is incomplete, unsupported by records, or based on incorrect origin criterion, the preferential treatment is denied and you owe the MFN duty plus interest plus AMPS penalty (up to CA$25,000 per violation).",
          "Keep all supporting records: bills of materials, supplier origin declarations, manufacturing workflows that demonstrate the HS-specific rule is met. 5-year retention is the practical standard.",
        ],
      },
    ],
    relatedPosts: [
      "find-canadian-hs-code",
      "hs-misclassification-mistakes",
      "shipping-us-to-canada-2026-costs",
    ],
    heroImage: {
      subject: "Three country flags (Canada, US, Mexico) over a certificate-of-origin document",
      style: "clean editorial illustration, flag colors",
      alt: "CUSMA origin certification for cross-border trade",
    },
  },

  // ============================================================
  // WEEK 15 — 2026-08-03
  // ============================================================
  {
    slug: "customs-valuation-methods",
    title: "Customs Valuation Methods in Canada Explained",
    metaTitle: "Canadian Customs Valuation Methods (2026) | AccessToNorth.com",
    metaDescription:
      "The six customs valuation methods used by CBSA — transaction value, identical/similar goods, deductive, computed, and residual. When each applies and how to support it.",
    publishDate: "2026-08-03",
    category: "hs-classification",
    tags: ["customs valuation", "value for duty", "transaction value", "cbsa valuation"],
    author: TEAM,
    readingTime: 7,
    intro:
      "Duty in Canada is calculated on 'value for duty' — not always the same as the invoice price. CBSA applies six valuation methods in hierarchical order. Most importers default to the first (transaction value) without knowing the alternatives or when CBSA can reject it. Here's the full picture.",
    keyTakeaways: [
      "Transaction value (method 1) is used in 95% of imports — the price actually paid or payable",
      "CBSA can reject transaction value if the sale isn't 'arm's length' or conditions distort price",
      "Methods 2–6 apply in order when method 1 fails; you can't pick the cheapest",
      "Assists (tooling, design, inputs you provide to the exporter) must be added to value for duty",
      "Misvalued entries are reviewable for 4 years — reassessment includes duty + GST + interest",
    ],
    sections: [
      {
        heading: "Method 1 — Transaction value",
        body: [
          "The price actually paid or payable for the goods when sold for export to Canada, adjusted for: freight and insurance to the border (if not included), commissions, royalties tied to the import, and the value of 'assists' you provided.",
          "This is the most common method because it's the most objective — there's an invoice number, a wire transfer, and an agreed price between arm's-length parties.",
        ],
      },
      {
        heading: "When CBSA rejects Method 1",
        body: [
          "CBSA rejects transaction value when the buyer and seller are related AND the relationship affected the price (common in intra-corporate transfers), when there's a condition attached to the sale that can't be quantified, or when the buyer gets a share of subsequent resale proceeds.",
          "In those cases CBSA works down the hierarchy — Method 2, then 3, etc. — until one fits.",
        ],
        note: "Related-party imports between a Canadian subsidiary and its foreign parent are scrutinized hard. If you're importing from related suppliers, be prepared to substantiate that the price reflects arm's-length terms.",
      },
      {
        heading: "Methods 2 and 3 — Identical / Similar goods",
        body: [
          "Method 2 uses the customs value of identical goods imported into Canada at or about the same time. Method 3 uses similar goods. Both pull from CBSA's own records.",
          "These are rare because CBSA has to have a directly comparable import in its database — usually possible only for high-volume commodities (steel, grain, basic chemicals).",
        ],
      },
      {
        heading: "Methods 4 and 5 — Deductive / Computed",
        body: [
          "Method 4 (deductive): start with the Canadian resale price and work backwards, subtracting Canadian profit, transportation, duties, and GST. Used when imports are sold without further transformation.",
          "Method 5 (computed): sum of production cost, profit, and selling expenses from the exporter's books, plus transport to Canada. Requires the exporter to share cost data — usually impossible for arm's-length suppliers.",
        ],
      },
      {
        heading: "Method 6 — Residual",
        body: "When none of methods 1–5 works, CBSA applies a flexible 'residual' approach — usually a modified version of one of the earlier methods adjusted for the circumstances. Used very rarely and always with an explanatory report.",
      },
      {
        heading: "Assists — the most-missed addition",
        body: [
          "An 'assist' is value you provide to the exporter for use in producing YOUR goods — tooling, dies, moulds, design work, intellectual property, even materials. CBSA requires the value of these assists to be added to the invoice price, pro-rated across the production run.",
          "Example: you pay a Chinese supplier CA$50,000 for 10,000 units, and you separately shipped them a CA$20,000 custom mould. Value for duty on each unit is not CA$5 — it's CA$7 (CA$5 + CA$2 assist).",
        ],
      },
    ],
    relatedPosts: [
      "find-canadian-hs-code",
      "hs-misclassification-mistakes",
      "cbsa-shipment-hold-guide",
    ],
    heroImage: {
      subject: "Six-step staircase labeled with valuation methods, ascending in complexity",
      style: "isometric infographic, blue/teal",
      alt: "The six Canadian customs valuation methods in hierarchical order",
    },
  },

  // ============================================================
  // WEEK 16 — 2026-08-10
  // ============================================================
  {
    slug: "cbsa-shipment-hold-guide",
    title: "What to Do When CBSA Holds Your Shipment",
    metaTitle: "CBSA Shipment Hold — What To Do (2026 Guide) | AccessToNorth.com",
    metaDescription:
      "Step-by-step guide when CBSA holds your Canadian import — identifying the reason, fixing the issue, and minimizing storage fees during the hold.",
    publishDate: "2026-08-10",
    category: "hs-classification",
    tags: ["cbsa hold", "shipment held at border", "customs examination", "hold release"],
    author: TEAM,
    readingTime: 5,
    intro:
      "A CBSA hold at the border means one thing: your cargo isn't moving until someone fixes something. The faster you identify the reason and respond, the less you pay in storage. Here's the triage checklist.",
    keyTakeaways: [
      "CBSA holds fall into 6 categories — document, physical exam, SIMA, OGD, CARM, or random targeting",
      "The first call is to your customs broker — they see the hold reason in CARM",
      "Storage fees start immediately — CA$50–200/day at most ports, more at major airports",
      "Most holds resolve in 1–3 business days once the triggering issue is fixed",
      "Keep a 'hold response kit' ready: commercial invoice, packing list, HS ruling, CUSMA certificate",
    ],
    sections: [
      {
        heading: "Step 1 — Find out why",
        body: [
          "Your broker sees the hold reason the moment it's posted in CARM. The reason code tells you what's needed: 'document hold' means paperwork issue, 'exam hold' means CBSA wants to physically inspect, 'OGD hold' means another department (CFIA, Health Canada) needs to clear the goods.",
          "Don't accept 'there's a hold' as an answer — push your broker to name the specific code and the requested action.",
        ],
      },
      {
        heading: "Step 2 — Respond based on category",
        list: [
          "Document hold: submit the missing/corrected paperwork. Usually a cleaner commercial invoice, a missing CUSMA certificate, or a clarified HS code",
          "Physical exam: pay the exam fee (CA$175-500 depending on port). CBSA schedules the exam within 1-2 days",
          "SIMA hold: provide a normal-value certificate or pay the assessed SIMA duty",
          "OGD hold: obtain the required permit (phytosanitary, CFIA, Health Canada). Timelines vary from hours to weeks",
          "CARM hold: usually missing security or delegation — fix in the portal, broker re-submits",
          "Random targeting: CBSA rotates through importers; provide standard documentation and it clears",
        ],
      },
      {
        heading: "Step 3 — Manage storage costs",
        body: [
          "While the hold is active, the freight forwarder or port facility charges storage. Marine: CA$50–200/day per container. Air: CA$100+/day. Bonded warehouses are slightly cheaper but require a separate transfer.",
          "If you expect the hold to last more than 3 days, ask your broker about moving the goods to a cheaper bonded warehouse. The transfer costs ~CA$200 one-time but saves thousands on extended holds.",
        ],
        note: "Storage fees are often more than the actual duty on the shipment. Every hour of delay counts. Respond to broker requests immediately — don't batch them.",
      },
      {
        heading: "Step 4 — Prevent the next one",
        body: [
          "Once released, do a root-cause analysis. If it was a document issue, fix your SOP so future invoices are correct. If it was a SIMA issue, set up a workflow to verify SIMA status before every import. If it was an OGD issue, align with suppliers on permit timelines.",
          "CBSA uses risk-based targeting: importers with a clean record get fewer random holds. Every hold that resolves cleanly reduces your targeting score.",
        ],
      },
    ],
    relatedPosts: [
      "carm-common-errors",
      "hs-misclassification-mistakes",
      "sima-duty-2026-cases",
    ],
    heroImage: {
      subject: "A container truck stopped at a CBSA checkpoint with a dashboard showing a 'hold' alert",
      style: "realistic illustration, blue-red tone",
      alt: "CBSA hold at a Canadian border checkpoint",
    },
  },

  // ============================================================
  // WEEK 17 — 2026-08-17
  // ============================================================
  {
    slug: "sima-duty-2026-cases",
    title: "SIMA Duty 2026: Active Cases and What They Cost You",
    metaTitle: "SIMA Duty 2026 — Active Cases & Costs | AccessToNorth.com",
    metaDescription:
      "The active SIMA anti-dumping and countervailing duty cases in Canada for 2026. By product, country, and assessed rate — and how to check if your imports are affected.",
    publishDate: "2026-08-17",
    category: "compliance-duties",
    tags: ["sima duty", "anti dumping canada", "cbsa measures in force", "2026 duty"],
    author: TEAM,
    readingTime: 6,
    intro:
      "SIMA duty is the single biggest uncontrolled cost in Canadian importing. A 40% anti-dumping rate on a CA$500,000 annual import program is CA$200,000/year you didn't plan for. Here's what's active in 2026 and how to stay out of it.",
    keyTakeaways: [
      "SIMA duties apply on top of MFN duty — not instead of it",
      "Measures target specific product + country combinations, not broad categories",
      "Most active cases in 2026 cover steel, aluminum, refined sugar, upholstered furniture, and specific copper/wire products",
      "Normal-value determinations let pre-approved exporters avoid full SIMA duty",
      "Check CBSA's Measures in Force list BEFORE placing any large order",
    ],
    sections: [
      {
        heading: "Steel and metals — the biggest SIMA exposure",
        body: [
          "Steel products from China, Vietnam, and occasionally Korea have been under SIMA measures for over a decade. Active cases in 2026 cover heavy plate, wire rod, cold-rolled steel, galvanized sheet, and specific structural tubes. Rates range from 15% to 95% depending on product and exporter.",
          "Aluminum extrusions from China are covered by a separate case with similarly high rates. If you import anything metal-derived from these origins, SIMA verification is mandatory before placing the order.",
        ],
      },
      {
        heading: "Upholstered furniture from China and Vietnam",
        body: "One of the most-cited SIMA cases today. Sofas, chairs, and seating with fabric or leather upholstery from both countries are subject to duties of 100%+ on some producers. Retailers importing under their own account need to verify their Chinese supplier's normal-value determination status — pre-approved exporters have lower rates or zero.",
      },
      {
        heading: "Refined sugar and agricultural commodities",
        body: "Refined sugar has SIMA duties active against the EU, the US, and Korea dating back to 1995 (reviewed and renewed every 5 years). Dairy-derivative products see occasional cases but most are handled through TRQ (tariff-rate quota) rather than SIMA.",
      },
      {
        heading: "How to check if your product is covered",
        list: [
          "Go to CBSA's Measures in Force page (updated weekly)",
          "Search by HS code (6-digit level is enough for first pass)",
          "Check country of origin — SIMA is ALWAYS product+country",
          "Read the measure ID — some cases have exporter-specific rates; find your exporter's name",
          "Compute the effective rate: MFN duty + SIMA duty + GST",
        ],
        note: "SIMA rates can change between shipments if CBSA issues a new normal-value determination. Quote your landed cost after confirming the current rate, not after checking once.",
      },
      {
        heading: "Normal-value determinations — the legal bypass",
        body: [
          "CBSA allows specific exporters to file for a normal-value determination (NVD) — essentially a certification that their export price is above the threshold that would trigger SIMA. Pre-approved exporters see lower or zero SIMA duty.",
          "If you import regularly from one supplier, encourage them to apply for an NVD. The process takes 6–12 months and they must disclose production costs, but the payoff is huge: a supplier with an NVD gives you duty-free access to products that would otherwise carry 40%+ SIMA rates.",
        ],
      },
      {
        heading: "Disputing a SIMA assessment",
        body: "If you receive a SIMA assessment you believe is wrong (wrong exporter matched, product mis-classified, origin misread), file a request for re-determination within 90 days. After 90 days you lose the right to dispute unless you demonstrate exceptional circumstances. This is a hard deadline — do not miss it.",
      },
    ],
    relatedPosts: [
      "hs-misclassification-mistakes",
      "amps-penalties-canada",
      "cbsa-shipment-hold-guide",
    ],
    heroImage: {
      subject: "Stacked steel coils with a percentage-rate meter overlay showing anti-dumping rates",
      style: "editorial industrial photo-style, blue-grey palette",
      alt: "SIMA anti-dumping duty cases affecting Canadian imports of steel",
    },
  },

  // ============================================================
  // WEEK 18 — 2026-08-24
  // ============================================================
  {
    slug: "amps-penalties-canada",
    title: "CBSA AMPS Penalties: Top Violations and Average Fines",
    metaTitle: "CBSA AMPS Penalties — Top Violations 2026 | AccessToNorth.com",
    metaDescription:
      "The Administrative Monetary Penalty System (AMPS) catches routine customs mistakes. The top 10 AMPS violations, what they cost, and how to avoid them.",
    publishDate: "2026-08-24",
    category: "compliance-duties",
    tags: ["amps penalties", "cbsa fines", "customs penalty", "administrative penalty"],
    author: TEAM,
    readingTime: 6,
    intro:
      "AMPS is how CBSA fines you for clerical and compliance errors that don't rise to the level of criminal prosecution. Penalties range from CA$150 to CA$25,000 per violation, and a busy importer can rack up several in a single audit if their documentation is sloppy. Here are the top 10 violations and the typical cost of each.",
    keyTakeaways: [
      "AMPS penalties escalate by 'level' — each repeat multiplies the base amount",
      "Most common: C152 (failure to report), C218 (incorrect declaration), C215 (missing certificate)",
      "First violations are often CA$150–500; repeat offenders hit CA$1,000+ fast",
      "AMPS is assessable up to 4 years after the infraction",
      "Clean compliance history lowers your risk of targeted audits",
    ],
    sections: [
      {
        heading: "How AMPS penalties work",
        body: [
          "Each violation has a contravention code (CXXX) and a base penalty. Repeat offenses on the same code within a 12-month rolling window escalate: Level 1 = base, Level 2 = 2× base, Level 3 = 3× base.",
          "CBSA auditors document each violation separately. A single shipment with a wrong HS code, a missing certificate, AND a reporting error could trigger three separate penalties.",
        ],
      },
      {
        heading: "Top 10 AMPS violations in 2026",
        list: [
          "C152 — Failure to report goods — CA$500 level 1, escalates to CA$2,500",
          "C218 — Incorrect declaration (wrong HS code, value, origin) — CA$150 level 1, CA$1,500 level 3",
          "C215 — Failure to produce a certificate on request — CA$500 level 1",
          "C336 — Failure to pay duty by due date — CA$100 + 5% of unpaid + interest",
          "C329 — Failure to maintain records for 6 years — CA$1,000 level 1",
          "C360 — Failure to provide required information on request — CA$500",
          "C333 — Failure to correct a previous declaration — CA$150 (often stacks with C218)",
          "C107 — Failure to report changes in business info — CA$500",
          "C083 — Misuse of 'release prior to payment' without security — CA$1,000+",
          "C162 — Failure to submit final accounting within 5 business days — CA$150",
        ],
      },
      {
        heading: "Escalation example",
        body: "An importer gets a C218 (incorrect HS code) on a shipment — CA$150 penalty. Six months later, a CBSA review catches 4 more C218s from the same importer over a 12-month window. Each of those is now Level 3 (since the clock was reset at the first). Total: CA$150 + (4 × CA$1,500) = CA$6,150. One careless quarter, five figures in AMPS exposure.",
        note: "AMPS escalation is why \"just ignore the first one\" is the worst possible strategy. Respond to the first penalty properly (pay or appeal), fix the root cause, and you stop the escalation clock.",
      },
      {
        heading: "Appealing an AMPS penalty",
        body: [
          "You have 90 days from the penalty notice to file an appeal (CBSA form BSF760). Successful appeals usually require showing: (a) the violation didn't occur as described, (b) the documentation CBSA relied on was incorrect, or (c) the penalty is disproportionate to the error.",
          "Roughly 30% of AMPS appeals are reduced or dismissed. The rest are upheld. Appeal when you have a clear factual or procedural basis — not just to delay.",
        ],
      },
      {
        heading: "Preventing AMPS — the compliance checklist",
        list: [
          "Review every HS code annually against the current tariff",
          "Keep 6 years of records digitally indexed by shipment ID",
          "Set up a 3-day pre-clearance review of every CA$10K+ invoice",
          "Respond to CBSA document requests within 48 hours",
          "Run a self-audit of the past 90 days every quarter",
        ],
      },
    ],
    relatedPosts: [
      "hs-misclassification-mistakes",
      "sima-duty-2026-cases",
      "customs-audits-what-to-expect",
    ],
    heroImage: {
      subject: "A customs officer holding a ticket-book with AMPS fine codes stacked behind",
      style: "editorial photo illustration, slate + amber palette",
      alt: "CBSA AMPS administrative monetary penalty system",
    },
  },

  // ============================================================
  // WEEK 19 — 2026-08-31
  // ============================================================
  {
    slug: "certificate-of-origin-cusma-requirements",
    title: "Certificate of Origin Requirements Under CUSMA",
    metaTitle: "CUSMA Certificate of Origin Requirements | AccessToNorth.com",
    metaDescription:
      "CUSMA origin certification requirements — format, data elements, record retention, and common mistakes that disqualify Canadian importers from preferential rates.",
    publishDate: "2026-08-31",
    category: "compliance-duties",
    tags: ["cusma certificate", "certificate of origin", "origin requirements", "free trade paperwork"],
    author: TEAM,
    readingTime: 5,
    intro:
      "Under CUSMA there's no specific Certificate of Origin form. But there's also no flexibility on the data you must capture — nine specific elements, in writing, signed, dated. Here's exactly what your Certificate of Origin needs to look like to withstand a CBSA audit.",
    keyTakeaways: [
      "CUSMA replaced NAFTA Form B232 — no prescribed form now exists",
      "The 9 data elements must be on ANY document you issue",
      "Can be printed on the commercial invoice or a separate paper",
      "5-year record retention is the practical standard (4-year audit window + 1 buffer)",
      "Missing ONE element disqualifies the shipment — CBSA denies preferential treatment and assesses MFN duty",
    ],
    sections: [
      {
        heading: "The 9 data elements — summary",
        list: [
          "Certifier (name, address, role, contact)",
          "Exporter (if different from certifier)",
          "Producer (if different — can be 'various' with supporting list)",
          "Importer (name, address)",
          "Description of goods + HS 6-digit code",
          "Origin criterion (A, B, C, or D)",
          "Blanket period (if applicable)",
          "Authorized signature + title",
          "Date of certification",
        ],
      },
      {
        heading: "Where to put it",
        body: [
          "The Certificate can live on: (a) the commercial invoice itself (cleanest — one piece of paper), (b) a separate signed document attached to the invoice, (c) an electronic document in your ERP so long as it's reproducible on audit.",
          "Most exporters put a one-paragraph statement plus signature block at the bottom of every invoice. Importers who generate their own certifications (because they're self-certifying) usually issue a separate document.",
        ],
      },
      {
        heading: "Sample language (for exporter-issued on invoice)",
        body: [
          "\"I certify that the goods described on this invoice originate in the territory of Canada, the United States, or Mexico, and qualify for CUSMA preferential tariff treatment under Origin Criterion [A/B/C/D]. HS: [6-digit code]. Records supporting this certification are maintained at [address] and will be provided to CBSA on request.\"",
          "Followed by the signer's name, title, date, and wet or digital signature.",
        ],
        note: "Digital signatures are explicitly accepted under CUSMA. Email attachments with a typed name in a signature block are NOT sufficient — use a scanned wet signature or a DocuSign-style digital signature.",
      },
      {
        heading: "Record retention and audit",
        body: [
          "CBSA's audit window is 4 years from the date of import. If you benefit from a CUSMA rate and can't produce the certificate + supporting records within that window, the preferential treatment is retroactively denied.",
          "Keep certificates and supporting bills-of-materials, supplier origin declarations, and manufacturing workflow documents for 5 years to be safe. Digital archiving with a stable filename convention beats paper file folders.",
        ],
      },
      {
        heading: "Common disqualifiers",
        list: [
          "Missing origin criterion (the importer picked 'I don't know')",
          "HS code on certificate doesn't match HS code on entry (even a 2-digit difference can fail)",
          "Blanket period expired and no new certificate was issued",
          "Signature from someone who isn't authorized to certify (CBSA will request proof of authority)",
          "Exporter, producer, or importer information incomplete",
        ],
      },
    ],
    relatedPosts: [
      "cusma-origin-certification",
      "find-canadian-hs-code",
      "amps-penalties-canada",
    ],
    heroImage: {
      subject: "A CUSMA certificate document with checkmarks next to each required data element",
      style: "clean editorial illustration, white/blue with checkmarks",
      alt: "CUSMA certificate of origin data elements checklist",
    },
  },

  // ============================================================
  // WEEK 20 — 2026-09-07
  // ============================================================
  {
    slug: "canadian-import-permits-by-commodity",
    title: "Canadian Import Permits by Commodity Type",
    metaTitle: "Canadian Import Permits by Commodity (2026) | AccessToNorth.com",
    metaDescription:
      "Which Canadian import permits apply to which commodities — food (CFIA), health products (Health Canada), textiles, steel, firearms, and controlled goods.",
    publishDate: "2026-09-07",
    category: "compliance-duties",
    tags: ["import permit canada", "cfia permit", "health canada import", "controlled goods"],
    author: TEAM,
    readingTime: 6,
    intro:
      "Every Canadian import runs through CBSA — but CBSA defers to other government departments (OGDs) for specific commodities. Missing the right permit at the border turns a routine clearance into a multi-week hold. Here's which agency regulates what.",
    keyTakeaways: [
      "CFIA: food, plants, animals, seeds, feeds — most commonly missed permits",
      "Health Canada: drugs, medical devices, cosmetics, natural health products",
      "Global Affairs Canada: textiles, steel quotas, controlled military/dual-use",
      "Environment and Climate Change Canada: ozone-depleting substances, hazardous waste",
      "Always check the AIRS tool for your HS code BEFORE placing the order",
    ],
    sections: [
      {
        heading: "CFIA — Food, Plants, Animals",
        body: [
          "CFIA regulates: fresh and processed food, plants and plant products, animals and animal products, seeds, feeds, fertilizers. Requirements vary by commodity:",
          "Food: Safe Food for Canadians (SFC) licence for importers of most food. Plants: phytosanitary certificate from origin country. Animals: veterinary health certificate + CFIA import permit. Seeds: Seeds Act registration.",
        ],
      },
      {
        heading: "Health Canada — Drugs and Devices",
        body: [
          "Health Canada regulates: human prescription drugs, OTC medications, medical devices (Class I–IV), cosmetics, natural health products, veterinary drugs.",
          "Most require site licensing for the importer (DEL for drugs, MDEL for devices) plus a product-specific approval (DIN, licence, or notification). Cosmetics require notification only. Natural health products need an NPN or DIN-HM.",
        ],
        note: "Cosmetics look easy but the notification must be filed BEFORE the first import. A shipment of untested lip balm without a cosmetic notification will be held and potentially refused entry.",
      },
      {
        heading: "Global Affairs Canada — Textiles, Steel, Controlled Goods",
        body: [
          "GAC administers the Import Control List — a set of commodities requiring an import permit regardless of origin. Main categories: steel and steel products (anti-dumping monitoring), textiles and apparel from certain origins, certain agricultural commodities, firearms, military and strategic goods.",
          "The permit is free to apply for but takes 5–30 days depending on commodity. For strategic/controlled goods, processing can take months and may require end-use certificates.",
        ],
      },
      {
        heading: "ECCC — Environmental controls",
        body: "Environment and Climate Change Canada regulates: ozone-depleting substances, hydrofluorocarbons, hazardous waste and recyclable material, certain wildlife products (CITES). Permits tend to be specific and long-cycle — apply well in advance.",
      },
      {
        heading: "Natural Resources Canada — Energy Efficiency",
        body: "NRCan sets energy-efficiency standards for imported appliances, lighting, and some electronics. You don't need a 'permit' per se but you do need proof of compliance (a Canadian energy-efficiency certification) to clear. Verification labels are mandatory — the goods get held if labels are missing or non-compliant.",
      },
      {
        heading: "How to check for your specific product",
        list: [
          "Go to CBSA's AIRS tool at inspection.canada.ca",
          "Enter your 10-digit HS code + country of origin + end use",
          "AIRS returns every OGD requirement and permit needed",
          "Apply for ALL listed permits before ordering — some have multi-month lead times",
          "Verify the permit number is on your commercial invoice so CBSA auto-links it",
        ],
      },
    ],
    relatedPosts: [
      "find-canadian-hs-code",
      "cbsa-shipment-hold-guide",
      "amps-penalties-canada",
    ],
    heroImage: {
      subject: "Five permit stamps from different Canadian agencies arranged around a commodity grid",
      style: "editorial illustration, blue/green institutional palette",
      alt: "Canadian import permit requirements by commodity and regulating agency",
    },
  },

  // ============================================================
  // WEEK 21 — 2026-09-14
  // ============================================================
  {
    slug: "shopify-canada-tax-duty-guide",
    title: "Shopify Canada: Sales Tax and Duty Compliance Guide",
    metaTitle: "Shopify Canada Tax & Duty Compliance (2026) | AccessToNorth.com",
    metaDescription:
      "How Canadian Shopify sellers should configure tax, duty, and shipping to stay CRA + CBSA compliant. GST/HST rates by province, cross-border duty, and marketplace rules.",
    publishDate: "2026-09-14",
    category: "ecommerce-non-resident",
    tags: ["shopify canada tax", "ecommerce gst hst", "shopify duty", "canadian online store"],
    author: TEAM,
    readingTime: 7,
    intro:
      "Shopify's tax engine does a decent first-pass job, but the defaults don't handle non-resident sellers, marketplace rules, or cross-border duty at all. Here's the setup checklist for Canadian Shopify sellers to stay compliant in 2026.",
    keyTakeaways: [
      "Shopify Tax automatically collects GST/HST by province once you add your BN",
      "Provincial sales tax (QST, PST BC, PST SK, PST MB) requires separate registration",
      "Duty on cross-border shipments is calculated separately — Shopify doesn't collect it by default",
      "Marketplace orders through Shop Pay use different tax remittance rules",
      "Non-resident sellers without a CA BN CAN'T collect GST/HST through Shopify",
    ],
    sections: [
      {
        heading: "GST/HST configuration for Canadian sellers",
        body: [
          "Once you have a BN + RT (GST/HST) program account, enter the BN in Shopify Admin → Settings → Taxes and duties → Canada. Shopify will automatically apply the correct GST/HST rate per province: 5% GST in AB/MB/SK/QC/NT/NU/YT, 13% HST in ON, 15% HST in NS/NB/NL/PE, 5% GST in BC.",
          "Shopify remits directly to CRA through 'Shopify Tax' if you're enrolled — otherwise you're responsible for filing your own returns.",
        ],
      },
      {
        heading: "Provincial sales taxes — NOT automatic",
        body: [
          "Quebec's QST (9.975%), BC's PST (7%), Saskatchewan's PST (6%), and Manitoba's RST (7%) are separate from GST/HST. Each has its own registration and filing. Shopify can collect them if you register and enter credentials, but registration is on you.",
          "Thresholds: Quebec requires registration if your Canadian sales exceed CA$30,000 in any 12-month period. BC, SK, MB have similar thresholds but different triggers. Check each province.",
        ],
        note: "QST is the province most overlooked by Shopify sellers. If you sell to Quebec customers and exceed CA$30K, register with Revenu Québec — not just the federal CRA.",
      },
      {
        heading: "Duty on cross-border shipments",
        body: [
          "When a non-Canadian Shopify seller ships to Canadian customers, the customer typically pays duty + GST at delivery (courier handles under LVS for shipments under CA$2,500).",
          "If you want to offer DDP ('landed cost included'), Shopify has a Duties & Import Taxes feature. It calculates estimated duty + tax and collects at checkout. You then pay the courier or broker on import. BUT: this requires you to have a BN and CARM account, because YOU become the importer of record.",
        ],
      },
      {
        heading: "Marketplace rules — when Shopify collects for you",
        body: "If you sell on Shop (Shopify's consumer marketplace) or use Shop Pay for fulfillment-handled sales, Shopify collects and remits GST/HST on B2C transactions directly (similar to Amazon's marketplace tax rules). Check in Settings → Markets → Canada for current remittance status.",
      },
      {
        heading: "Non-resident sellers — special handling",
        body: [
          "If you're US-based selling into Canada via Shopify, your options are: (a) register for the simplified GST/HST regime (CRA accepts non-residents without a Canadian presence), (b) register normally with a BN and CARM account if you plan to import inventory, or (c) don't register and let customers pay at delivery (but you lose visibility into landed cost and may lose conversion).",
          "Most serious non-resident sellers pick option (b) and present an all-in DDP price at checkout.",
        ],
      },
      {
        heading: "What to do this week",
        list: [
          "Audit your Shopify tax settings: GST/HST on, BN entered, rate by province correct",
          "Check if you've crossed QST/PST thresholds in the past 12 months — register if yes",
          "Enable Duties & Import Taxes in Shopify if you sell internationally",
          "Set up a quarterly reconciliation: Shopify tax report vs CRA filing",
          "If you're a non-resident, decide between simplified regime and normal BN — don't leave it informal",
        ],
      },
    ],
    relatedPosts: [
      "register-gst-hst-non-resident-canada",
      "non-resident-amazon-fba-canada",
      "ddp-vs-dap-ecommerce-canada",
    ],
    heroImage: {
      subject: "Shopify checkout screen with tax and duty line items, Canadian flag in corner",
      style: "UI mockup illustration, green + white",
      alt: "Shopify Canada checkout showing tax and duty compliance",
    },
  },

  // ============================================================
  // WEEK 22 — 2026-09-21
  // ============================================================
  {
    slug: "shipping-us-to-canada-2026-costs",
    title: "Shipping from US to Canada: 2026 Cost Breakdown",
    metaTitle: "Shipping US to Canada — 2026 Cost Breakdown | AccessToNorth.com",
    metaDescription:
      "True landed cost of shipping from US to Canada in 2026 — freight, customs broker, duty, GST, and hidden fees. By shipment size and mode.",
    publishDate: "2026-09-21",
    category: "ecommerce-non-resident",
    tags: ["shipping us canada", "cross border shipping cost", "us to canada freight", "landed cost"],
    author: TEAM,
    readingTime: 6,
    intro:
      "US-to-Canada shipping looks cheap because the mile counts are short. The hidden cost is everything that isn't freight — brokerage, duty, GST, clearance fees, and the lost time of a held shipment. Here's the honest landed-cost breakdown for 2026, by shipment size and mode.",
    keyTakeaways: [
      "Small parcel courier: cheapest per-item but high brokerage + duty per shipment",
      "LTL truck: best for 500-5,000 lb loads, but clearance fees add CA$75-150 per shipment",
      "FTL truck: economical above 15,000 lb, similar clearance cost spread across more volume",
      "LCL/FCL ocean: for East Coast destinations, cheaper than truck from the US South for bulk",
      "CUSMA saves 3-18% in duty for qualifying origin — worth verifying on every shipment",
    ],
    sections: [
      {
        heading: "Small parcel (UPS, FedEx, DHL under 150 lb)",
        body: [
          "Typical freight cost per 10 lb Chicago → Toronto: CA$35-55. Under LVS (under CA$2,500), the courier handles clearance automatically and adds a brokerage fee of CA$7-15 per shipment.",
          "Duty and GST are passed to the consignee on invoice. Expect 5-10% duty on most goods plus 5% GST. Real landed cost on a CA$500 parcel: roughly CA$75 freight + CA$10 brokerage + CA$50 duty + CA$25 GST = CA$160 over invoice.",
        ],
      },
      {
        heading: "LTL truck (150-10,000 lb)",
        body: [
          "LTL rates Chicago → Toronto: CA$400-800 for a single pallet depending on density and carrier. Add a customs broker fee (CA$75-150 per shipment) and the clearance is handled outside the freight bill.",
          "Duty + GST are pre-assessed via the broker and paid under RPP (monthly). Total landed premium over freight: roughly 10-18% depending on duty rate.",
        ],
      },
      {
        heading: "FTL truck (full trailer, typically 15,000-40,000 lb)",
        body: [
          "FTL rates Chicago → Toronto: CA$1,800-3,500. Clearance costs are similar to LTL (CA$75-150) but spread across much more cargo — landed cost premium drops to 3-8% of freight.",
          "FTL is where custom bond/RPP setup pays off. Without RPP, duty of CA$3,000+ on a typical FTL gets held at the border until funds clear — often 24-48 hours.",
        ],
        note: "If you're doing 4+ FTL per month, the CA$500-1,000/year bond premium is absolutely worth it — you save 1-2 days of trailer demurrage on just one delay.",
      },
      {
        heading: "LCL/FCL ocean (to Toronto/Montreal via East Coast ports)",
        body: [
          "LCL rates NYC → Halifax → Toronto: CA$80-150 per CBM. FCL 40'HC: CA$2,500-4,000 all-in from most East Coast origins.",
          "Ocean tends to be slower (1-2 weeks including drayage) but cheaper for heavy/bulky cargo. Worth it for: furniture, building materials, bulk chemicals, anything over 15 CBM that isn't time-critical.",
        ],
      },
      {
        heading: "Hidden costs nobody quotes",
        list: [
          "Brokerage for each shipment entry — CA$75-150 per clearance",
          "AMPS penalties if paperwork is bad — CA$150-2,500 per violation",
          "Storage on held shipments — CA$50-200/day",
          "Demurrage on late-returned containers — CA$75-300/day",
          "PARS/PAPS automation fees — CA$10-30 per submission",
          "Fuel surcharges — 15-25% above base freight in 2026",
        ],
      },
      {
        heading: "The CUSMA duty savings",
        body: "Under CUSMA, goods originating in the US or Mexico qualify for zero or reduced Canadian duty vs the MFN rate. Example: apparel from US under MFN = 18% duty. Under CUSMA = 0%. On a CA$50,000 LTL shipment of qualifying US-origin apparel, that's CA$9,000 saved. Always verify origin qualification and file a certificate — it's the single biggest recurring saving for cross-border operators.",
      },
    ],
    relatedPosts: [
      "ddp-vs-dap-ecommerce-canada",
      "non-resident-amazon-fba-canada",
      "customs-valuation-methods",
    ],
    heroImage: {
      subject: "Split truck illustration showing freight cost on one side and total landed cost on the other",
      style: "editorial illustration, clean infographic style",
      alt: "True landed cost of shipping from US to Canada in 2026",
    },
  },

  // ============================================================
  // WEEK 23 — 2026-09-28
  // ============================================================
  {
    slug: "ddp-vs-dap-ecommerce-canada",
    title: "DDP vs DAP for Cross-Border E-commerce Into Canada",
    metaTitle: "DDP vs DAP for Canadian E-commerce (2026) | AccessToNorth.com",
    metaDescription:
      "When cross-border sellers should offer DDP vs DAP to Canadian customers. Conversion impact, operational complexity, and the non-resident importer trap.",
    publishDate: "2026-09-28",
    category: "ecommerce-non-resident",
    tags: ["ddp vs dap", "delivered duty paid", "cross border shipping", "canadian ecommerce incoterm"],
    author: TEAM,
    readingTime: 6,
    intro:
      "US e-commerce brands selling into Canada face a pricing question: do you absorb duty and tax into the checkout price (DDP), or let the customer pay on delivery (DAP)? The conversion difference is enormous, but so is the operational complexity. Here's the honest analysis.",
    keyTakeaways: [
      "DDP = Delivered Duty Paid: you absorb duty + tax, customer sees one price",
      "DAP = Delivered At Place: customer pays duty + tax at courier delivery",
      "DDP typically lifts Canadian checkout conversion 20-40% — but requires you to become importer of record",
      "DAP is simpler to operate but costs you basket-level conversion every time",
      "DDP without a BN + CARM account is technically non-compliant — courier workarounds often aren't durable",
    ],
    sections: [
      {
        heading: "The conversion data",
        body: [
          "Canadian consumers who see 'plus duty, plus tax, plus brokerage at delivery' at checkout convert 20-40% lower than those who see a single 'all-in' price. This is true across price points and categories.",
          "For a US DTC brand doing CA$500K/year in Canadian revenue, moving from DAP to DDP can add CA$100K+ in top-line without any ad-spend change.",
        ],
      },
      {
        heading: "The operational reality of DDP",
        body: [
          "DDP means YOU become the Canadian importer of record on every shipment. That means: BN with RM extension, CARM onboarding, financial security, a customs broker, and RPP enrollment if you're doing any volume.",
          "Operationally, your 3PL or fulfillment partner files each entry under your BN, duty is billed to your RPP monthly, and you reconcile landed cost against the duty you quoted at checkout. Shopify's Duties & Import Taxes feature handles the checkout math but NOT the customs filings.",
        ],
        note: "Many US sellers try 'unofficial DDP' where the courier (UPS/FedEx) pre-clears on their behalf. This works for small parcels under LVS but falls apart above CA$2,500 per shipment. Courier bonds typically can't handle a high-volume DDP operation long-term.",
      },
      {
        heading: "The DAP operational profile",
        body: [
          "With DAP, you ship from the US, the consumer pays the courier's clearance fee + duty + GST at the door. You don't need a BN, CARM, or a Canadian broker.",
          "Simple to set up. Painful at conversion time. Increasingly, Canadian consumers ignore DAP sellers entirely in favor of brands with Canadian fulfillment or DDP shipping.",
        ],
      },
      {
        heading: "The hybrid: Canadian fulfillment",
        body: [
          "A middle path: don't ship cross-border at all. Stock inventory at a Canadian 3PL, ship domestic from Canada. You become an importer of record once (for the inventory move) instead of per-order.",
          "Pros: fastest shipping (1-3 days), no per-order customs, easy returns in CAD. Cons: inventory carrying cost, minimum volumes for the 3PL to accept you, and you're paying duty on inventory that might not sell.",
        ],
      },
      {
        heading: "Which is right for your business",
        list: [
          "Under CA$50K/year in Canada — DAP is probably fine, focus on product-market fit first",
          "CA$50K–500K/year — DDP is likely the single biggest revenue lever; invest in BN + CARM",
          "Above CA$500K/year — Canadian fulfillment becomes competitive; do the 3PL math",
          "High-duty categories (apparel, footwear) — DDP is non-negotiable; the tax shock at delivery is too jarring for consumers",
          "Low-duty categories (books, software downloads) — DAP works fine because the delivery invoice is small",
        ],
      },
    ],
    relatedPosts: [
      "non-resident-amazon-fba-canada",
      "shopify-canada-tax-duty-guide",
      "shipping-us-to-canada-2026-costs",
    ],
    heroImage: {
      subject: "Two checkout screens side-by-side, one showing DDP (all-in price) and one DAP (plus duty at delivery)",
      style: "UI mockup illustration, green/amber contrast",
      alt: "DDP vs DAP checkout comparison for Canadian e-commerce",
    },
  },

  // ============================================================
  // WEEK 24 — 2026-10-05
  // ============================================================
  {
    slug: "customs-audits-what-to-expect",
    title: "Customs Audits: What to Expect and How to Prepare",
    metaTitle: "Canadian Customs Audits — What to Expect (2026) | AccessToNorth.com",
    metaDescription:
      "What happens during a CBSA customs audit: trigger events, documentation request, typical findings, and how to prepare so an audit doesn't become a catastrophe.",
    publishDate: "2026-10-05",
    category: "advanced",
    tags: ["cbsa audit", "customs audit canada", "trade compliance audit", "import records"],
    author: TEAM,
    readingTime: 6,
    intro:
      "A CBSA compliance audit doesn't announce itself. You get a letter requesting records for a specific time period, and then your operational bandwidth disappears for 2-6 weeks while auditors go through everything. Here's what to expect and how to make sure an audit ends with no assessments.",
    keyTakeaways: [
      "Audits look back up to 4 years from the notice date",
      "Triggers include: classification errors, origin disputes, valuation queries, random rotation, or tip-offs",
      "Expect 20-50 shipments to be reviewed in detail",
      "Common findings: HS misclassification, missing origin certs, undocumented assists, valuation adjustments",
      "A clean audit response cuts penalty assessments by 60%+ — disorganized ones often double them",
    ],
    sections: [
      {
        heading: "How audits start",
        body: [
          "You receive a letter from CBSA (sometimes prefixed \"compliance verification\") requesting specific records for a defined period — usually 12-48 months. The letter lists what they want: commercial invoices, B3 forms, CUSMA certificates, HS documentation, payment evidence, ledger entries.",
          "Response deadline is typically 30 days. You can ask for a one-time 30-day extension if the volume is large — don't skip this ask if you need time.",
        ],
      },
      {
        heading: "What they look at",
        list: [
          "HS classifications — are the codes on your entries consistent with the actual goods",
          "Valuation — is the declared value complete (freight, assists, royalties)",
          "Origin — do CUSMA certificates match entries that claimed preferential rates",
          "SIMA — are your high-risk imports correctly assessed against active measures",
          "OGD — did you have the right permits (CFIA, Health Canada, GAC) on every regulated shipment",
          "Records retention — can you produce everything they asked for",
        ],
      },
      {
        heading: "What they find most often",
        body: [
          "Top 3 findings in 2026: (1) HS codes that drifted from the original Advance Ruling or historical classification, (2) CUSMA certificates that don't match the importer of record on the B3, (3) missing documentation of assists (tooling, moulds, free materials provided to exporter).",
          "Each finding typically results in a duty reassessment plus AMPS penalty. A medium-sized importer with weak documentation can end up with CA$50K-500K in assessments.",
        ],
        note: "The most expensive audit outcomes aren't from deliberate fraud — they're from sloppy records and drift. Keep HS classifications current, reconcile CUSMA certs quarterly, and document assists at the moment they occur.",
      },
      {
        heading: "How to prepare BEFORE an audit",
        list: [
          "Keep ALL import records digitally indexed by shipment ID and date — 6 years minimum",
          "Reconcile HS codes against current tariff annually",
          "Maintain a master CUSMA certificate file cross-referenced to B3 entries",
          "Document every assist (tooling, design, free materials) at provisioning time",
          "Run a quarterly internal self-audit on 20 random shipments",
          "Keep your customs broker's archive access current — most brokers offer import-history portals",
        ],
      },
      {
        heading: "What to do DURING an audit",
        body: [
          "Designate a single point of contact — ideally your compliance manager or outside counsel. Auditors interpret multiple sources of input as disorganization.",
          "Produce requested documents in a clean, indexed format. Volume + organization signals competence; photocopies in a box signal negligence.",
          "Answer questions in writing, not on the phone. Phone conversations get paraphrased in CBSA notes and you lose nuance.",
        ],
      },
      {
        heading: "If findings go against you",
        body: "You get a 'notice of determination' with proposed reassessments. You have 90 days to submit a request for re-determination — this is a formal appeal. Most re-determination requests succeed at reducing the assessment if backed by new evidence. Past 90 days your only option is Tax Court, which is expensive and slow.",
      },
    ],
    relatedPosts: [
      "amps-penalties-canada",
      "customs-valuation-methods",
      "cusma-origin-certification",
    ],
    heroImage: {
      subject: "A paper-file audit binder opened with highlighted tables and a CBSA seal",
      style: "realistic editorial illustration, slate/blue",
      alt: "Canadian customs audit documentation and record review",
    },
  },

  // ============================================================
  // WEEK 25 — 2026-10-12
  // ============================================================
  {
    slug: "year-end-compliance-checklist-2026",
    title: "Year-End Trade Compliance Checklist for Canadian Importers",
    metaTitle: "Year-End Trade Compliance Checklist (2026) | AccessToNorth.com",
    metaDescription:
      "The complete year-end trade compliance checklist for Canadian importers. Tariff updates, record-retention audit, CARM reconciliation, and HS code re-verification for 2027.",
    publishDate: "2026-10-12",
    category: "seasonal",
    tags: ["year end compliance", "trade audit", "import checklist 2027", "q4 compliance"],
    author: TEAM,
    readingTime: 6,
    intro:
      "The last quarter of the year is when smart Canadian importers do the one thing that saves them money all next year: a full compliance audit. Takes 2–3 focused days. Catches ~80% of what CBSA would find in an audit. Here's the full checklist.",
    keyTakeaways: [
      "Reconcile 12 months of imports against your HS/origin documentation",
      "Check the 2027 Canadian Customs Tariff for changes affecting your codes",
      "Verify CARM security amount against next year's projected imports",
      "Audit record retention — make sure 6-year archive is complete",
      "Renew expiring CUSMA blanket certificates before year-end",
    ],
    sections: [
      {
        heading: "1. HS code re-verification",
        body: [
          "Pull the 2027 Canadian Customs Tariff (published in December) and compare against your current HS codes. Changes happen at 2-, 6-, and 10-digit levels — a merged subheading can shift a product into a new duty rate overnight.",
          "For every product you import more than once a year, verify the 2027 classification. Update internal SKU-to-HS mappings and share with your broker.",
        ],
      },
      {
        heading: "2. CUSMA blanket certificate renewals",
        body: [
          "If you rely on blanket certificates, many expire December 31. Get new certificates from exporters dated for 2027 BEFORE January 1 — otherwise your first 2027 shipments get assessed at MFN rates.",
          "Include any new products or new exporters on the 2027 blanket. Don't retroactively cover — CUSMA certs must exist at import time.",
        ],
      },
      {
        heading: "3. CARM security reconciliation",
        body: [
          "Look at your last 12 months of CBSA Statements of Account. Find the highest single month's duty + GST. Multiply by 50% — that's your required security.",
          "If your current security is below that, top up before year-end. CBSA reviews coverage periodically and can demand an emergency top-up that bumps up against your operational cashflow.",
        ],
        note: "If volume spiked in Q4 (holiday inventory builds), your projected Q1 security may need to increase. Plan ahead — bond adjustments take 5-10 business days through a surety.",
      },
      {
        heading: "4. Record retention audit",
        body: [
          "Pull a random sample of 10 shipments from each month of the past year (120 total). For each, verify: commercial invoice, B3 entry, CUSMA certificate (if applicable), HS documentation, payment evidence. Digital copies acceptable.",
          "Fill gaps now. In an audit, missing records mean denied deductions, denied preferential treatment, and AMPS penalties per item. 30 minutes of archival cleanup saves five-figure audit findings.",
        ],
      },
      {
        heading: "5. SIMA and import-permit check",
        list: [
          "Pull the current CBSA Measures in Force list",
          "Cross-reference with your top 20 suppliers by volume",
          "Flag any where a new SIMA case was opened in the past 12 months",
          "Check OGD permit expiry dates — CFIA licences, Health Canada DELs, GAC permits",
          "Renew anything expiring in Q1",
        ],
      },
      {
        heading: "6. Broker and 3PL reconciliation",
        body: [
          "Confirm your customs broker still has correct delegation in CARM. Delegations don't auto-expire, but a broker personnel change can leave permissions misaligned.",
          "Reconcile your 3PL's import record against your own. 3PLs sometimes use their bonded workflow and forget to file under your BN — catch that now, not in an audit.",
        ],
      },
      {
        heading: "7. 2027 budget items",
        list: [
          "Bond renewal — most bonds are annual and renew on January 1",
          "CRA filing calendar — set GST/HST, payroll, and corporate income tax deadlines",
          "OGD permit renewals — CFIA SFC licences often expire mid-year; set reminders",
          "Trade agreement reviews — any new FTAs affecting your sourcing in 2027",
        ],
      },
    ],
    relatedPosts: [
      "customs-audits-what-to-expect",
      "amps-penalties-canada",
      "cusma-origin-certification",
    ],
    heroImage: {
      subject: "A checklist on a clipboard with Canadian maple leaf, calendar showing December, and a customs building in the background",
      style: "editorial illustration, clean year-end palette",
      alt: "Year-end Canadian trade compliance checklist",
    },
  },
];

/**
 * Returns only posts whose publishDate is today or earlier.
 * Used by the blog index, sitemap, and RSS feed.
 */
export function getPublishedPosts(now: Date = new Date()): BlogPost[] {
  const today = now.toISOString().slice(0, 10);
  return POSTS.filter((p) => p.publishDate <= today);
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
