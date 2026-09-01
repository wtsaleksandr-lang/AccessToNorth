import { canonicalUrl, type RouteMeta } from "./routeMetadata";
import { POSTS } from "../client/src/data/blog/posts";

type SeoSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type SeoPageContent = {
  eyebrow?: string;
  heading: string;
  intro: string;
  sections: SeoSection[];
  links?: Array<{ label: string; href: string }>;
  sources?: Array<{ label: string; href: string }>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const PRIORITY_CONTENT: Record<string, SeoPageContent> = {
  "/": {
    eyebrow: "AccessToNorth.com",
    heading: "Canadian business, tax, and import registration support",
    intro:
      "AccessToNorth helps Canadian and non-resident businesses prepare Business Number, GST/HST, CARM, customs, and import-compliance registrations with clear fixed pricing. Importers can also use our free planning and tariff tools before requesting professional support.",
    sections: [
      {
        heading: "Canadian registrations and import setup",
        paragraphs: [
          "Choose the registration or customs service you need, upload the supporting documents securely, and follow the work online. Services include CRA Business Number and GST/HST registration, CARM onboarding, non-resident importer setup, HS classification, customs-clearance coordination, and import-compliance review.",
          "AccessToNorth is an independent administrative-services firm. We prepare and coordinate filings under signed authorization and work with licensed customs professionals where a regulated filing requires one.",
        ],
      },
      {
        heading: "Free tools for importers, exporters, and freight teams",
        bullets: [
          "Search Canadian tariff classifications with the Canadian HS Code Finder.",
          "Test pallets, cartons, and mixed cargo in the free 3D Container Loading Calculator.",
          "Estimate duties and taxes with the Canadian Customs Duty Calculator.",
          "Build pallet and truck loading plans with visual reports.",
        ],
      },
    ],
    links: [
      { label: "View all services", href: "/services" },
      { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
      { label: "3D Container Loading Calculator", href: "/tools/container-calculator" },
      { label: "How to Import Into Canada", href: "/resources/how-to-import-into-canada" },
    ],
  },
  "/tools": {
    eyebrow: "Free trade tools",
    heading: "Canadian import and freight planning calculators",
    intro:
      "Use AccessToNorth's free tools to research Canadian HS codes, estimate import duty and tax, calculate CARM financial security, and build practical pallet, container, and truck loading plans.",
    sections: [
      {
        heading: "Tariff and landed-cost tools",
        bullets: [
          "Canadian HS Code Finder: search tariff classifications by product name or code.",
          "Customs Duty and Tax Calculator: estimate duty, GST, and applicable provincial tax.",
          "CARM Security Calculator: estimate Release Prior to Payment financial security.",
        ],
      },
      {
        heading: "Cargo loading and freight tools",
        bullets: [
          "3D Container Loading Calculator for 20-foot, 40-foot, 40-foot high-cube, and 45-foot high-cube equipment.",
          "Pallet Builder for carton patterns, height, weight, and stability checks.",
          "Truck Load Planner with trailer matching, collision-aware placement, and balance guidance.",
          "Freight Quote Request builder and secure shipment-status lookup.",
        ],
      },
    ],
    links: [
      { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
      { label: "Container Loading Calculator", href: "/tools/container-calculator" },
      { label: "Pallet Builder", href: "/tools/pallet-builder" },
      { label: "Truck Load Planner", href: "/tools/truck-load-planner" },
    ],
  },
  "/resources": {
    eyebrow: "Importer resources",
    heading: "Practical guides for importing into Canada",
    intro:
      "Read current, plain-language guidance about CARM, Canadian customs clearance, HS classification, duties, Incoterms, export declarations, CFIA requirements, and non-resident importing.",
    sections: [
      {
        heading: "Start with the complete import guide",
        paragraphs: [
          "The step-by-step import guide explains importer-of-record responsibility, Business Number and RM setup, CARM registration, RPP security, product admissibility, tariff classification, valuation, origin, shipping documents, customs release, and post-entry recordkeeping.",
        ],
      },
      {
        heading: "Research before shipping",
        bullets: [
          "Confirm whether the goods are admissible or need permits before they leave the supplier.",
          "Determine the Canadian ten-digit tariff classification and origin treatment.",
          "Estimate duty, GST, freight, brokerage, terminal fees, and inland delivery.",
          "Prepare consistent commercial invoices, packing lists, transport documents, and origin support.",
        ],
      },
    ],
    links: [
      { label: "How to Import Into Canada", href: "/resources/how-to-import-into-canada" },
      { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
      { label: "Customs Duty Calculator", href: "/customs-calculator" },
    ],
  },
  "/services/business-number-bn": {
    eyebrow: "CRA business registration",
    heading: "Business Number registration in Canada",
    intro:
      "A Business Number is the unique nine-digit identifier used to connect a business with CRA and other government program accounts. The BN is not the same thing as GST/HST, payroll, corporation income tax, or an import-export account.",
    sections: [
      {
        heading: "When a business may need a BN",
        bullets: [
          "Opening a GST/HST, payroll, corporation income tax, or information-return program account.",
          "Registering an import-export RM program account for commercial importing or exporting.",
          "Operating through an incorporated entity or interacting with a participating government program.",
        ],
      },
      {
        heading: "BN9 versus program accounts",
        paragraphs: [
          "The BN contains nine digits. A program account adds a two-letter program identifier and a four-digit reference number, such as RT for GST/HST, RP for payroll, RC for corporation income tax, or RM for import-export activity.",
          "A business generally has one BN. Before applying for another, confirm whether the legal entity already received one through incorporation, a previous CRA registration, or another program.",
        ],
      },
      {
        heading: "Information to prepare",
        bullets: [
          "Exact legal and operating names, entity type, incorporation or registration details, and business addresses.",
          "Owner, director, partner, or authorized-representative information required for the chosen registration route.",
          "The business activity and the specific CRA or CBSA program accounts that are actually needed.",
        ],
      },
    ],
    links: [
      { label: "GST/HST registration service", href: "/services/gst-hst-registration" },
      { label: "CARM registration service", href: "/services/carm-registration-canada" },
      { label: "Non-resident importer setup", href: "/services/non-resident-importer-canada" },
    ],
    sources: [
      {
        label: "CRA — Business number and program accounts",
        href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account.html",
      },
      {
        label: "CRA — How to register",
        href: "https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/business-registration/business-number-program-account/how-register.html",
      },
    ],
  },
  "/services/carm-registration-canada": {
    eyebrow: "CBSA importer onboarding",
    heading: "CARM registration for Canadian importers",
    intro:
      "CARM is CBSA's system of record for commercial import accounting and payment. The importer must register its own business in the portal before delegating access to a customs broker or other service provider.",
    sections: [
      {
        heading: "What the setup normally includes",
        bullets: [
          "Confirming the correct legal entity, BN9, and import-export RM program account.",
          "Creating user access and having the business account manager register or claim the business.",
          "Reviewing program-account access and delegating appropriate authority to the customs broker.",
          "Deciding whether Release Prior to Payment is required and arranging financial security when needed.",
        ],
      },
      {
        heading: "CARM registration and RPP are different",
        paragraphs: [
          "Registering the business lets the importer transact in CARM, but it does not automatically provide release-before-payment privileges. RPP is a separate enrolment with its own financial-security requirements.",
          "The importer remains responsible for its account even when a broker is delegated. Review statements, balances, security, and user access regularly.",
        ],
      },
      {
        heading: "Avoid common onboarding delays",
        paragraphs: [
          "Use legal names and addresses that match the BN and incorporation records. Identify the correct business account manager before starting, and do not create duplicate entities simply because the first claim attempt fails.",
        ],
      },
    ],
    links: [
      { label: "CARM security calculator", href: "/carm-security-calculator" },
      { label: "Business Number registration", href: "/services/business-number-bn" },
      { label: "How to import into Canada", href: "/resources/how-to-import-into-canada" },
    ],
    sources: [
      {
        label: "CBSA — Get started with CARM",
        href: "https://www.canada.ca/en/border-services-agency/services/carm/register.html",
      },
      {
        label: "CBSA — Register or modify an import-export account",
        href: "https://www.canada.ca/en/border-services-agency/services/carm/register-modify-account.html",
      },
    ],
  },
  "/services/non-resident-importer-canada": {
    eyebrow: "Importing into Canada",
    heading: "Non-resident importer setup for Canada",
    intro:
      "A foreign business can act as importer of record in Canada when its commercial, tax, customs, and delivery responsibilities are set up correctly. NRI status is not one registration; it is a coordinated operating model.",
    sections: [
      {
        heading: "Core customs setup",
        bullets: [
          "Obtain or confirm the non-resident entity's Canadian BN9.",
          "Register an import-export RM account and enrol the business in CARM.",
          "Delegate the customs broker and decide whether RPP financial security is needed.",
          "Establish classification, valuation, origin, permit, accounting, and recordkeeping procedures.",
        ],
      },
      {
        heading: "GST/HST is a separate analysis",
        paragraphs: [
          "Being importer of record does not by itself answer every GST/HST question. Registration obligations and input-tax-credit recovery depend on the business model, where and how supplies are made, and whether the normal or simplified digital-economy rules apply.",
          "Review customs value, import GST, customer invoicing, returns, and marketplace collection together before quoting a delivered price.",
        ],
      },
      {
        heading: "Define responsibility before shipping",
        paragraphs: [
          "Confirm the importer, Incoterm, customs broker, consignee, tax treatment, return process, and party responsible for permits and corrections. A DDP label alone does not create the registrations or procedures needed to perform those obligations.",
        ],
      },
    ],
    links: [
      { label: "Non-resident GST/HST guide", href: "/blog/register-gst-hst-non-resident-canada" },
      { label: "Canadian customs calculator", href: "/customs-calculator" },
      { label: "CARM registration service", href: "/services/carm-registration-canada" },
    ],
    sources: [
      {
        label: "CBSA — Register or modify an import-export account",
        href: "https://www.canada.ca/en/border-services-agency/services/carm/register-modify-account.html",
      },
      {
        label: "CRA — GST/HST information for non-residents",
        href: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4027/doing-business-canada-gst-hst-information-non-residents.html",
      },
    ],
  },
  "/tools/container-calculator": {
    eyebrow: "Free 3D planning tool",
    heading: "Container Loading Calculator",
    intro:
      "Plan pallets, crates, cartons, and mixed cargo in standard ocean containers. Enter or import cargo dimensions and total gross weight, let the planner recommend the smallest practical container type, inspect the arrangement in 3D, and export a loading-plan PDF.",
    sections: [
      {
        heading: "What the container calculator checks",
        bullets: [
          "Physical placement inside the container rather than volume alone.",
          "Quantity, outside dimensions, gross weight, stacking, rotation, and loading priority.",
          "Usable internal length, width, height, door clearance, and payload limits.",
          "The number of containers required when the complete shipment cannot fit one unit.",
          "Volume, floor-area, and weight utilization for each proposed loading plan.",
        ],
      },
      {
        heading: "Supported shipping containers",
        paragraphs: [
          "Compare 20-foot dry containers, 40-foot dry containers, 40-foot high-cube containers, 45-foot high-cube containers, and custom equipment. Preset dimensions are planning values because actual internal dimensions and payload limits vary by manufacturer, age, and shipping line.",
        ],
      },
      {
        heading: "Worked example: seven 48 × 48 × 61 inch pallets",
        paragraphs: [
          "Seven square pallets measuring 48 by 48 by 61 inches with a combined gross weight of 5,260 kilograms do not fit in a single 20-foot dry container when loaded one pallet across: the seven pallet lengths require about 336 inches, while a typical 20-foot container has about 232 inches of usable internal length.",
          "The same cargo fits lengthwise in one standard 40-foot dry container, subject to the carrier's exact internal dimensions, door clearance, floor loading, and safe blocking and bracing. A 40-foot high cube is not required solely for 61-inch cargo height. This illustrates why the recommendation must evaluate actual placement before selecting equipment.",
        ],
      },
      {
        heading: "Packing-list and document import",
        paragraphs: [
          "Upload a supported spreadsheet, document, or image to extract cargo rows for review. The calculator prefills the detected item name, dimensions, quantity, and weight fields so the user can verify the information before calculating the plan. Ambiguous or missing values remain clearly marked for confirmation.",
        ],
      },
      {
        heading: "Planning limitations",
        paragraphs: [
          "A calculated fit is a planning estimate, not a loading certificate. Confirm lifting access, door opening, weight concentration, cargo compatibility, dangerous-goods segregation, blocking and bracing, moisture protection, and the carrier's actual equipment specification before loading.",
        ],
      },
    ],
    links: [
      { label: "Open the container calculator", href: "/tools/container-calculator" },
      { label: "Build a pallet", href: "/tools/pallet-builder" },
      { label: "Plan a truck load", href: "/tools/truck-load-planner" },
      { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
    ],
  },
  "/tools/hs-code-finder": {
    eyebrow: "Free Canadian tariff research tool",
    heading: "Canadian HS Code Finder",
    intro:
      "Search Canadian Harmonized System classifications by product description or code number. Review suggested tariff items and descriptions, then send a selected code to the customs duty and tax calculator for an early landed-cost estimate.",
    sections: [
      {
        heading: "How Canadian tariff classification works",
        paragraphs: [
          "The international Harmonized System establishes the first six digits. Canada extends that structure to an eight-digit tariff item, where duty is assigned, and a ten-digit classification number used to report imported goods. Classification depends on the product's material, function, form, composition, and intended use—not only its commercial name.",
        ],
      },
      {
        heading: "How to get a better suggested match",
        bullets: [
          "Describe the product precisely, such as 'men's knitted cotton T-shirt' instead of 'clothing'.",
          "Include the principal material, composition percentage, function, and whether it is a complete product or a part.",
          "For machinery and electronics, include the model, technical purpose, power source, and how the item operates.",
          "Check whether the product is a set, kit, mixture, unfinished article, or accessory because special interpretation rules may apply.",
        ],
      },
      {
        heading: "HS code, origin, and duty rate are different decisions",
        paragraphs: [
          "The HS classification identifies the product. Country of origin and the applicable tariff treatment determine whether MFN duty or a preferential rate under CUSMA, CETA, CPTPP, or another agreement may apply. Shipping from an agreement country does not by itself prove originating status.",
        ],
      },
      {
        heading: "Verify important classifications",
        paragraphs: [
          "The finder provides research suggestions, not an official CBSA decision. Verify high-value, regulated, unfamiliar, or frequently imported goods against the current Canadian Customs Tariff. Consider a professional classification review or CBSA advance ruling when the financial or compliance risk is material.",
        ],
      },
      {
        heading: "Worked example: stainless-steel water bottle",
        paragraphs: [
          "Search for a vacuum-insulated reusable drinking bottle made from stainless steel, 750 millilitres, and not electric. Material, construction, capacity, and function create a much safer shortlist than the generic word bottle. Inspect every candidate's legal description and tariff notes before selecting a Canadian ten-digit number.",
        ],
      },
    ],
    links: [
      { label: "Open the Canadian HS Code Finder", href: "/tools/hs-code-finder" },
      { label: "Calculate Canadian duty and tax", href: "/customs-calculator" },
      { label: "Professional HS classification", href: "/services/hs-code-classification-canada" },
      { label: "How to Import Into Canada", href: "/resources/how-to-import-into-canada" },
    ],
  },
  "/customs-calculator": {
    eyebrow: "Free landed-cost planning tool",
    heading: "Canadian Customs Duty and Tax Calculator",
    intro: "Estimate Canadian customs duty and import tax using a declared customs value, duty-rate assumption, origin treatment, destination, and shipment context. The result separates user inputs, assumptions, calculated charges, and items that still need verification.",
    sections: [
      { heading: "Worked example: CA$10,000 commercial import", paragraphs: ["For a CA$10,000 customs value and a 6.5% duty assumption, estimated duty is CA$650 before import GST/HST and any brokerage, freight, excise, SIMA, permit, inspection, storage, or delivery charges. Confirm classification and origin before relying on the estimate."] },
      { heading: "What to verify", bullets: ["Canadian tariff classification and current duty rate.", "Country of origin and evidence for any preferential tariff treatment.", "Value-for-duty method, currency conversion, assists, royalties, and related-party adjustments.", "SIMA, excise, quotas, permits, and other government-department requirements."] },
    ],
    links: [{ label: "Open the customs calculator", href: "/customs-calculator" }, { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" }, { label: "How to Import Into Canada", href: "/resources/how-to-import-into-canada" }],
  },
  "/carm-security-calculator": {
    eyebrow: "Free CARM planning tool",
    heading: "CARM Financial Security Calculator",
    intro: "Estimate Release Prior to Payment financial security using the highest monthly duty-and-tax exposure. Compare planning values for written security, a cash deposit, and estimated annual surety premium without confusing those separate amounts.",
    sections: [
      { heading: "Worked example: CA$20,000 highest month", paragraphs: ["Using a 50% written-security planning assumption, CA$20,000 of highest monthly duty-and-tax exposure produces a CA$10,000 preliminary written-security amount before current CBSA minimums, maximums, portal values, and surety underwriting are confirmed."] },
      { heading: "Use the correct exposure", bullets: ["Use the highest month, not the annual average.", "Separate bond face amount from annual surety premium.", "Review coverage after material volume or product-mix changes.", "Confirm the final requirement in CARM and with the surety or licensed broker."] },
    ],
    links: [{ label: "Open the CARM calculator", href: "/carm-security-calculator" }, { label: "CARM bond vs cash guide", href: "/blog/carm-bond-vs-cash-security" }],
  },
  "/tools/pallet-builder": {
    eyebrow: "Free pallet pattern tool",
    heading: "3D Pallet Builder and Carton Calculator",
    intro: "Test compatible carton rotations and layer patterns against standard or custom pallet footprints. Calculate pallet count, loaded height, gross weight, utilization, balance, stability warnings, and a warehouse-ready report.",
    sections: [
      { heading: "Worked example: 24 cartons", paragraphs: ["Enter 24 cartons at 16 × 12 × 10 inches and 18 pounds each, a 48 × 40 inch pallet, and a 60 inch maximum loaded height. The builder evaluates permitted rotations, complete and partial layers, pallet tare, gross weight, and centring rather than relying on volume division."] },
      { heading: "Planning checks", bullets: ["Use outside carton dimensions and gross weight per carton.", "Include pallet deck height and tare weight.", "Respect non-stackable, fragile, orientation, overhang, compression, and warehouse limits.", "Verify wrapping, edge protection, stability, and handling before release."] },
    ],
    links: [{ label: "Open the pallet builder", href: "/tools/pallet-builder" }, { label: "How many pallets fit", href: "/blog/how-many-pallets-fit-container-trailer" }, { label: "Container Loading Calculator", href: "/tools/container-calculator" }],
  },
  "/tools/truck-load-planner": {
    eyebrow: "Free spatial trailer planner",
    heading: "Truck Load Planner and Trailer Calculator",
    intro: "Compare dry van, reefer, flatbed, step-deck, and specialized trailer presets using actual cargo dimensions, payload, stacking, rotation, loading priority, balance guidance, and route context.",
    sections: [
      { heading: "Worked example: 26 standard pallets", paragraphs: ["Enter 26 non-stackable pallets at 48 × 40 × 54 inches and 1,500 pounds each for a common 53-foot dry-van scenario. The planner tests a collision-free two-across pattern, total payload, loading order, and geometric balance. The assembled vehicle must still be scaled before dispatch."] },
      { heading: "Dispatch checks", bullets: ["Confirm the carrier's exact internal dimensions and payload.", "Keep axle legality separate from geometric centre-of-gravity guidance.", "Plan unloading order, securement, segregation, and handling access.", "For open-deck loads, confirm route-specific permits using the complete vehicle configuration."] },
    ],
    links: [{ label: "Open the truck load planner", href: "/tools/truck-load-planner" }, { label: "Trailer load planning guide", href: "/blog/trailer-load-planning-guide" }, { label: "Build pallets first", href: "/tools/pallet-builder" }],
  },
  "/resources/how-to-import-into-canada": {
    eyebrow: "Reviewed August 28, 2026",
    heading: "How to Import Into Canada",
    intro:
      "To import commercial goods into Canada, confirm the importer of record and product admissibility, establish the importer account, classify and value the goods, prepare complete shipping documents, and arrange customs release. These steps reflect the current CARM process for Canadian and non-resident importers.",
    sections: [
      {
        heading: "1. Confirm the importer of record and product admissibility",
        paragraphs: [
          "The importer of record is responsible for the customs declaration, duties and taxes, recordkeeping, and corrections after release. Under DDP terms this may be a foreign seller acting as a non-resident importer; under many other transactions it is the Canadian buyer. Confirm responsibility before booking freight.",
          "Check whether the goods are prohibited, controlled, or regulated. Food, plants, animals, vehicles, medical products, chemicals, firearms, and some steel or textile goods may require permits, licences, certificates, or labelling before shipment.",
        ],
      },
      {
        heading: "2. Obtain a Business Number and import-export RM account",
        paragraphs: [
          "Commercial importers need a nine-digit Business Number and an import-export program account, commonly displayed as BN9 plus RM0001. Legal names and addresses must match the records connected to the BN because mismatches commonly delay CARM registration.",
        ],
      },
      {
        heading: "3. Register in CARM and decide whether RPP is needed",
        paragraphs: [
          "The business account manager registers the importer in the CARM Client Portal and can then delegate access to a customs broker. Release Prior to Payment is separate from portal registration and requires active financial security. Without RPP, payment is generally required before release.",
        ],
      },
      {
        heading: "4. Classify, value, and determine origin",
        paragraphs: [
          "Every product needs a Canadian ten-digit tariff classification. The code determines customs duty and may trigger SIMA duties, permits, quotas, or controls. Determine value for duty using the applicable valuation method, and support preferential tariff treatment with evidence that the goods satisfy the relevant agreement's origin rules.",
        ],
      },
      {
        heading: "5. Estimate duty, GST, and total landed cost",
        paragraphs: [
          "Include product value, freight and insurance, customs duty, import GST, excise or SIMA charges where applicable, brokerage, terminal or courier fees, and inland delivery. Verify classification and origin documents before giving a final landed-cost commitment.",
        ],
      },
      {
        heading: "6. Prepare documents before arrival",
        bullets: [
          "A detailed commercial invoice with buyer, seller, goods, quantity, currency, prices, and origin.",
          "A packing list with package count, dimensions, net weight, and gross weight.",
          "The bill of lading, air waybill, or courier waybill.",
          "Origin certification, permits, licences, test reports, and product certificates where required.",
        ],
      },
      {
        heading: "7. Arrange customs release and delivery",
        paragraphs: [
          "The carrier reports the cargo while the importer or licensed customs broker submits release and accounting data. Send documents early. Inactive importer accounts, vague descriptions, inconsistent values, and missing permits can lead to holds and storage charges.",
        ],
      },
      {
        heading: "8. Keep records and correct errors",
        paragraphs: [
          "Import responsibility continues after delivery. Retain invoices, origin support, classifications, valuation records, permits, and accounting documents. Review the entry after release and correct material errors within the applicable deadline.",
        ],
      },
    ],
    links: [
      { label: "Canadian HS Code Finder", href: "/tools/hs-code-finder" },
      { label: "Customs Duty Calculator", href: "/customs-calculator" },
      { label: "CARM Security Calculator", href: "/carm-security-calculator" },
      { label: "Customs Clearance Services", href: "/services/customs-clearance-canada" },
    ],
  },
};

function renderSections(sections: SeoSection[]): string {
  return sections
    .map((section) => {
      const paragraphs = (section.paragraphs ?? [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join("");
      const bullets = section.bullets?.length
        ? `<ul>${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}</ul>`
        : "";
      return `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphs}${bullets}</section>`;
    })
    .join("");
}

function getBlogSeoContent(route: RouteMeta): SeoPageContent | undefined {
  const slug = route.path.match(/^\/blog\/([^/]+)$/)?.[1];
  if (!slug) return undefined;

  const post = POSTS.find((candidate) => candidate.slug === slug);
  if (!post) return undefined;

  const sections: SeoSection[] = [
    { heading: "Key takeaways", bullets: post.keyTakeaways },
    ...post.sections.map((section) => ({
      heading: section.heading,
      paragraphs: [
        ...(Array.isArray(section.body) ? section.body : section.body ? [section.body] : []),
        ...(section.note ? [`Note: ${section.note}`] : []),
      ],
      bullets: section.list,
    })),
  ];

  const relatedLinks = (post.relatedPosts ?? [])
    .map((relatedSlug) => POSTS.find((candidate) => candidate.slug === relatedSlug))
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .slice(0, 3)
    .map((candidate) => ({ label: candidate.title, href: `/blog/${candidate.slug}` }));

  return {
    eyebrow: "AccessToNorth guide",
    heading: post.title,
    intro: post.intro,
    sections,
    links: [
      ...relatedLinks,
      ...(post.cta ? [{ label: post.cta.text, href: post.cta.href }] : []),
      { label: "All importer guides", href: "/blog" },
    ],
    sources: post.sources,
  };
}

export function renderStaticSeoContent(route: RouteMeta): string {
  const content = PRIORITY_CONTENT[route.path] ?? getBlogSeoContent(route) ?? {
    eyebrow: "AccessToNorth.com",
    heading: route.title.replace(/\s*[|—-]\s*AccessToNorth\.com.*$/i, ""),
    intro: route.description,
    sections: [],
    links: [
      { label: "AccessToNorth home", href: "/" },
      { label: "Services", href: "/services" },
      { label: "Free trade tools", href: "/tools" },
      { label: "Importer resources", href: "/resources" },
    ],
  } satisfies SeoPageContent;

  const links = (content.links ?? [])
    .map((link) => `<a href="${escapeHtml(canonicalUrl(link.href))}">${escapeHtml(link.label)}</a>`)
    .join("");
  const sources = (content.sources ?? [])
    .map(
      (source) =>
        `<li><a href="${escapeHtml(source.href)}" rel="noopener noreferrer">${escapeHtml(source.label)}</a></li>`,
    )
    .join("");

  return `<div data-prerender-content>
    <header><a class="brand" href="${canonicalUrl("/")}">AccessToNorth<span>.com</span></a></header>
    <main>
      ${content.eyebrow ? `<p class="eyebrow">${escapeHtml(content.eyebrow)}</p>` : ""}
      <h1>${escapeHtml(content.heading)}</h1>
      <p class="intro">${escapeHtml(content.intro)}</p>
      ${renderSections(content.sections)}
      ${sources ? `<aside><h2>Official sources</h2><ul>${sources}</ul></aside>` : ""}
      ${links ? `<nav aria-label="Related pages">${links}</nav>` : ""}
      <noscript><p class="notice">Interactive features require JavaScript, but the guidance and page links above remain available.</p></noscript>
    </main>
  </div>`;
}

export const STATIC_SEO_STYLE = `<style data-prerender="fallback">
  [data-prerender-content]{min-height:100vh;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.65}
  [data-prerender-content] header{background:#fff;border-bottom:1px solid #e2e8f0;padding:18px max(24px,calc((100vw - 1080px)/2))}
  [data-prerender-content] .brand{color:#0f172a;font-size:24px;font-weight:800;text-decoration:none;letter-spacing:-.04em}
  [data-prerender-content] .brand span{color:#0784f9}
  [data-prerender-content] main{box-sizing:border-box;max-width:860px;margin:0 auto;padding:64px 24px 80px}
  [data-prerender-content] .eyebrow{color:#0879df;font-size:13px;font-weight:750;letter-spacing:.12em;text-transform:uppercase;margin:0 0 10px}
  [data-prerender-content] h1{font-size:clamp(32px,5vw,52px);line-height:1.1;letter-spacing:-.035em;margin:0 0 20px}
  [data-prerender-content] .intro{font-size:20px;color:#475569;margin:0 0 44px}
  [data-prerender-content] section{margin:34px 0}
  [data-prerender-content] h2{font-size:23px;line-height:1.25;margin:0 0 12px}
  [data-prerender-content] p,[data-prerender-content] li{color:#475569}
  [data-prerender-content] ul{padding-left:22px}
  [data-prerender-content] nav{display:flex;flex-wrap:wrap;gap:10px;margin-top:44px;padding-top:24px;border-top:1px solid #e2e8f0}
  [data-prerender-content] nav a{border:1px solid #bfdbfe;border-radius:999px;background:#fff;color:#086dcc;padding:9px 14px;text-decoration:none;font-weight:650}
  [data-prerender-content] .notice{font-size:13px;margin-top:28px}
  @media(max-width:640px){[data-prerender-content] main{padding-top:40px}[data-prerender-content] .intro{font-size:17px}}
</style>`;
