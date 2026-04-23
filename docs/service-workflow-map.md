# Service-by-service delivery workflow map

One page that maps every purchasable service to: what fires at checkout, what intake is collected, what tasks run, what the admin does, what the customer sees, and what's automated vs manual today.

The source of truth for task definitions is [`server/seedTaskTemplates.ts`](../server/seedTaskTemplates.ts). This document is the human-readable summary — update it when you change the templates.

## Common to every service

**At checkout (automatic):**
1. Stripe payment succeeds → webhook + `/api/cart-checkout/complete` converge.
2. `provisionServicesForOrder()` runs (idempotent):
   - `find-or-create` client row in `clients` table by email.
   - Create `client_services` row (status: `onboarding`).
   - Copy task templates → `fulfillment_tasks` rows with due dates.
   - Create `onboarding_submissions` row with 60-day token.
   - Send `buildOnboardingRequestEmail` to the customer with a link to `/onboarding/:token`.
   - Log `service.provisioned` event with `actor_type: system`.

**Customer side:**
- Receives confirmation email + onboarding email.
- Fills the per-service intake form at `/onboarding/:token` (save progress + submit).
- Tracks progress in the client portal at `/portal` (login with email + order ID).

**Admin side:**
- Sees the new client_service in `/admin/crm` → Services.
- Gets stage-by-stage tips from the Admin Copilot.
- Uses the "View as client" button to see exactly what the customer sees.
- Transitions tasks through statuses: `not_started` → `in_progress` → (`waiting` / `blocked`) → `delivered`.
- Completion cascade: all tasks delivered → `client_service.status = completed` → `buildServiceCompletionEmail` auto-sends.

## Per service

### Business Number (BN) — $99

**Category:** registration. **Typical CRA SLA:** 5–10 business days after filing.

| # | Task | Handled by | Waiting on | Est. days | What happens |
|---|---|---|---|---|---|
| 1 | Send authorization form (RC59-B) | automation | client | 1 | Email RC59-B for e-signature |
| 2 | Collect onboarding intake | automation | client | 2 | Structured form: entity type, owners, business activity |
| 3 | Review intake + prepare RC1 filing | internal | internal | 1 | Manual review + RC1 prep |
| 4 | Submit RC1 to CRA | internal | agency | 1 | File via Represent a Client or fax; capture reference |
| 5 | Monitor CRA issuance | internal | agency | 10 | Check RaC daily; follow up if > 10 days |
| 6 | Deliver BN + confirmation | internal | — | 1 | Send BN letter + account summary via portal |

**Automation today:** steps 1, 2 fire automatically at checkout. Steps 3–6 are manual admin actions.
**Future automation:** auto-fill RC1 from intake data (step 3), auto-check RaC via API (step 5).

### GST/HST Registration — $249

**Category:** registration. **Typical CRA SLA:** 5–10 business days.

| # | Task | Handled by | Waiting on | Est. days |
|---|---|---|---|---|
| 1 | Send authorization form (RC59-B) | automation | client | 1 |
| 2 | Collect onboarding intake (+ regime pref, reporting period) | automation | client | 2 |
| 3 | Determine regime (simplified vs normal) | internal | internal | 1 |
| 4 | Prepare + submit RT account application | internal | agency | 1 |
| 5 | Monitor CRA issuance | internal | agency | 10 |
| 6 | Deliver GST/HST account + first-filing guidance | internal | — | 1 |

**Automation today:** 1, 2 auto. 3–6 manual.
**Key intake fields the AI processor extracts:** `regimePreference`, `reportingPeriodPreference`, `effectiveDate` — feeds into step 3's regime decision.

### Non-Resident Setup — $399

**Category:** registration. **Typical CRA SLA:** 10–20 business days (non-resident queue is slower).

| # | Task | Handled by | Waiting on | Est. days |
|---|---|---|---|---|
| 1 | Send non-resident authorization package | automation | client | 1 |
| 2 | Collect non-resident intake (treaty, sales channel, inventory location) | automation | client | 3 |
| 3 | Treaty + regime analysis | internal | internal | 2 |
| 4 | Submit non-resident BN + RT application | internal | agency | 2 |
| 5 | Monitor CRA non-resident queue (weekly follow-up) | internal | agency | 15 |
| 6 | Deliver account package + filing schedule + remittance instructions | internal | — | 1 |

**Automation today:** 1, 2 auto. 3–6 manual.
**Specifics collected:** `countryOfResidence`, `foreignTaxId`, `canadianSalesChannel` (Shopify / FBA / marketplace), `canadianFulfillment` (yes/no).

### CARM Portal Setup — $499

**Category:** carm. **Typical CBSA SLA:** 10–15 business days for full onboarding.

| # | Task | Handled by | Waiting on | Est. days |
|---|---|---|---|---|
| 1 | Send CARM delegation authorization | automation | client | 1 |
| 2 | Collect importer intake | automation | client | 3 |
| 3 | Verify or register RM import account | internal | agency | 5 |
| 4 | Claim business account in CCP | internal | agency | 2 |
| 5 | Coordinate financial security (bond vs cash) | internal | client | 5 |
| 6 | Delegate customs broker | internal | internal | 2 |
| 7 | Deliver CARM activation summary | internal | — | 1 |

**Automation today:** 1, 2 auto. 3–7 manual.

### RPP / Security Coordination — $395

**Category:** carm. **Typical SLA:** 7–14 business days (surety dependent).

| # | Task | Handled by | Waiting on | Est. days |
|---|---|---|---|---|
| 1 | Collect security intake | automation | client | 2 |
| 2 | Calculate required security amount (50% of peak monthly duty) | internal | internal | 1 |
| 3 | Coordinate with surety (if bond chosen) | external_agency | agency | 7 |
| 4 | Post security in CCP + enroll in RPP | internal | agency | 3 |
| 5 | Verify RPP activation + deliver summary | internal | — | 1 |

### Customs Clearance — LVS $145 / Commercial $295

**Category:** customs. **Typical SLA:** 1–2 business days (shipment-driven).

**LVS tasks (4):** collect docs → classify + valuation review → file release → confirm + deliver.
**Commercial tasks (4):** collect docs → classification + origin + valuation review → file B3 commercial release against CARM security → confirm + deliver.

Note: these are shipment-specific and assume the customer already has an active importer BN/CARM account. For first-time importers, they should buy CARM Portal Setup first.

### B13 Export Declaration — $125

**Category:** export. **Typical SLA:** 1 business day.

| # | Task | Handled by | Waiting on | Est. days |
|---|---|---|---|---|
| 1 | Collect export data | automation | client | 1 |
| 2 | Validate + submit B13 via CERS | internal | agency | 1 |
| 3 | Deliver confirmation to client | internal | — | 1 |

### Business Starter Bundle — $299 (BN + GST/HST)

Combines the BN and GST/HST flows into a single engagement with one authorization, one intake, and one filing package. 5 tasks total (merged).

### Importer Launch Kit — $1,500 (BN + GST/HST + CARM + RPP)

Largest engagement. 6 tasks covering the full CRA + CBSA setup in one coordinated package. Typical SLA: 15–20 business days end-to-end.

## Automation status (today vs target)

| Stage | Today | Target |
|---|---|---|
| Checkout → provisioning | ✅ Automated | — |
| Authorization form emails | ✅ Email template + link | 🔜 DocuSign/SignWell integration for real e-sign |
| Onboarding intake | ✅ Tokenized form, per-service schema | ✅ |
| Intake → AI config extraction | 🟡 Stub pass-through normalize | 🔜 Claude extraction behind `ENABLE_ONBOARDING_AI=1` |
| CRA filing prep | ❌ Manual | 🔜 RC1 / RT form auto-fill from intake |
| CRA submission | ❌ Manual (Represent a Client) | 🔜 Long-term: CRA XML API if eligible |
| CRA status monitoring | ❌ Manual check | 🔜 Scheduled job to scan RaC |
| Client delivery | ✅ Portal + completion email | ✅ |

## How to add a new service

1. Add a `service_catalog` row + task template block to [`server/seedTaskTemplates.ts`](../server/seedTaskTemplates.ts).
2. Add the onboarding form schema to [`server/onboardingForms.ts`](../server/onboardingForms.ts).
3. Add a service-key → display-name mapping if the service isn't inferrable from `serviceType` in [`server/servicesProvisioning.ts`](../server/servicesProvisioning.ts).
4. Run `npm run db:push` (no schema change, just seed) then restart — `seedTaskTemplates` is idempotent and auto-runs.
5. Update this doc with the new service's row.

Next checkout of that service will auto-provision end-to-end.
