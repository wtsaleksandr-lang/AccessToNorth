# Email deliverability — SPF / DKIM / DMARC setup

**Goal:** make sure `operations@accesstonorth.com` (and any other `@accesstonorth.com` address) lands in inboxes, not spam. This takes ~15 minutes in your DNS dashboard + ~24 hours for records to propagate.

You cannot skip this. Without DKIM + SPF + DMARC, Gmail/Outlook/Apple Mail will quietly route your transactional emails (order confirmations, authorization form requests, status updates) to spam — and nobody will tell you.

## Step 1 — Add your domain to Resend

1. Log into resend.com → **Domains** → **Add domain**.
2. Enter `accesstonorth.com`.
3. Resend will display **3 DNS records** (one SPF TXT, one DKIM TXT, one custom MX).

Those records are specific to your Resend account. Copy them exactly — don't paraphrase from this doc.

## Step 2 — Add the records at your DNS provider

Wherever your domain's DNS is hosted (Cloudflare, Route53, Namecheap, GoDaddy, Replit Domains, etc.), go to the DNS zone for `accesstonorth.com` and add the records Resend gave you.

### What Resend's records look like (example only — use the actual values from your Resend dashboard)

```
Type   Host/Name                    Value
----   -------------------------    --------------------------------------------------------
TXT    send.accesstonorth.com       "v=spf1 include:amazonses.com ~all"
TXT    resend._domainkey            [long p=... public key — paste exactly from Resend]
MX     send.accesstonorth.com       feedback-smtp.us-east-1.amazonses.com (priority 10)
```

**Cloudflare users:** disable the orange cloud (proxy) for these records — set them to "DNS only" / grey cloud.

**Route53 users:** some providers require the Value to be wrapped in extra double-quotes; copy from Resend literally.

## Step 3 — Add DMARC (we strongly recommend this)

Resend doesn't require this, but Gmail and Yahoo do effectively require it since 2024 for anything sending more than ~100 messages/day. Add this TXT record:

```
Type   Host/Name                    Value
----   -------------------------    --------------------------------------------------------
TXT    _dmarc.accesstonorth.com     "v=DMARC1; p=quarantine; rua=mailto:dmarc@accesstonorth.com; ruf=mailto:dmarc@accesstonorth.com; fo=1; adkim=s; aspf=s"
```

Start with `p=quarantine`. Run for 2 weeks and review the `rua` reports. Once you're confident all legitimate mail is DKIM/SPF aligned, upgrade to `p=reject`.

**Create a mailbox** for `dmarc@accesstonorth.com` (or forward it to a real inbox) so the aggregate reports arrive somewhere you can read them.

## Step 4 — Verify in Resend

1. Back in Resend → **Domains** → `accesstonorth.com` → **Verify DNS records**.
2. All three rows should flip to **Verified** within 5–30 minutes. If they don't after an hour, use [dnschecker.org](https://dnschecker.org) to confirm the records are visible globally.

## Step 5 — Test end-to-end

After verification:

```bash
# From the AccessToNorth repo, trigger a test send
curl -X POST https://www.accesstonorth.com/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"yourpersonal@gmail.com","message":"Deliverability test"}'
```

Check:
1. Email arrives in **Inbox** (not Spam, not Promotions).
2. In Gmail, open the email → three-dot menu → "Show original". Confirm:
   - `SPF: PASS`
   - `DKIM: PASS`
   - `DMARC: PASS`

If any say `FAIL`, the corresponding DNS record is wrong. Compare against Resend's dashboard values.

## Step 6 — Add the sending address as RESEND_FROM_EMAIL

In your server env:

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=operations@accesstonorth.com
```

This is already the default — no code change needed. The `operations@` prefix should be a real inbox you monitor; replies to transactional emails go there.

## Common pitfalls

- **Copying records with extra quotes.** Some panels auto-wrap TXT values in quotes. Check once, don't add yours.
- **Wrong host name.** For the SPF, the host is `send.accesstonorth.com` (subdomain), not `accesstonorth.com` (root). Resend uses the subdomain pattern on purpose.
- **Cloudflare proxying the MX record.** Cloudflare cannot proxy MX at all — it must be DNS-only. Same for TXT.
- **DMARC too strict too fast.** Don't go `p=reject` on day one. Run `p=quarantine` + `rua` for 2 weeks first.
- **Multiple SPF records.** You can only have ONE SPF record per domain. If you already have one (for Google Workspace, another ESP, etc.), merge the `include:` directives into a single record.

## When done

- All three DNS records verified in Resend dashboard
- A test send to a Gmail inbox arrives in Inbox with SPF/DKIM/DMARC pass
- DMARC aggregate reports arriving at `dmarc@accesstonorth.com`

At that point your deliverability baseline is set. Monitor DMARC reports monthly.
