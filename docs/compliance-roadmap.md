# Compliance roadmap — SOC 2, ISO 27001, trust signals

Honest cost/effort guide for certifications and industry memberships a serious B2B tax/customs firm could pursue.

## Short answer

- **Don't do SOC 2 or ISO 27001 yet.** Both are real audits. Combined cost $30–90K + 6–12 months. Not worth it until you have ~$1M ARR or a prospect is explicitly blocking the deal without one.
- **Do publish a Privacy Policy + Security Overview.** Already done — see `/privacy` and `/security`. This covers ~80% of what early-stage B2B buyers actually read.
- **Do get BBB + Chamber of Commerce.** Cheap, fast, real trust signal in Canada/US.
- **Don't claim CSCB membership.** You'd need to be a licensed customs broker, which you explicitly say you aren't.

## Tiered plan

### Tier 1 — Do this now (total: ~$600–1,500/year)

**Better Business Bureau (BBB)** — $500–1,200/yr
- Apply: [bbb.org/ca/apply-for-accreditation](https://www.bbb.org/ca/apply-for-accreditation)
- Review takes 2–4 weeks. They verify you're a real business at a real address.
- You get an A+ rating initially and a "Accredited Business" badge to put on the site.
- Ontario fee is roughly CA$500–800/year for a small business.
- **Real trust signal.** Canadian B2B buyers check.

**Ontario Chamber of Commerce / local Board of Trade** — $350–500/yr
- Ontario Chamber: [occ.ca/join-us](https://occ.ca/join-us)
- Local chamber (wherever your registered address is): search "[city] chamber of commerce".
- Immediate membership, visible on their member directory.
- Nothing substantive (no audit) but visible, real, and cheap.

**Canadian Federation of Independent Business (CFIB)** — $400/yr
- [cfib-fcei.ca](https://www.cfib-fcei.ca)
- Advocacy + member benefits (discounted Stripe rates, HR templates, etc.).
- Credible membership signal for small-business buyers.

### Tier 2 — Do this when you have $500K+ ARR (total: ~$500–1,000/month)

**Vanta, Drata, or Secureframe** — compliance-as-a-service
- [vanta.com](https://www.vanta.com), [drata.com](https://drata.com), [secureframe.com](https://secureframe.com)
- Monthly subscription $500–800 for SMB plans.
- Automates evidence collection for SOC 2 readiness (integrates with GitHub, AWS, Stripe, Google Workspace, etc.).
- You publish a **SOC 2 readiness** trust center (e.g. vanta.com/trust/accesstonorth) without paying for the audit itself.
- Serious B2B prospects accept a Vanta trust center as "good enough" at this stage.
- This buys you ~80% of the procurement conversion without the audit cost.

### Tier 3 — Do this when closing enterprise deals (total: $25–60K one-time + $15–30K/yr ongoing)

**SOC 2 Type II audit** — via a CPA firm + one of the Vanta/Drata platforms
- Type I: $15–30K, 3–6 months, snapshot of controls.
- Type II: $25–60K, 12 months of continuous observation period.
- Only worth it when a named prospect says "we cannot contract without your SOC 2 report".
- Practical path: start with Vanta (Tier 2) → run it for 12 months → have a Type II audit piggyback on that evidence.

**ISO 27001** — alternative to SOC 2
- $20–50K, 6–12 months.
- More popular for European and APAC clients. SOC 2 dominates North America.
- Generally: pick SOC 2 OR ISO 27001, not both.

## What NOT to pursue

### CSCB (Canadian Society of Customs Brokers)

**Cannot join** unless you hold a customs broker licence from CBSA. AccessToNorth explicitly positions as NOT a customs broker. If you ever wanted to become one:
- Pass the CBSA Professional Examination for Customs Brokers Licensing
- 3–5 years of apprenticeship under a licensed broker
- Post a customs broker bond
- ~$10K+ application fees + 2+ years of full-time prep

It's a career path, not a certification you add. Don't claim CSCB.

### IATA / FIATA / CIFFA

These are freight-forwarder associations. Irrelevant unless you start doing freight forwarding. Skip.

### PIPEDA compliance as a "certification"

PIPEDA is law, not a certification — you're already compliant if your Privacy Policy is followed. Don't claim "PIPEDA certified" (that's not a thing).

## Trust signals that ARE real and visible

Rank by signal-per-dollar:

1. **Verified Stripe payment processing** — already have. Visible in Footer.
2. **Privacy Policy + Security Overview** — already done. Links in Footer.
3. **BBB accreditation** — ~$700/yr. High visibility. ~2-week turnaround.
4. **Ontario Chamber of Commerce membership** — ~$450/yr. Medium visibility.
5. **CFIB membership** — $400/yr. Low-medium visibility but targets the SMB buyer demographic.
6. **Vanta trust center** — $6–10K/yr. High visibility with mid-market buyers; also unlocks SOC 2 later.
7. **SOC 2 Type II** — $30K+ + $20K/yr. High visibility with enterprise; necessary for Fortune 500 contracts.

## When to add each trust signal to the site

Once each is earned, add to Footer in a new row:

```
[BBB A+ badge]  [Ontario Chamber badge]  [Vanta Trust badge]
```

Don't add anything until it's actually earned. Fake badges are the number-one B2B trust killer we've already cleaned up on this site.

## Recommended 12-month plan

| Month | Action | Cost |
|---|---|---|
| 1 | Apply BBB + Chamber. Publish Privacy + Security (done) | ~$1,200/yr |
| 2–3 | Start Vanta on annual plan. Run policy templates they provide | ~$500/mo |
| 6 | Complete Vanta policy set. Start "SOC 2 Type I readiness" track | — |
| 12 | If prospects are asking: run SOC 2 Type I audit | ~$20K one-time |

Year 1 total: ~$8–10K in compliance spend. Year 2 if scaling: ~$40K.

## Contact quotes to get in advance

- **BBB** — online form
- **Chamber of Commerce** — Ontario and your local chamber; apply online
- **Vanta / Drata / Secureframe** — book a demo, they'll send a quote
- **SOC 2 auditor** — Armanino, BDO, Johanson Group (vanta has a preferred-auditor list; rates are standardized)
