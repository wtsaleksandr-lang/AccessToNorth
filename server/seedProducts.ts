import { getUncachableStripeClient } from './stripeClient';

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
      currency: 'usd',
      metadata: { packageType: pkg.metadata.packageType },
    });

    console.log(`Created product "${pkg.name}" ($${(pkg.price / 100).toFixed(2)})`);
  }

  console.log('Product seeding complete.');
}
