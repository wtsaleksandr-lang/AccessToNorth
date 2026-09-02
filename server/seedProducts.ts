import { getUncachableStripeClient } from './stripeClient';
import { TOOL_PLANS, WINBACK_MONTHS, WINBACK_PERCENT_OFF } from '../shared/toolPlans';

const PACKAGES = [
  {
    name: 'Business Number Registration',
    description: 'Get your Business Number (BN) registered with the CRA. Ideal for new businesses starting operations in Canada.',
    price: 9900,
    metadata: { packageType: 'business-number', features: 'BN Registration,CRA Account Setup,Digital Filing' },
  },
  {
    name: 'GST/HST Registration',
    description: 'Complete GST/HST registration with the Canada Revenue Agency. Perfect for businesses reaching the $30,000 threshold.',
    price: 24900,
    metadata: { packageType: 'gst-hst', features: 'GST/HST Registration,BN Included,Filing Guidance,Compliance Review' },
  },
  {
    name: 'Non-Resident Tax Registration',
    description: 'Specialized registration package for non-residents doing business in Canada. Includes BN and GST/HST.',
    price: 39900,
    metadata: { packageType: 'non-resident', features: 'Non-Resident BN,GST/HST Registration,Tax Treaty Guidance,Compliance Support' },
  },
  {
    name: 'CARM Portal Registration',
    description: 'Register for the CBSA Assessment and Revenue Management portal. Required for all importers into Canada.',
    price: 49900,
    metadata: { packageType: 'carm', features: 'CARM Registration,Portal Access Setup,Import Account,CBSA Compliance' },
  },
  {
    name: 'Complete Importer Bundle',
    description: 'All-inclusive package for importers: BN, GST/HST, Import/Export accounts, and CARM portal registration.',
    price: 150000,
    metadata: { packageType: 'complete-bundle', features: 'Everything in CARM,BN Registration,GST/HST,Import/Export Account,Priority Support' },
  },
  {
    name: 'Business Starter Bundle',
    description: 'Business Number + GST/HST Registration bundle at a discounted rate.',
    price: 29900,
    metadata: { packageType: 'business-starter', features: 'BN Registration,GST/HST Registration,CRA Account Setup,Filing Guidance' },
  },
  {
    name: 'B13 Export Declaration',
    description: 'Canadian Export Declaration filing for goods leaving Canada (over $2,000 CAD).',
    price: 12500,
    metadata: { packageType: 'b13-export', features: 'B13 Filing,CERS Submission,Export Compliance' },
  },
  {
    name: 'RPP / Bond Coordination',
    description: 'Release Prior to Payment program enrollment and surety bond coordination with CBSA.',
    price: 39500,
    metadata: { packageType: 'rpp-bond', features: 'RPP Enrollment,Surety Bond Setup,CBSA Coordination,Financial Security' },
  },
  {
    name: 'HS Code Classification',
    description: 'Accurate tariff classification for your products to avoid penalties and duty overpayment.',
    price: 9500,
    metadata: { packageType: 'hs-classification', features: 'HS Code Research,Tariff Classification,Ruling Support' },
  },
  {
    name: 'HS Classification — Basic',
    description: '1 HS code classification with supporting rationale summary and special measure awareness flag.',
    price: 2900,
    metadata: { packageType: 'hs-classification-basic', features: '1 HS Code,Rationale Summary,Special Measure Flag,1 Business Day,Email Support' },
  },
  {
    name: 'HS Classification — Business',
    description: 'Up to 10 HS codes with cross-consistency review and structured summary report.',
    price: 9900,
    metadata: { packageType: 'hs-classification-business', features: 'Up to 10 HS Codes,Cross-Consistency Review,Special Measure Screening,Summary Report,1 Business Day' },
  },
  {
    name: 'HS Classification — Pro',
    description: 'Up to 50 HS codes with invoice-level consistency check and risk summary overview.',
    price: 24900,
    metadata: { packageType: 'hs-classification-pro', features: 'Up to 50 HS Codes,Invoice Consistency Check,Special Measures Screening,Risk Summary,48 Business Hours' },
  },
];

export async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.list({ limit: 100, active: true });
  const existingByType = new Map<string, boolean>();
  for (const prod of existingProducts.data) {
    if (prod.metadata?.packageType) {
      existingByType.set(prod.metadata.packageType, true);
    }
  }

  for (const pkg of PACKAGES) {
    if (existingByType.has(pkg.metadata.packageType)) {
      console.log(`Product "${pkg.name}" already exists, skipping.`);
      continue;
    }

    const product = await stripe.products.create({
      name: pkg.name,
      description: pkg.description,
      metadata: pkg.metadata,
    });

    await stripe.prices.create({
      product: product.id,
      unit_amount: pkg.price,
      currency: 'cad',
      metadata: { packageType: pkg.metadata.packageType },
    });

    console.log(`Created product "${pkg.name}" ($${(pkg.price / 100).toFixed(2)})`);
  }

  for (const plan of TOOL_PLANS) {
    let product = existingProducts.data.find((candidate) => candidate.metadata?.toolTier === plan.tier);
    if (!product) {
      product = await stripe.products.create({
        name: `Container Loading ${plan.name}`,
        description: plan.apiAccess
          ? 'Hosted container-loading optimization API with continuously updated packing engine.'
          : 'Hosted container-loading calculator for embedding in a logistics website.',
        metadata: { toolTier: plan.tier, productFamily: 'container-loading' },
      });
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
    const exists = prices.data.some((price) =>
      price.metadata?.toolPlanId === plan.id &&
      price.unit_amount === plan.amount &&
      price.recurring?.interval === plan.interval,
    );
    if (!exists) {
      await stripe.prices.create({
        product: product.id,
        unit_amount: plan.amount,
        currency: 'cad',
        recurring: { interval: plan.interval },
        nickname: plan.id,
        metadata: { toolPlanId: plan.id, toolTier: plan.tier },
      });
      console.log(`Created recurring price for ${plan.id}`);
    }
  }

  const coupons = await stripe.coupons.list({ limit: 100 });
  if (!coupons.data.some((coupon) => coupon.metadata?.campaign === 'tool-trial-winback-2026')) {
    await stripe.coupons.create({
      name: `${WINBACK_PERCENT_OFF}% off for ${WINBACK_MONTHS} months`,
      percent_off: WINBACK_PERCENT_OFF,
      duration: 'repeating',
      duration_in_months: WINBACK_MONTHS,
      metadata: { campaign: 'tool-trial-winback-2026' },
    });
    console.log('Created tool subscription win-back coupon');
  }

  console.log('Product seeding complete.');
}
