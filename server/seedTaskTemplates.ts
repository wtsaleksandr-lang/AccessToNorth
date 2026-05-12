/**
 * Seeds per-service fulfillment task templates. Runs idempotently on boot —
 * if templates for a service already exist, they're replaced so schema
 * changes propagate without manual cleanup.
 *
 * Add a new service? Add an entry to TEMPLATES below and call db:push.
 */
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  serviceCatalog,
  serviceTaskTemplates,
} from "@shared/schema";

interface TaskTemplateSeed {
  orderIndex: number;
  title: string;
  description: string;
  defaultHandledBy?: "internal" | "automation" | "external_agency";
  defaultWaitingOn?: "client" | "internal" | "agency" | null;
  estimatedDays?: number;
}

interface ServiceSeed {
  serviceKey: string;
  name: string;
  category: string;
  priceCAD: number;
  description: string;
  tasks: TaskTemplateSeed[];
}

const SERVICES: ServiceSeed[] = [
  // ----- CRA REGISTRATIONS ---------------------------------------------
  {
    serviceKey: "bn",
    name: "Business Number (BN) Registration",
    category: "registration",
    priceCAD: 99,
    description: "Register a 9-digit CRA Business Number. Foundation for all CRA tax accounts.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send authorization form (RC59-B)",
        description: "Email the CRA Business Consent form to the client for e-signature.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect onboarding intake",
        description: "Client fills the structured intake form (entity type, owners, activity).",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 2,
      },
      {
        orderIndex: 30,
        title: "Review intake + prepare RC1 filing",
        description: "Internal review of intake. Prepare Form RC1 Business Number application.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 40,
        title: "Submit RC1 to CRA",
        description: "File RC1 via CRA Represent a Client or fax. Capture submission reference.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 1,
      },
      {
        orderIndex: 50,
        title: "Monitor CRA issuance",
        description: "Check CRA Represent a Client for BN issuance. Follow up if delayed beyond 10 business days.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 10,
      },
      {
        orderIndex: 60,
        title: "Deliver BN + confirmation to client",
        description: "Send BN letter + account summary to client via portal. Close engagement.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  {
    serviceKey: "gst_hst",
    name: "GST/HST Registration",
    category: "registration",
    priceCAD: 249,
    description: "Register for GST/HST with the CRA. Includes BN if not already held. Full or simplified regime.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send authorization form (RC59-B)",
        description: "Email the CRA Business Consent form to the client for e-signature.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect onboarding intake",
        description: "Entity details, estimated revenue, reporting period preference, regime choice.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 2,
      },
      {
        orderIndex: 30,
        title: "Determine regime (simplified vs normal)",
        description: "Based on intake, confirm simplified vs full GST/HST regime. Document the decision.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 40,
        title: "Prepare + submit RT account application",
        description: "File GST/HST application (with RC1 if no BN exists) via CRA portal.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 1,
      },
      {
        orderIndex: 50,
        title: "Monitor CRA issuance",
        description: "Watch for RT account activation. Typical 5–10 business days.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 10,
      },
      {
        orderIndex: 60,
        title: "Deliver GST/HST account + first-filing guidance",
        description: "Send account number, effective date, reporting period, and first-return deadline.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  {
    serviceKey: "non_resident_tax",
    name: "Non-Resident Setup",
    category: "registration",
    priceCAD: 399,
    description: "Full non-resident Business Number + GST/HST setup. Simplified regime or normal.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send non-resident authorization package",
        description: "Email RC59-B + non-resident BN attestation forms for e-signature.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect non-resident intake",
        description: "Foreign entity details, country of residence, Canadian sales profile, treaty applicability.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 3,
      },
      {
        orderIndex: 30,
        title: "Treaty + regime analysis",
        description: "Confirm simplified vs normal regime; identify treaty relief where applicable.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 2,
      },
      {
        orderIndex: 40,
        title: "Submit non-resident BN + RT application",
        description: "File via CRA non-resident division. Capture submission reference.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 2,
      },
      {
        orderIndex: 50,
        title: "Monitor CRA non-resident queue",
        description: "Non-resident applications typically take 10–20 business days. Follow up weekly.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 15,
      },
      {
        orderIndex: 60,
        title: "Deliver account package + filing schedule",
        description: "BN + RT details, effective date, reporting cadence, first-return deadline, and tax-remittance instructions.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  // ----- CARM / IMPORTER SETUP -----------------------------------------
  {
    serviceKey: "carm_portal",
    name: "CARM Portal Setup",
    category: "carm",
    priceCAD: 499,
    description: "End-to-end CBSA CARM Client Portal onboarding for commercial importers.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send CARM delegation authorization",
        description: "Email CARM delegation forms + instructions to assign representative access.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect importer intake",
        description: "Import profile, highest monthly duty, RM account status, existing broker relationship.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 3,
      },
      {
        orderIndex: 30,
        title: "Verify or register RM import account",
        description: "Confirm RM extension on BN; if absent, apply for RM via CRA.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 5,
      },
      {
        orderIndex: 40,
        title: "Claim business account in CCP",
        description: "Complete business-account claim in CARM Client Portal.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 2,
      },
      {
        orderIndex: 50,
        title: "Coordinate financial security",
        description: "Walk client through bond vs cash vs RPP; submit security application.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "client",
        estimatedDays: 5,
      },
      {
        orderIndex: 60,
        title: "Delegate customs broker",
        description: "Configure broker access in CCP. Verify broker acceptance.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 2,
      },
      {
        orderIndex: 70,
        title: "Deliver CARM activation summary",
        description: "Send client a summary of accounts, credentials path, broker link, and next-month SOA schedule.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  {
    serviceKey: "rpp_bond",
    name: "RPP / Security Coordination",
    category: "carm",
    priceCAD: 395,
    description: "Release Prior to Payment program enrollment and customs bond coordination.",
    tasks: [
      {
        orderIndex: 10,
        title: "Collect security intake",
        description: "Projected monthly duty + tax, preference for bond vs cash.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 2,
      },
      {
        orderIndex: 20,
        title: "Calculate required security amount",
        description: "Use the CARM Security formula (50% of peak monthly duty+tax).",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 30,
        title: "Coordinate with surety (if bond)",
        description: "Introduce client to bonded surety; track application status.",
        defaultHandledBy: "external_agency",
        defaultWaitingOn: "agency",
        estimatedDays: 7,
      },
      {
        orderIndex: 40,
        title: "Post security in CCP + enroll in RPP",
        description: "Upload bond or make cash deposit. Submit RPP enrollment form.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 3,
      },
      {
        orderIndex: 50,
        title: "Verify RPP activation + deliver summary",
        description: "Confirm RPP is active. Send client summary + monthly SOA cadence.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  // ----- CUSTOMS CLEARANCE COORDINATION --------------------------------
  // AccessToNorth coordinates and prepares paperwork. The customer's licensed
  // customs broker files the declaration with CBSA. Internal tasks reflect
  // that handoff.
  {
    serviceKey: "clearance-lvs",
    name: "Low-Value Import Clearance Coordination (LVS)",
    category: "customs",
    priceCAD: 145,
    description: "Commercial customs clearance coordination for shipments under CA$2,500 — paperwork prepared for filing by the customer's licensed broker.",
    tasks: [
      {
        orderIndex: 10,
        title: "Collect shipment documents",
        description: "Commercial invoice, waybill, HS code (if known), origin certificate.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Classify + valuation review",
        description: "Confirm HS code and value for duty. Flag any SIMA/OGD considerations.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 30,
        title: "Prepare release package + hand off to broker",
        description: "Assemble LVS release package and broker-handoff documentation. Send to the customer's licensed customs broker for filing with CBSA. Capture broker's release reference once filed.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 1,
      },
      {
        orderIndex: 40,
        title: "Confirm release + deliver docs",
        description: "Relay broker's release confirmation + duty breakdown to client.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  {
    serviceKey: "clearance-commercial",
    name: "Commercial Import Clearance Coordination",
    category: "customs",
    priceCAD: 295,
    description: "Commercial customs clearance coordination for shipments over CA$2,500 — declaration prepared for filing by the customer's licensed broker.",
    tasks: [
      {
        orderIndex: 10,
        title: "Collect shipment documents",
        description: "Commercial invoice, waybill, packing list, HS code, CUSMA cert if applicable.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Classification + origin + valuation review",
        description: "Confirm 10-digit HS, origin qualification, and customs valuation method.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 30,
        title: "Prepare B3 commercial-release package + hand off to broker",
        description: "Assemble B3 entry package + broker-handoff documentation against CARM security. Send to the customer's licensed customs broker for filing with CBSA. Capture broker's release reference once filed.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 2,
      },
      {
        orderIndex: 40,
        title: "Confirm release + deliver documentation",
        description: "Relay broker's release confirmation, duty and GST breakdown, and assemble record-retention package.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  // ----- EXPORT + COMPLIANCE ------------------------------------------
  {
    serviceKey: "b13_export",
    name: "B13 Export Declaration Preparation",
    category: "export",
    priceCAD: 125,
    description: "Canadian Export Declaration paperwork prepared for filing via CERS by the customer's licensed broker (for goods over CA$2,000).",
    tasks: [
      {
        orderIndex: 10,
        title: "Collect export data",
        description: "Exporter details, consignee, HS code, value, destination, mode of transport, departure.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Validate + prepare B13 CERS package + hand off to broker",
        description: "Verify completeness and assemble the CERS-ready declaration package. Hand off to the customer's licensed broker for filing within the required window. Capture the broker's submission reference.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 1,
      },
      {
        orderIndex: 30,
        title: "Deliver confirmation to client",
        description: "Relay broker's CERS submission reference and export permit (if applicable).",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  // ----- BUNDLES -------------------------------------------------------
  {
    serviceKey: "bundle_business_starter",
    name: "Business Starter Bundle",
    category: "registration",
    priceCAD: 299,
    description: "Business Number + GST/HST in one engagement.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send authorization forms (RC59-B)",
        description: "Email the CRA Business Consent form for e-signature.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect combined intake",
        description: "Entity, owners, activity, estimated revenue, reporting period preference.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 2,
      },
      {
        orderIndex: 30,
        title: "Prepare combined filing (RC1 + RT)",
        description: "Single filing covers BN issuance and GST/HST account in one package.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 1,
      },
      {
        orderIndex: 40,
        title: "Submit to CRA + monitor",
        description: "File, capture submission reference, and monitor for both BN and RT issuance.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 10,
      },
      {
        orderIndex: 50,
        title: "Deliver combined account package",
        description: "BN + RT account numbers, effective dates, reporting period, first-return deadline.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },

  {
    serviceKey: "bundle_complete_importer",
    name: "Importer Launch Kit",
    category: "carm",
    priceCAD: 1500,
    description: "BN + GST/HST + CARM + RPP in a single coordinated engagement.",
    tasks: [
      {
        orderIndex: 10,
        title: "Send full authorization package",
        description: "RC59-B for CRA + CARM delegation for CBSA.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 1,
      },
      {
        orderIndex: 20,
        title: "Collect combined intake (importer)",
        description: "Entity details, import profile, projected monthly duty, broker preference.",
        defaultHandledBy: "automation",
        defaultWaitingOn: "client",
        estimatedDays: 3,
      },
      {
        orderIndex: 30,
        title: "File BN + GST/HST + RM with CRA",
        description: "Combined filing covering all CRA accounts needed for import operations.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 10,
      },
      {
        orderIndex: 40,
        title: "Claim CARM business account + post security",
        description: "Complete CCP claim; coordinate RPP + bond or cash deposit.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "agency",
        estimatedDays: 10,
      },
      {
        orderIndex: 50,
        title: "Delegate customs broker",
        description: "Configure and verify broker access in CARM.",
        defaultHandledBy: "internal",
        defaultWaitingOn: "internal",
        estimatedDays: 2,
      },
      {
        orderIndex: 60,
        title: "Deliver importer launch package",
        description: "Complete summary: all account numbers, CARM activation, RPP status, first-month SOA schedule, broker link.",
        defaultHandledBy: "internal",
        defaultWaitingOn: null,
        estimatedDays: 1,
      },
    ],
  },
];

export async function seedTaskTemplates(): Promise<void> {
  let servicesUpserted = 0;
  let templatesInserted = 0;

  for (const svc of SERVICES) {
    // Upsert service_catalog row
    const existingCatalog = await db
      .select()
      .from(serviceCatalog)
      .where(eq(serviceCatalog.serviceKey, svc.serviceKey))
      .limit(1);
    if (existingCatalog.length === 0) {
      await db.insert(serviceCatalog).values({
        serviceKey: svc.serviceKey,
        name: svc.name,
        category: svc.category,
        deliveryPattern: "one_time",
        priceCAD: svc.priceCAD,
        description: svc.description,
        isActive: true,
      });
    } else {
      await db
        .update(serviceCatalog)
        .set({
          name: svc.name,
          category: svc.category,
          priceCAD: svc.priceCAD,
          description: svc.description,
          isActive: true,
        })
        .where(eq(serviceCatalog.serviceKey, svc.serviceKey));
    }
    servicesUpserted += 1;

    // Replace task templates
    await db
      .delete(serviceTaskTemplates)
      .where(eq(serviceTaskTemplates.serviceKey, svc.serviceKey));
    if (svc.tasks.length) {
      await db.insert(serviceTaskTemplates).values(
        svc.tasks.map((t) => ({
          serviceKey: svc.serviceKey,
          orderIndex: t.orderIndex,
          title: t.title,
          description: t.description ?? null,
          defaultHandledBy: t.defaultHandledBy ?? "internal",
          defaultWaitingOn: t.defaultWaitingOn ?? null,
          estimatedDays: t.estimatedDays ?? null,
        })),
      );
      templatesInserted += svc.tasks.length;
    }
  }

  console.log(
    `[seed] task-templates upserted ${servicesUpserted} services, ${templatesInserted} task rows`,
  );
}
