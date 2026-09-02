# WhatsApp Inbound Bot

Auto-answers customer WhatsApp messages (price / stock / PTA / condition / colors)
from the **same live `variants` data** the catalog shows, in **English + Roman Urdu**,
and flags conversations for a human when someone wants a live video or to negotiate.

This is the inbound counterpart to the existing outbound receipt sender
(`frontend/.../whatsapp.service.ts`, which only builds `wa.me` links).

## Architecture

```
Customer WhatsApp → Meta Cloud API → POST /api/whatsapp/webhook (backend Express/Vercel)
   → verify signature → parse intent (message-parser)
   → look up inventory (inventory-lookup.service → Supabase variants/models/brands)
   → compose reply (reply-composer, bilingual) → send via Cloud API client
   → log lead to contact_messages
```

Files:
- `cloud-api.client.ts` — send text/image, verify webhook signature
- `message-parser.ts` — intent + model/storage/PTA extraction (EN + Roman Urdu)
- `inventory-lookup.service.ts` — Supabase model matching + in-stock variants
- `reply-composer.ts` — bilingual reply text (never negotiates price)
- `whatsapp-bot.service.ts` — orchestrator (decide → send → log)
- routes added in `backend/api/index.ts`: `GET/POST /api/whatsapp/webhook`

## Environment variables (set these in Vercel — never commit them)

| Var | Required | What it is |
|-----|----------|------------|
| `WHATSAPP_VERIFY_TOKEN` | yes | Any random string YOU pick; entered again in Meta's webhook config |
| `WHATSAPP_APP_SECRET` | yes | Meta App → Settings → Basic → App Secret (verifies inbound signatures) |
| `WHATSAPP_ACCESS_TOKEN` | yes | Permanent System-User access token (WhatsApp Business) |
| `WHATSAPP_PHONE_NUMBER_ID` | yes | WhatsApp → API Setup → "Phone number ID" |
| `WHATSAPP_GRAPH_VERSION` | no | Graph API version (default `v21.0`) |
| `SUPABASE_URL` | yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | yes | Service-role key (reads inventory + logs leads) |
| `SHOP_CATALOG_URL` | no | Defaults to `https://www.smartcell.pk/catalog` |

The bot **fails soft**: with no credentials it still parses + composes replies
(logged, not sent), so you can test the logic before the Meta account is live.

## Meta setup (the part you do — credentials stay with you)

1. **developers.facebook.com** → Create App → type **Business** → add the **WhatsApp** product.
2. In **WhatsApp → API Setup**, note the **Phone number ID** and **WhatsApp Business Account ID**.
   Register/verify the business number you want the bot to run on. *(That number can no
   longer be used in the normal WhatsApp app — see number decision in chat.)*
3. **App → Settings → Basic** → copy the **App Secret** → set as `WHATSAPP_APP_SECRET`.
4. Create a **System User** with a **permanent token** (WhatsApp scopes) → set as `WHATSAPP_ACCESS_TOKEN`.
5. **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://<your-backend-domain>/api/whatsapp/webhook`
   - Verify token: the same string you set as `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to the **`messages`** field.
6. Paste all values into Vercel env vars, redeploy, send a test message.

Replies to inbound messages within Meta's 24-hour window are free-form — no
message-template approval needed for this Q&A bot.

## Local smoke test (no Meta needed)

```bash
# from backend/
npx ts-node -e "import {WhatsAppBotService} from './src/services/whatsapp/whatsapp-bot.service'; \
new WhatsAppBotService().decideReply({from:'92300',messageId:'1',text:'pixel 7a 128 kitnay ka hai'}).then(r=>console.log(r.text))"
```
(Requires `SUPABASE_URL` + a key in env for the inventory lookup to return rows.)
