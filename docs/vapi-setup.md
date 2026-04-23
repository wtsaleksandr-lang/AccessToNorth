# Vapi voice integration — setup guide

**Goal:** let visitors call an AI-answered phone line. The AI uses the same knowledge base as the website chat widget, can answer questions about services/pricing, and collects lead information when it can't fully answer.

Architecture (already implemented in `server/vapiRoutes.ts`):

- Vapi handles telephony (inbound calls, STT, TTS).
- Vapi uses the **`custom-llm`** pattern — each conversation turn is POSTed to our server at `/api/vapi/conversation`.
- Our server builds the system prompt, calls Claude with the short `buildVoicePrompt`, returns `{ output: { content, model } }`.
- `/api/vapi/webhook` receives call lifecycle events (start, end-of-call, status).

The server-side code is done. You just need Vapi credentials + a phone number.

## Step 1 — Create a Vapi account

1. Sign up at [vapi.ai](https://vapi.ai).
2. Go to **API keys** → copy the **private key** (`VAPI_API_KEY`) and **public key** (`VAPI_PUBLIC_KEY`).

## Step 2 — Buy a phone number

In Vapi dashboard → **Phone numbers** → **Buy number**.

- Canada / US numbers are ~$5/month.
- Alternatively, if you already have a Twilio number, you can bring it. Details at vapi.ai/docs/phone-numbers/import-twilio.
- Once purchased, note the **Phone Number ID** (`VAPI_PHONE_NUMBER_ID`).

## Step 3 — Create an assistant

In Vapi dashboard → **Assistants** → **Create new**.

Paste this config (replace `https://www.accesstonorth.com` with your production domain):

```json
{
  "name": "AccessToNorth Voice",
  "firstMessage": "Hi, this is the AccessToNorth team line. I can help with Canadian business registration, GST/HST, CARM, or customs clearance. What brings you in today?",
  "model": {
    "provider": "custom-llm",
    "url": "https://www.accesstonorth.com/api/vapi/conversation"
  },
  "voice": {
    "provider": "11labs",
    "voiceId": "rachel"
  },
  "transcriber": {
    "provider": "deepgram",
    "model": "nova-2",
    "language": "en"
  },
  "serverUrl": "https://www.accesstonorth.com/api/vapi/webhook",
  "endCallFunctionEnabled": true,
  "recordingEnabled": false
}
```

- **`model.provider: "custom-llm"`** is the key setting. Vapi will route every turn to our server.
- **`serverUrl`** receives call lifecycle events (start/end/transcript). Our handler already exists.
- **`voice.voiceId`** — `rachel` is a solid default. You can audition other 11labs voices in the Vapi dashboard.
- **`recordingEnabled: false`** unless you have a clear consent + retention policy.

Save. Copy the **Assistant ID** (`VAPI_ASSISTANT_ID`).

## Step 4 — Set webhook secret

In your Assistant settings → **Webhook** → set a secret (random 32-byte string). Copy it. This becomes `VAPI_WEBHOOK_SECRET`.

Our `/api/vapi/webhook` handler verifies the `x-vapi-signature` header against this secret using HMAC-SHA256 — see `server/vapiRoutes.ts:verifyWebhookSignature`.

## Step 5 — Bind the phone number to the assistant

In Vapi → **Phone numbers** → your new number → **Assistant** → select "AccessToNorth Voice" → Save.

## Step 6 — Set env vars

In your deployment environment (Replit secrets, Vercel env, wherever):

```
ANTHROPIC_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-haiku-4-5-20251001    # default — override if needed

VAPI_API_KEY=vapi_priv_...
VAPI_PUBLIC_KEY=vapi_pub_...
VAPI_ASSISTANT_ID=assistant-xxxxxxxx
VAPI_PHONE_NUMBER_ID=phnum-xxxxxxxx
VAPI_WEBHOOK_SECRET=long-random-string-match-vapi-dashboard
VAPI_SERVER_URL=https://www.accesstonorth.com
```

Deploy. Our server loads these lazily on the first request so no restart sequencing matters.

## Step 7 — Test the line

1. Call the Vapi number from your phone.
2. You should hear the first-message greeting within 1 second.
3. Ask a question: "Do non-resident sellers need a GST/HST number in Canada?"
4. You should get a 1–2-sentence spoken reply within ~2 seconds.

Debug:

- Vapi dashboard → **Calls** → click the call → see full transcript + per-turn latency.
- Your server logs will show `[vapi] conversation error:` if Claude failed.
- Our `/api/vapi/status` endpoint returns readiness diagnostics (doesn't expose secrets).

## Step 8 — Put the phone number on the website

Once the line is live and tested, add the number back to:

- [client/index.html](../client/index.html) — Organization JSON-LD (`"telephone": "+1-xxx-xxx-xxxx"`)
- [client/src/components/JsonLd.tsx](../client/src/components/JsonLd.tsx) — same
- [client/src/components/Footer.tsx](../client/src/components/Footer.tsx) — Contact column
- [client/src/pages/Contact.tsx](../client/src/pages/Contact.tsx) — re-add a Phone card

Rebuild the site. Current state has the placeholder removed — better no phone than a fake one.

## Cost estimates (2026)

- Vapi: $0.05 / minute (inbound), with per-provider passthrough for 11labs + Deepgram at their rate
- 11labs: $0.18 / 1K characters for premium voice, ~$0.015–0.03 / min
- Deepgram nova-2: $0.0043 / min
- Claude Haiku via our API: $0.25 / million input tokens, $1.25 / million output

**Expected blended cost:** ~$0.12–0.20 per minute of call.

For 500 minutes/month (about 100 short calls), that's ~$60–100/month plus the $5 phone number.

## Advanced: per-client voice assistants

WeFixTrades uses `upsertVapiAssistant()` + `provisionTradeLineAssistant()` to create a per-client voice assistant with a custom system prompt. That's useful when you want the AI to answer as if it's a specific business, referencing their account info.

AccessToNorth doesn't need this out of the gate — one shared "Ask AccessToNorth" assistant is enough. If you ever want to extend:

1. Each `client_services` row could get its own `vapi_assistant_id` in metadata.
2. `server/vapiService.ts` (port from WeFixTrades) can push new assistants via `POST https://api.vapi.ai/assistant`.
3. Inbound calls from the client's phone number resolve the assistant via the `assistant-request` webhook branch.

Hold until you have a use case. For the company line, the default setup above is fine.

## Troubleshooting

- **Silent greeting** — `firstMessage` is empty or voice provider is misconfigured. Check Vapi → Assistant → Voice.
- **"I'm having trouble connecting"** response — our server errored. Check server logs for `[vapi] conversation error:`. Most common cause: missing `ANTHROPIC_API_KEY`.
- **Webhook signature failures** (401) — `VAPI_WEBHOOK_SECRET` mismatch. Re-copy from Vapi dashboard to env var.
- **High latency** — Use `claude-haiku-4-5-20251001` (default). Don't switch to Sonnet for voice — the added latency is audible.
- **Call cuts off mid-sentence** — usually a max-tokens issue. Our voice prompt already caps at 180 tokens (~30 words) per turn, which is intentional.
