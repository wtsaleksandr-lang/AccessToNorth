# AccessToNorth — Launch Checklist

> SEO and indexing work is tracked in [`SEO_ROADMAP.md`](./SEO_ROADMAP.md), including the business-icon favicon and Google Search Console steps.

Every manual task that requires YOUR input, ordered by priority. Completing items 1–9 gets you to a functioning production site. Items 10+ are enhancements.

---

## TIER 1 — BEFORE YOU DEPLOY (deploy blockers)

### 1. Install new dependencies

```bash
cd /path/to/AccessToNorth
git pull origin main
npm install
```

This pulls: `@anthropic-ai/sdk`, `bcryptjs`, `@playwright/test`, `@types/bcryptjs`.

### 2. Run database migration

```bash
npm run db:push
```

This creates the new tables:
- `clients`, `client_services`, `fulfillment_tasks`, `service_task_templates`, `onboarding_submissions`, `service_catalog`, `admin_activity_log` (the CRM layer)
- `chat_memory` (AI chat persistence)
- `admin_users` (per-user admin accounts)

Plus all the new indexes (`idx_uploads_order_id`, `idx_orders_stripe_session_id`, etc.)

**Watch for:** Drizzle will show a diff of what's changing. Review and type `y` to apply. No data is lost on existing tables — all changes are additive.

### 3. Set environment variables

These are **required** for the site to boot and function:

```bash
# Database (you already have this)
DATABASE_URL=postgres://...

# Session / auth (already have these)
SESSION_SECRET=<32+ random bytes>
ADMIN_PASSWORD=<will be fallback; see step 4 for per-user admin>

# Claude AI (required for chat widget + AI copilot + Vapi voice)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**How to get ANTHROPIC_API_KEY:**
1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Billing → add payment method (Claude Haiku is cheap — ~$0.25/1M tokens input)
3. API keys → Create key → copy
4. Paste as env var in your deploy target (Replit Secrets, Vercel env, etc.)

Without `ANTHROPIC_API_KEY` the chat widget returns 503 but the site otherwise works fine.

### 4. Create your first admin user

```bash
npm run create-admin your-email@accesstonorth.com 'strong-password-12-chars-min' 'Your Name'
```

Password must be at least 12 characters. This writes a bcrypt-hashed row to the `admin_users` table.

After this, log in at `/admin` with that email + password. The legacy `ADMIN_PASSWORD` env var keeps working as a fallback in case you lose access.

### 5. Re-seed Stripe products in CAD (not USD)

The old seed used USD. If your Stripe account already has products seeded in USD, you need to clean them up first:

1. Log into [Stripe Dashboard](https://dashboard.stripe.com) → **Products**.
2. Find products with names like "Business Number Registration", "GST/HST Registration", etc.
3. **Archive** (don't delete) the old USD products.
4. Restart your server — `seedProducts.ts` runs on boot, it'll create fresh CAD versions.

**Verify** in Stripe: each new product should show `CA$99`, `CA$249`, etc. — not `US$99`.

### 6. Configure Stripe webhook

Stripe needs to POST to your `/api/stripe/webhook` endpoint. On Replit this is handled via the `stripe-replit-sync` package. For other deployments:

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. Endpoint URL: `https://www.accesstonorth.com/api/stripe/webhook`.
3. Events to listen to: `checkout.session.completed`, `checkout.session.expired`.
4. Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` env var.

Test with Stripe's built-in event sender: Stripe Dashboard → webhook → **Send test event**. Check your server logs for `[stripe]` entries.

### 7. Deploy

Push to production (Replit Deploy, Vercel, Fly.io, your VPS — whatever you're using).

```bash
# If this is your first deploy after this sprint, build locally to catch any prod-only issues
npm run build
```

### 8. Smoke test

- Load home page → check chat bubble appears in bottom-right
- Open chat bubble → ask "Do I need a Business Number?" → should get an AI-generated reply within ~3 seconds
- Navigate to `/pricing` → click "Add to Cart" → complete a test checkout with Stripe test card `4242 4242 4242 4242`
- Check your email: you should receive order confirmation + onboarding email with a link to `/onboarding/<token>`
- Click onboarding link → fill out the form → submit → check admin dashboard at `/admin/crm` to see the client, service, and tasks
- Click a task → "Mark delivered" → check activity log updates
- Mark all tasks delivered → verify completion cascade email sends

If all 6 work: ✅ production is functional.

---

## TIER 2 — CRITICAL FOR REAL B2B TRUST (week 1)

### 9. Email deliverability — SPF / DKIM / DMARC

Without this, your transactional emails go to spam. Serious B2B clients will not trust your firm.

**Full guide:** [`docs/email-dns-setup.md`](email-dns-setup.md)

Quick version:

1. Log into Resend → **Domains → Add domain** → `accesstonorth.com`.
2. Resend shows 3 DNS records (SPF TXT, DKIM TXT, MX). Copy exactly.
3. Go to your DNS provider (Cloudflare, Namecheap, Route53 — wherever accesstonorth.com's DNS is hosted).
4. Add the 3 Resend records.
5. Add this 4th DMARC record:
   ```
   Type: TXT
   Host: _dmarc.accesstonorth.com
   Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@accesstonorth.com; ruf=mailto:dmarc@accesstonorth.com; fo=1
   ```
6. Wait 5–30 minutes for DNS propagation.
7. Back in Resend → **Verify DNS records** — all should flip to "Verified".
8. Test: send a transactional email to a personal Gmail → open → "Show original" → confirm SPF/DKIM/DMARC all say PASS.

**Time required:** ~15 minutes in DNS dashboard + 30 minutes waiting for propagation.

### 10. Create team mailboxes

You need these mailboxes (or forwarding rules) receiving mail:

| Mailbox | Purpose | Referenced in |
|---|---|---|
| `operations@accesstonorth.com` | Main inbound email, contact form | Footer, Contact page, all transactional emails |
| `privacy@accesstonorth.com` | PIPEDA / data-subject requests | Privacy Policy |
| `security@accesstonorth.com` | Vulnerability reports | Security Overview page |
| `dmarc@accesstonorth.com` | DMARC aggregate reports | DMARC record (auto-filed by receiving mail servers) |

If you're using Google Workspace: add each as an alias to your main account (free).
If you're using Microsoft 365: same, under User Management → Aliases.

**Note:** `dmarc@` must actually receive mail — that's where DMARC aggregate reports land. Set up at minimum a filter that auto-archives them.

### 11. Point your domain at production

If you haven't already:

1. Find your production host's DNS target (Vercel: `cname.vercel-dns.com`, Replit: similar).
2. In your domain's DNS:
   - `A` or `CNAME` record for `@` (root) pointing to the host.
   - `A` or `CNAME` record for `www` pointing to the host.
3. SSL cert should auto-issue within ~10 minutes on any modern host.
4. Test: `curl -I https://www.accesstonorth.com` → should return `HTTP/2 200` + a valid cert.

### 12. Run the Playwright smoke test after deploy

From your local machine, pointing at production:

```bash
cd /path/to/AccessToNorth
npx playwright install chromium       # one-time
E2E_SKIP_WEBSERVER=1 E2E_BASE_URL=https://www.accesstonorth.com npx playwright test
```

This runs all 16 tests against live site. Should pass all 12 page-render tests; the 4 backend tests will also pass since backend is live.

---

## TIER 3 — FIRST 2–4 WEEKS

### 13. AI phone line via Vapi

Full guide: [`docs/vapi-setup.md`](vapi-setup.md). Summary:

1. **Sign up** at [vapi.ai](https://vapi.ai). Free tier includes $10 credit.
2. **Buy a phone number** — Vapi → Phone numbers → Buy number ($5/mo). Pick a Canadian area code.
3. **Create an assistant** — paste the JSON config from `docs/vapi-setup.md` step 3. Replace `https://www.accesstonorth.com` with your actual domain.
4. **Set webhook secret** — generate a random 32-byte string, paste into Vapi assistant webhook config.
5. **Bind phone number to assistant** — Vapi dashboard → Phone numbers → your number → Assistant dropdown.
6. **Set 5 env vars on your server:**
   ```bash
   VAPI_API_KEY=vapi_priv_...
   VAPI_PUBLIC_KEY=vapi_pub_...
   VAPI_ASSISTANT_ID=assistant-...
   VAPI_WEBHOOK_SECRET=<same secret from step 4>
   VAPI_SERVER_URL=https://www.accesstonorth.com
   ```
7. **Test the line** — call the Vapi number from your phone. You should hear the greeting within 1 second and get AI-answered responses.

**Cost:** ~$0.12–0.20 per minute of call (Vapi + 11labs + Deepgram + Claude combined).

### 14. Put the real phone number back on the site

Once Vapi is live and tested, add the number to these files:

- [`client/index.html`](../client/index.html) — in the Organization JSON-LD block, add `"telephone": "+1-xxx-xxx-xxxx"`
- [`client/src/components/JsonLd.tsx`](../client/src/components/JsonLd.tsx) — same, add `telephone` field
- [`client/src/components/Footer.tsx`](../client/src/components/Footer.tsx) — re-add the phone `<li>` in the Contact column
- [`client/src/pages/Contact.tsx`](../client/src/pages/Contact.tsx) — add a 4th card for Phone

Rebuild and redeploy. Currently the site has NO phone displayed, which is better than a fake one.

### 15. Apply for BBB accreditation

1. Go to [bbb.org/ca/apply-for-accreditation](https://www.bbb.org/ca/apply-for-accreditation).
2. Fill out the application — you'll need registered business documents (articles of incorporation, business number, registered address).
3. Pay the fee — CA$500–800/year for a small business in Ontario.
4. They'll review and issue an A+ rating in 2–4 weeks.
5. Once approved, add the BBB badge to your site footer.

**Impact:** Real trust signal for Canadian B2B buyers.

### 16. Apply for Ontario Chamber of Commerce

1. [occ.ca/join-us](https://occ.ca/join-us) — Ontario provincial chamber.
2. Also apply to your local chamber (based on your registered business address).
3. Fees: CA$350–500/yr combined.
4. Instant membership, visible in their member directory.

### 17. Apply for CFIB (optional)

1. [cfib-fcei.ca](https://www.cfib-fcei.ca).
2. CA$400/yr.
3. Advocacy + member discounts (Stripe merchant rates, etc.). Visible badge.

### 18. Design + upload a real OG image

Currently `index.html` and JSON-LD reference `/og-image.png` which doesn't exist yet. Social shares (LinkedIn, Twitter) look blank without it.

Specs: **1200×630 PNG**. Include:
- AccessToNorth.com logo/wordmark
- Tagline: "Canadian Business Number & GST/HST filings"
- Canadian maple leaf or map accent
- Same blue palette as the site (`#007BFF`)

Use Canva (free), Figma, or hire on Fiverr (~$20).

Save to `client/public/og-image.png` → rebuild → deploy.

### 19. Design + replace hero avatar images

Currently `client/src/pages/Home.tsx` references `/images/avatar-1..4.png`. Those files don't exist — the avatars render as empty circles.

Either:
- Remove the avatar cluster (simplest), OR
- Add 4 real avatar images at `client/public/images/avatar-1.png` through `avatar-4.png`.

Your call. If you remove them, it's a 5-line edit in Home.tsx — let me know if you want me to do that.

### 20. Replace blog hero SVGs with real photos (optional, gradual)

The auto-generated SVG heroes look professional but aren't photos. For each published blog post you want to upgrade:

1. Open [`docs/BLOG_IMAGE_BRIEFS.md`](BLOG_IMAGE_BRIEFS.md) — copy the keywords for that post.
2. Either:
   - Buy a stock photo on Unsplash/Shutterstock, OR
   - Generate with Midjourney using the prompt in that doc.
3. Save as `client/public/blog/<slug>.jpg` (keep the same slug as the SVG).
4. In `client/src/data/blog/posts.ts`, find that post's entry and add:
   ```ts
   heroImageUrl: `/blog/${SLUG}.jpg`,
   ```
5. Rebuild.

You can do this one post at a time over weeks. The SVG placeholder is the fallback.

---

## TIER 4 — FIRST 1–3 MONTHS

### 21. Lawyer review of legal pages

Have a Canadian B2B-focused lawyer review:
- [Privacy Policy](../client/src/pages/Privacy.tsx) (PIPEDA-compliant, but worth second eyes)
- [Terms of Service](../client/src/pages/Terms.tsx)
- [Refund Policy](../client/src/pages/Refunds.tsx)

Cost: ~CA$1,500–3,000 for an initial review + amendments. Worth it given you're handling tax filings.

### 22. Collect real client testimonials

Until you have signed consent from real clients, the "Who we serve" section on the home page stays in place of testimonials.

Once you have 3–5 clients willing to be quoted:
1. Get written consent (email is fine). Specify: quote, name, role, company, optional outcome detail.
2. Add entries to the testimonials array that's currently empty in [`client/src/pages/Home.tsx`](../client/src/pages/Home.tsx).
3. Replace `WhoWeServeSection()` with the (existing but hidden) testimonial component.

Let me know when you have quotes — I can wire them in.

### 23. Complete French translation

The i18n scaffold is in place ([`client/src/locales/en.ts`](../client/src/locales/en.ts) + [`fr.ts`](../client/src/locales/fr.ts)) but only nav/footer/hero/common strings are translated.

To complete:
1. Extract all hardcoded English strings in Home/Pricing/Services/About/FAQ/resource pages into locale keys.
2. Add French translations in `fr.ts` (ideally reviewed by a native Canadian French speaker).
3. Update the pages to use `t("key")` instead of hardcoded strings.

This is content work best done in chunks. Start with Pricing + Services (highest-intent pages).

### 24. Populate company address

Currently Footer + Privacy Policy say "Ontario, Canada" without a specific address. If you have a registered business address (even a virtual office):

1. Add street address to [`client/src/components/Footer.tsx`](../client/src/components/Footer.tsx) under the company description.
2. Add to Organization JSON-LD in [`client/index.html`](../client/index.html) and [`client/src/components/JsonLd.tsx`](../client/src/components/JsonLd.tsx) under the `address` field.
3. If registering with BBB (step 15), they'll ask for this.

Virtual offices at ~CA$50/mo (iPostal1, Regus) are perfectly acceptable for a B2B compliance firm.

### 25. Replace the fake phone number permanently

You already have the Vapi line from step 13. If you want a second number or a human-answered line, get one from Twilio ($1/mo) or a Canadian provider.

---

## TIER 5 — WHEN SCALING (CA$500K+ ARR)

### 26. Vanta or Drata for SOC 2 readiness

1. Book demo at [vanta.com](https://www.vanta.com) or [drata.com](https://drata.com).
2. Sign up — $500–800/mo for SMB plans.
3. Connect integrations (GitHub, Stripe, AWS, Google Workspace, Slack).
4. Follow their policy templates → publish a "Vanta Trust Center" at `vanta.com/trust/accesstonorth`.
5. Add badge to footer: "Vanta-verified security posture".

**Impact:** Covers 80% of enterprise procurement requirements without the actual audit cost. Accept as "good enough" at this stage.

### 27. SOC 2 Type II audit

Only when a named enterprise prospect says "we can't sign without your SOC 2 report".

1. Your Vanta/Drata subscription connects you to auditors.
2. Auditor scope (Type II requires 6+ months of evidence observation).
3. Cost: $25–60K one-time + $15–30K/yr ongoing.
4. Output: a SOC 2 Type II report you can send under NDA.

### 28. Per-admin user accounts

Already built ([`npm run create-admin`](../script/createAdminUser.ts)). Once you have multiple team members, create per-user accounts for each and remove the shared `ADMIN_PASSWORD` env var.

---

## ONGOING OPERATIONS

### 29. Weekly: rebuild + deploy to publish scheduled blog posts

Every Sunday night or Monday morning:

```bash
git pull
npm run build       # auto-generates sitemap + RSS + prerender + blog images with new posts
# then deploy via your host
```

The publish-date gating in [`posts.ts`](../client/src/data/blog/posts.ts) only shows posts whose `publishDate <= today`. Rebuilding picks up the next scheduled one automatically.

### 30. Monthly: review DMARC aggregate reports

Check `dmarc@accesstonorth.com` for aggregate reports. Look for:
- Any unauthorized senders using your domain (spam spoofing).
- Failed DKIM/SPF from legitimate services you forgot to configure.

Once reports are consistently clean, upgrade DMARC policy from `p=quarantine` to `p=reject`.

### 31. Quarterly: audit the Privacy Policy vs. actual practice

The Privacy Policy makes specific claims:
- 30-day chat memory retention
- 6-year document retention for tax/customs filings
- No training on customer content (Anthropic/Vapi)
- 72-hour breach notification

Verify your actual systems match these claims at least once per quarter. If practice diverges, update the policy (Section 10 has a changelog).

### 32. Quarterly: run Playwright against production

```bash
npx playwright test --project=chromium
```

Catches any regressions after deploys. Takes ~15 seconds.

---

## Quick reference — task count by priority

| Tier | Count | Est. total time |
|---|---|---|
| Tier 1 (deploy blockers) | 8 | 2–3 hours |
| Tier 2 (week 1) | 4 | 1–2 hours + DNS propagation |
| Tier 3 (first month) | 8 | 1 day spread across weeks |
| Tier 4 (first 3 months) | 5 | 1–2 days spread across months |
| Tier 5 (scale) | 3 | Months of prep when needed |
| Ongoing | 4 | ~1 hour/week |

**Minimum path to "live and trustworthy":** Tier 1 + Tier 2. That's ~5 hours total of your time once you have DNS access.

---

## If something breaks

- **Chat widget returns 503:** `ANTHROPIC_API_KEY` not set or invalid. Check your deploy env.
- **Transactional emails in spam:** DNS records not propagated or DKIM mismatch. See Tier 2 step 9.
- **Checkout fails silently:** Stripe webhook secret missing. See Tier 1 step 6.
- **Admin login fails:** Run `npm run create-admin` or fall back to `ADMIN_PASSWORD` env var.
- **Database migration errors:** `npm run db:push` conflicts → check `shared/schema.ts` against existing DB, reconcile manually if needed.
- **AI phone line not connecting:** `GET /api/vapi/status` returns readiness diagnostics.

For anything else, the logs on your deploy target are verbose enough to diagnose — every major flow logs with a `[tag]` prefix (`[stripe]`, `[crm]`, `[vapi]`, `[chat]`, `[Order]`).
