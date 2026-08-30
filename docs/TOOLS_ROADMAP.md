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

## Next accuracy and data work

- [ ] Add a scheduled tariff-source update job with import validation, change summaries, and rollback.
- [ ] Add SIMA, surtax, excise, quota, and permit flags from maintained official datasets.
- [ ] Add binding-ruling and advance-ruling reference links to HS classification results.
- [ ] Add audited axle, jurisdiction, and oversize/overweight permit rules to the truck planner.
- [ ] Enable truck routing only after a supported maps key and route restrictions are configured.
- [ ] Add golden calculation fixtures for representative commercial and personal imports.

## Next product tools

- [ ] Turn Freight Quote into a structured RFQ builder with shipment details, documents, and CRM handoff.
- [ ] Connect Shipment Tracking to portal orders and expose document, customs, release, and delivery milestones.
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
