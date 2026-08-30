# AccessToNorth tools roadmap

This is the working backlog for accuracy, usefulness, and product polish across the free tools.

## Completed in the current upgrade

- [x] Make tariff replacement transactional so a failed import cannot erase the working dataset.
- [x] Import searchable 8-digit tariff items and complete 10-digit Canadian classifications.
- [x] Build hierarchical descriptions so ordinary product searches can find specific tariff rows.
- [x] Detect an incomplete tariff database at startup, rebuild it, and show a clear unavailable state instead of empty results.
- [x] Correct country-treatment defaults and require explicit rules-of-origin confirmation before preferential rates are applied.
- [x] Correct commercial-import tax treatment, Nova Scotia's current 14% HST, bulk-origin logic, specific duties, and CARM cash security.
- [x] Replace fabricated HS confidence with actual search relevance and a clear classification disclaimer.
- [x] Replace browser-print customs reports with branded downloadable PDFs that support multi-page tables.
- [x] Persist Freight Quote and Shipment Tracking waitlist submissions and keep unfinished tools out of search indexes.
- [x] Remove the duplicated third-party chat bubble and use one compact first-party launcher.
- [x] Parse quoted and multi-line CSV fields safely in tariff and bulk customs uploads.
- [x] Replace the Freight Quote waitlist with a structured RFQ, document upload, request ID, CRM/admin record, and customer/operations notifications.
- [x] Replace the Shipment Tracking placeholder with secure AccessToNorth order and RFQ milestone lookup.
- [x] Add official Canadian/US truck-dimension screening references and jurisdiction permit links to route results.
- [x] Correct open-deck road-height screening so the trailer deck height is included.

## Next accuracy and data work

- [ ] Add a scheduled tariff-source update job with import validation, change summaries, and rollback.
- [ ] Add SIMA, surtax, excise, quota, and permit flags from maintained official datasets.
- [ ] Add binding-ruling and advance-ruling reference links to HS classification results.
- [ ] Add a configurable axle-reaction model using tractor/trailer tare, kingpin, axle count, and axle spacing; require scale confirmation.
- [ ] Add maintained seasonal restrictions and machine-readable province/state permit thresholds beyond the current official baseline links.
- [x] Keep truck routing disabled until a supported Google Maps key is configured and label the route as ordinary driving directions, not truck-clearance routing.
- [ ] Add golden calculation fixtures for representative commercial and personal imports.

## Next product tools

- [x] Turn Freight Quote into a structured RFQ builder with shipment details, documents, and CRM handoff.
- [x] Connect Shipment Tracking to portal orders and expose the maintained service milestones.
- [x] Add server-side Freightos-attributed market ranges with 12-hour normalized caching, public-feed quota protection, clear exclusions, and a no-re-entry verified-quote handoff. See `SHIPPING_RATE_API_RESEARCH.md`.
- [ ] Add Canada Post parcel rating after an AccessToNorth Canada Post developer account is available.
- [ ] Add AccessToNorth rate management for uploaded carrier/agent tariffs, validity dates, surcharges, margins, and lane-specific overrides.
- [ ] Add an invoice and packing-list validator for totals, currencies, Incoterms, parties, and missing customs fields.
- [ ] Add a CBM and chargeable-weight calculator for air, LCL, parcel, and courier modes.
- [ ] Add a CERS readiness checker and filing checklist.
- [ ] Add an Incoterms responsibility and landed-cost comparison tool.
- [ ] Add universal file extraction shared by customs, container, truck, pallet, and RFQ workflows.

## UX and maintainability

- [ ] Add shareable saved estimates and branded exports for paid accounts.
- [ ] Add accessible empty/error states and keyboard-flow tests to every tool.
- [ ] Split the largest calculator pages into tested domain modules and reusable result components.
- [ ] Add privacy-safe product analytics for search failures, abandoned calculations, and export usage.
