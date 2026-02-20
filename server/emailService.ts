import type { ClassificationOrderData } from "@shared/schema";

const BRAND_COLOR = "#007BFF";
const BRAND_DARK = "#0A2540";
const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : "https://www.accesstonorth.com";
const OPS_EMAIL = "operations@accesstonorth.com";

function log(msg: string) {
  const ts = new Date().toLocaleTimeString();
  console.log(`${ts} [email] ${msg}`);
}

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f6f9;color:#1a1a2e}
.container{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
.header{background:${BRAND_DARK};padding:24px 32px;text-align:center}
.header img{height:28px}
.header h1{color:#fff;font-size:18px;margin:8px 0 0;font-weight:600}
.body{padding:32px}
.body h2{color:${BRAND_DARK};font-size:20px;margin:0 0 16px}
.body p{color:#4a5568;font-size:14px;line-height:1.7;margin:0 0 12px}
.detail-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #edf2f7}
.detail-label{color:#718096;font-size:13px}
.detail-value{color:${BRAND_DARK};font-size:13px;font-weight:600}
.detail-table{width:100%;border-collapse:collapse;margin:16px 0}
.detail-table td{padding:10px 0;border-bottom:1px solid #edf2f7;font-size:13px;vertical-align:top}
.detail-table td:first-child{color:#718096;width:40%}
.detail-table td:last-child{color:${BRAND_DARK};font-weight:600}
.btn{display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:14px;font-weight:600;margin:8px 4px}
.btn-outline{display:inline-block;border:1px solid ${BRAND_COLOR};color:${BRAND_COLOR};text-decoration:none;padding:10px 24px;border-radius:6px;font-size:13px;font-weight:500;margin:8px 4px}
.highlight-box{background:#f0f7ff;border:1px solid #d0e3ff;border-radius:6px;padding:16px;margin:16px 0}
.highlight-box p{color:#2d5a9e;font-size:13px;margin:0}
.footer{background:#f7f9fc;padding:20px 32px;text-align:center;border-top:1px solid #edf2f7}
.footer p{color:#a0aec0;font-size:11px;margin:4px 0}
.footer a{color:${BRAND_COLOR};text-decoration:none}
</style></head><body>
<div class="container">
<div class="header">
<h1>AccessToNorth.com</h1>
</div>
${content}
<div class="footer">
<p>AccessToNorth.com &mdash; Canadian Trade &amp; Tax Registration Services</p>
<p><a href="${BASE_URL}">accesstonorth.com</a></p>
</div>
</div>
</body></html>`;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const { getUncachableResendClient } = await import("./resendClient");
    const { client, fromEmail } = await getUncachableResendClient();

    const result = await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if ((result as any).error) {
      log(`Failed to send email to ${params.to}: ${JSON.stringify((result as any).error)}`);
      return false;
    }

    log(`Email sent to ${params.to}: "${params.subject}"`);
    return true;
  } catch (err: any) {
    log(`Email send error (falling back to console log): ${err.message}`);
    log(`--- DEV EMAIL FALLBACK ---`);
    log(`To: ${params.to}`);
    log(`Subject: ${params.subject}`);
    log(`HTML length: ${params.html.length} chars`);
    log(`--- END DEV EMAIL ---`);
    return false;
  }
}

export function buildCustomerConfirmationEmail(
  orderId: string,
  metadata: ClassificationOrderData
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>Order Confirmed</h2>
<p>Thank you for your order. Your HS code classification review is now being processed by our team.</p>

<table class="detail-table">
<tr><td>Order ID</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Package</td><td>${metadata.packageTier.charAt(0).toUpperCase() + metadata.packageTier.slice(1)} &mdash; ${metadata.packagePrice}</td></tr>
<tr><td>Product</td><td>${metadata.productName}</td></tr>
<tr><td>Country of Origin</td><td>${metadata.countryOfOrigin}</td></tr>
<tr><td>HS Codes Requested</td><td>Up to ${metadata.hsCodesRequested}</td></tr>
<tr><td>Estimated Delivery</td><td>${metadata.deliveryTime}</td></tr>
</table>

<div class="highlight-box">
<p>If we need additional details to complete your classification, we will contact you by email.</p>
</div>

<p style="text-align:center;margin-top:24px">
<a href="${BASE_URL}/tools/hs-code-finder" class="btn-outline">HS Code Finder</a>
<a href="${BASE_URL}/customs-calculator" class="btn-outline">Duty &amp; Tax Calculator</a>
</p>
</div>`);

  return {
    to: "",
    subject: `HS Classification Order Confirmed – ${orderId}`,
    html,
  };
}

export function buildInternalOrderAlertEmail(
  orderId: string,
  customerEmail: string,
  metadata: ClassificationOrderData,
  documentCount: number
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>New Paid HS Classification Order</h2>
<p>A new classification order has been received and paid.</p>

<table class="detail-table">
<tr><td>Order ID</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Customer Email</td><td>${customerEmail}</td></tr>
${metadata.companyName ? `<tr><td>Company</td><td>${metadata.companyName}</td></tr>` : ""}
${metadata.phone ? `<tr><td>Phone</td><td>${metadata.phone}</td></tr>` : ""}
<tr><td>Package</td><td>${metadata.packageTier.charAt(0).toUpperCase() + metadata.packageTier.slice(1)} &mdash; ${metadata.packagePrice}</td></tr>
<tr><td>Product</td><td>${metadata.productName}</td></tr>
<tr><td>Country of Origin</td><td>${metadata.countryOfOrigin}</td></tr>
${metadata.industryCategory ? `<tr><td>Industry</td><td>${metadata.industryCategory}</td></tr>` : ""}
<tr><td>Documents</td><td>${documentCount} file${documentCount !== 1 ? "s" : ""} uploaded</td></tr>
</table>

${metadata.productDescription ? `
<div style="margin-top:16px">
<p style="color:#718096;font-size:12px;margin-bottom:4px">Product Description:</p>
<p style="font-size:13px">${metadata.productDescription}</p>
</div>` : ""}

${metadata.additionalNotes ? `
<div style="margin-top:12px">
<p style="color:#718096;font-size:12px;margin-bottom:4px">Additional Notes:</p>
<p style="font-size:13px">${metadata.additionalNotes}</p>
</div>` : ""}

<p style="text-align:center;margin-top:24px">
<a href="${BASE_URL}/admin" class="btn">View in Admin Dashboard</a>
</p>
</div>`);

  return {
    to: OPS_EMAIL,
    subject: `New Paid HS Classification Order – ${orderId}`,
    html,
  };
}

export function buildReportDeliveryEmail(
  orderId: string,
  metadata: ClassificationOrderData,
  downloadUrl: string
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>Your Classification Report is Ready</h2>
<p>Your HS code classification report for order <strong style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</strong> has been completed and is ready for download.</p>

<table class="detail-table">
<tr><td>Product</td><td>${metadata.productName}</td></tr>
<tr><td>Country of Origin</td><td>${metadata.countryOfOrigin}</td></tr>
<tr><td>Package</td><td>${metadata.packageTier.charAt(0).toUpperCase() + metadata.packageTier.slice(1)}</td></tr>
</table>

<p style="text-align:center;margin:28px 0">
<a href="${downloadUrl}" class="btn">Download Your Report</a>
</p>

<div class="highlight-box">
<p>This download link will expire in 30 days. If you need access after that, please contact us at ${OPS_EMAIL}.</p>
</div>

<p>You can use your HS code in our duty and tax calculator to estimate your import costs:</p>
<p style="text-align:center">
<a href="${BASE_URL}/customs-calculator" class="btn-outline">Calculate Import Duty</a>
</p>
</div>`);

  return {
    to: "",
    subject: `Your HS Classification Report – ${orderId}`,
    html,
  };
}

export function buildRequestInfoEmail(
  orderId: string,
  metadata: ClassificationOrderData,
  questions: string[]
): SendEmailParams {
  const questionsList = questions
    .map((q, i) => `<tr><td style="padding:8px 0;border-bottom:1px solid #edf2f7;font-size:13px;color:#4a5568"><strong>${i + 1}.</strong> ${q}</td></tr>`)
    .join("");

  const html = emailWrapper(`
<div class="body">
<h2>Additional Information Needed</h2>
<p>We are currently reviewing your HS code classification order <strong style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</strong> for <strong>${metadata.productName}</strong>.</p>
<p>To complete your classification accurately, we need the following additional information:</p>

<table style="width:100%;border-collapse:collapse;margin:16px 0">
${questionsList}
</table>

<div class="highlight-box">
<p>Please reply to this email with the requested information, or log in to your client portal to upload any supporting documents.</p>
</div>

<p style="text-align:center;margin-top:24px">
<a href="${BASE_URL}/portal" class="btn">Open Client Portal</a>
</p>

<p style="font-size:12px;color:#718096;margin-top:16px">Your order is currently on hold until we receive the requested information. Once received, we will continue processing your classification.</p>
</div>`);

  return {
    to: "",
    subject: `Action Required: Additional Info Needed – ${orderId}`,
    html,
  };
}

export function buildSnapshotDeliveryEmail(
  orderId: string,
  customerName: string,
  downloadUrl: string
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>Your Import Readiness Snapshot</h2>
<p>Hi ${customerName},</p>
<p>We've prepared an Import Readiness Snapshot for your order <strong style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</strong>. This document summarizes your current import readiness and outlines recommended next steps.</p>

<p style="text-align:center;margin:28px 0">
<a href="${downloadUrl}" class="btn">Download Your Snapshot</a>
</p>

<div class="highlight-box">
<p>This download link will expire in 30 days. If you need access after that, please contact us at ${OPS_EMAIL}.</p>
</div>

<p>If you have any questions about your snapshot or need further assistance, feel free to reply to this email.</p>
</div>`);

  return {
    to: "",
    subject: `Your Import Readiness Snapshot – ${orderId}`,
    html,
  };
}

export function buildBrokerPackDeliveryEmail(
  orderId: string,
  customerName: string,
  downloadUrl: string
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>Your Broker Handoff Pack</h2>
<p>Hi ${customerName},</p>
<p>We've prepared a Broker Handoff Pack for your order <strong style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</strong>. This document helps you organize the information your customs broker will need.</p>

<p style="text-align:center;margin:28px 0">
<a href="${downloadUrl}" class="btn">Download Your Pack</a>
</p>

<div class="highlight-box">
<p>This download link will expire in 30 days. If you need access after that, please contact us at ${OPS_EMAIL}.</p>
</div>

<p>If you have any questions, feel free to reply to this email or contact us at ${OPS_EMAIL}.</p>
</div>`);

  return {
    to: "",
    subject: `Your Broker Handoff Pack – ${orderId}`,
    html,
  };
}

export function buildCartOrderConfirmationEmail(
  orderId: string,
  customerName: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  completeUrl: string
): SendEmailParams {
  const totalCAD = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemsHtml = items.map(i => `
    <tr>
      <td>${i.name}</td>
      <td style="text-align:right">CA$${i.price.toFixed(2)}${i.quantity > 1 ? ` x${i.quantity}` : ''}</td>
    </tr>`).join('');

  const html = emailWrapper(`
<div class="body">
<h2>Thank You for Your Order!</h2>
<p>Hi ${customerName || 'there'},</p>
<p>Your payment has been received. Your order reference is <strong style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</strong>.</p>

<table class="detail-table">
${itemsHtml}
<tr style="border-top:2px solid ${BRAND_DARK}">
  <td style="font-weight:700;color:${BRAND_DARK}">Total</td>
  <td style="text-align:right;font-weight:700;color:${BRAND_DARK}">CA$${totalCAD.toFixed(2)}</td>
</tr>
</table>

<div class="highlight-box">
<p><strong>Next Step:</strong> Please complete the service details form so our team can begin processing your order. This typically takes 5-10 minutes.</p>
</div>

<p style="text-align:center;margin:24px 0">
<a href="${completeUrl}" class="btn">Complete Service Details</a>
</p>

<p style="font-size:12px;color:#718096">This link is valid for 90 days. You can return to it at any time to complete or update your details.</p>
</div>`);

  return {
    to: "",
    subject: `Order Confirmed – ${orderId} | AccessToNorth.com`,
    html,
  };
}

export function buildCartInternalAlertEmail(
  orderId: string,
  customerEmail: string,
  customerName: string,
  items: Array<{ name: string; price: number; quantity: number }>,
  amountCents: number
): SendEmailParams {
  const itemsList = items.map(i => `${i.name} (CA$${i.price.toFixed(2)}${i.quantity > 1 ? ` x${i.quantity}` : ''})`).join(', ');
  const html = emailWrapper(`
<div class="body">
<h2>New Cart Order Received</h2>
<table class="detail-table">
<tr><td>Order ID</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Customer</td><td>${customerName} (${customerEmail})</td></tr>
<tr><td>Services</td><td>${itemsList}</td></tr>
<tr><td>Total</td><td>CA$${(amountCents / 100).toFixed(2)}</td></tr>
<tr><td>Status</td><td>Pending Details</td></tr>
</table>
<p>Customer has been sent a link to complete their intake forms.</p>
</div>`);

  return {
    to: OPS_EMAIL,
    subject: `[New Order] ${orderId} – ${customerName}`,
    html,
  };
}

export function buildReminderEmail(
  orderId: string,
  customerName: string,
  customerEmail: string,
  serviceName: string,
  completeUrl: string,
  reminderNumber: 1 | 2
): SendEmailParams {
  const urgency = reminderNumber === 2
    ? "We noticed you haven't completed your service details yet. Please submit them soon so we can begin processing your order."
    : "Just a friendly reminder to complete your service details so we can start working on your order.";

  const html = emailWrapper(`
<div class="body">
<h2>Reminder: Complete Your Service Details</h2>
<p>Hi ${customerName || 'there'},</p>
<p>${urgency}</p>

<table class="detail-table">
<tr><td>Order</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Service</td><td>${serviceName}</td></tr>
</table>

<p style="text-align:center;margin:24px 0">
<a href="${completeUrl}" class="btn">Complete Details Now</a>
</p>

<p style="font-size:12px;color:#718096">If you need assistance, reply to this email or contact us at ${OPS_EMAIL}.</p>
</div>`);

  return {
    to: customerEmail,
    subject: `Reminder: Complete your order details – ${orderId}`,
    html,
  };
}

export function buildOnHoldEmail(
  orderId: string,
  customerName: string,
  serviceName: string
): SendEmailParams {
  const html = emailWrapper(`
<div class="body">
<h2>Order Item Placed On Hold</h2>
<table class="detail-table">
<tr><td>Order ID</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Service</td><td>${serviceName}</td></tr>
<tr><td>Customer</td><td>${customerName}</td></tr>
<tr><td>Reason</td><td>Intake form not completed after 7 days</td></tr>
</table>
<p>This item has been automatically marked as <strong>On Hold</strong>. Please reach out to the customer if needed.</p>
</div>`);

  return {
    to: OPS_EMAIL,
    subject: `[On Hold] ${orderId} – ${serviceName} – intake incomplete`,
    html,
  };
}

export function buildStatusUpdateEmail(
  orderId: string,
  newStatus: string,
  metadata: ClassificationOrderData
): SendEmailParams {
  let statusMessage = "";
  let statusDetail = "";

  if (newStatus === "In Progress") {
    statusMessage = "Classification Review Started";
    statusDetail = `Our team has begun reviewing your product classification for <strong>${metadata.productName}</strong>. You will receive your report within the estimated delivery timeframe.`;
  } else {
    statusMessage = `Order Status Updated: ${newStatus}`;
    statusDetail = `The status of your classification order has been updated to <strong>${newStatus}</strong>.`;
  }

  const html = emailWrapper(`
<div class="body">
<h2>${statusMessage}</h2>
<p>${statusDetail}</p>

<table class="detail-table">
<tr><td>Order ID</td><td style="font-family:monospace;color:${BRAND_COLOR}">${orderId}</td></tr>
<tr><td>Product</td><td>${metadata.productName}</td></tr>
<tr><td>New Status</td><td>${newStatus}</td></tr>
</table>

<p>If you have any questions, feel free to reply to this email or contact us at ${OPS_EMAIL}.</p>
</div>`);

  return {
    to: "",
    subject: `HS Classification Order Update – ${orderId}`,
    html,
  };
}
