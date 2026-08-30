# Shipping rate API research

Updated: 2026-08-30

## Decision

There is no credible, unlimited, free API that returns binding door-to-door parcel, air, LCL, FCL, trucking, drayage, oversized, and project-cargo rates worldwide.

The practical no-subscription product is a two-stage calculator:

1. Return an immediate **market estimate** from a free source or AccessToNorth's maintained rate data.
2. Transfer the complete calculation into the existing Freight Quote workflow for a **verified quote**.

Do not describe an estimated range as a live or guaranteed carrier quote.

## Sources reviewed

| Source | Recurring software fee | Coverage | What it returns | Decision |
| --- | --- | --- | --- | --- |
| Freightos public shipping calculator API | None documented; no API key required | International FCL and box/pallet-style estimates | Marketplace minimum/maximum estimate in JSON or XML | Use for public market estimates, subject to its terms, attribution, caching, and fallback |
| Freightos Terminal API | Paid platform access | Ocean and air market benchmarks | Granular benchmark and historical data | Do not use while the no-subscription constraint remains |
| Canada Post Developer Program | Free to join | Canadian and international parcel services originating through Canada Post | Eligible services, prices, transit times, expected delivery | Good direct parcel source after creating an AccessToNorth Canada Post developer account |
| UPS Rating API | No separate API subscription shown | UPS services | Published or account rates | Optional adapter; requires carrier credentials and must follow UPS usage terms |
| FedEx Rates and Transit Times API | No separate API subscription shown | FedEx parcel/express services | Available services, account rates, transit times | Optional adapter; requires a FedEx account and credentials |
| DHL Express MyDHL API | No separate monthly API price shown | Global time-definite courier | Indicative account rates and delivery estimates | Optional adapter for AccessToNorth's own DHL shipments; active DHL account required and redistribution is restricted |
| DHL Freight Price Quote API | No public subscription price shown | DHL Freight products in Europe | Contract-based freight amount and additions | Not a worldwide public source; only useful with a DHL Freight contract |
| Shippo API Starter | CA/US/global parcel carriers | Parcel rates and labels | Free tier is limited; charges apply after the allowance and some non-label calls are billed | Possible later parcel adapter, but not a free unlimited public calculator |
| EasyPost | Global parcel carrier network | Parcel rates, labels, tracking | Free wallet-carrier allowance; bringing external carrier accounts has a monthly base fee | Reject for the current no-monthly-fee requirement |
| Maersk developer APIs | Carrier/customer access and OAuth | Maersk ocean, LCL, and air workflows | Primarily booking and shipment operations tied to Maersk access | Do not treat as a neutral public rate source; revisit after commercial API approval |

## Recommended phase-one architecture

### Public freight estimate

- Add a server-side `freight-estimate` provider adapter for the documented Freightos public calculator endpoint.
- Support FCL and boxes/pallets first; expose only modes that return a valid result.
- Normalize the response into minimum, maximum, currency, transport mode, source, retrieval time, and confidence/coverage notes.
- Display `Market estimate — not a binding quote` beside every result.
- Display the Freightos credit and link required by its published terms.
- Cache identical normalized lane/cargo requests for 6–12 hours.
- Rate-limit anonymous requests and call the source only after form submission, never on every keystroke.
- If the source is unavailable, keep the entered shipment data and offer the verified-quote workflow without showing a fabricated number.

### Verified quote handoff

- Send origin, destination, mode, cargo, estimate range, currency, and selected service into the existing Freight Quote form.
- Let the customer upload a packing list or commercial documents without re-entering dimensions.
- Clearly separate `Estimated market range` from `AccessToNorth verified quote` in the CRM and customer UI.

### Parcel rates

- Add Canada Post first because its developer program is free and the rating service returns price and transit time.
- Add UPS, FedEx, or DHL only after AccessToNorth has approved carrier accounts and the intended public display complies with each carrier's terms.
- Keep each carrier behind a common provider interface so a provider can be disabled without breaking the calculator.

### AccessToNorth-owned rates

- Build a small rate-management layer for uploaded carrier/agent tariffs, origin and destination charges, validity dates, equipment, minimums, weight breaks, surcharges, and markup rules.
- Give owned contract rates priority over public market estimates.
- Keep the public estimate as a comparison/fallback, not the main commercial source once owned rates exist.

## Required safeguards

- Server-side credentials only; never expose carrier/API keys in browser code.
- Currency and validity date visible on every result.
- Separate prepaid/collect, port-to-port/door-to-door, and included/excluded charges.
- Never infer customs duty, terminal fees, demurrage, detention, permits, exams, insurance, or special handling unless an explicit source provides them.
- Do not scrape carrier websites or consumer calculators.
- Store source name, request fingerprint, raw response reference, and calculation version for auditability.

## Optional AI-assisted market context

OpenAI web search can cheaply add current lane context, disruption notices, general rate-increase announcements, and cited market articles. It should not be treated as the primary quote source: most bookable carrier rates sit behind authenticated forms, and search results commonly omit origin/destination charges and accessorials.

At the prices published on 2026-08-30, one web-search action costs USD $0.01 plus model input/output tokens. A tightly constrained request using a low-cost model should normally cost about USD $0.011–$0.013 in total. Multiple search actions increase that roughly linearly. The recommended production policy is one search action only on a cache miss or unsupported/suspicious lane, with a normalized 12–24 hour cache and a visible source list.

## Official references

- Freightos public estimate API: https://ship.freightos.com/api/shippingCalculator
- Freightos developer documentation: https://developers.freightos.com/
- Canada Post Get Rates: https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/services/rating/getrates/default.jsf
- UPS Rating API: https://developer.ups.com/api/reference?tag=Rating
- FedEx developer portal: https://developer.fedex.com/
- DHL Express MyDHL API: https://developer.dhl.com/api-reference/dhl-express-mydhl-api
- DHL Freight Price Quote API: https://developer.dhl.com/api-reference/price-quote-dhl-freight
- Shippo API pricing: https://goshippo.com/pricing/api
- EasyPost billing: https://support.easypost.com/hc/en-us/articles/360042414212-Billing-Payments
- Maersk developer portal: https://developer.maersk.com/
- OpenAI API pricing: https://developers.openai.com/api/docs/pricing
- OpenAI web search guide: https://developers.openai.com/api/docs/guides/tools-web-search
