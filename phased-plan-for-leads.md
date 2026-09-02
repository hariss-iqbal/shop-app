Got it — here's the plan. First, the verdict, because it changes what the plan should be.

## How far off are you? Closer than you think — but broken in the one place that matters

I probed your live production endpoints. **The plumbing is ~80% built and genuinely well-engineered.** What's missing is the measurement loop, which is exactly why ads produce nothing.

**Verified live right now:**

| Thing | Status |
|---|---|
| Catalog feed (`/functions/v1/meta-catalog`) | ✅ HTTP 200, 27 products, self-updating |
| Meta Pixel `1888423905552768` on smartcell.pk | ✅ Live, guarded to prod hosts only |
| Pixel events: ViewContent, Search, Contact | ✅ Wired into product/catalog/contact pages |
| Pixel `content_ids` ↔ feed `id` match | ✅ Identical format → dynamic retargeting possible |
| Backend API + WhatsApp webhook | ✅ Deployed, `/health` 200, webhook rejects bad tokens (403) |
| Per-product OG tags for crawlers (`api/og.js`) | ✅ Real link previews in WhatsApp/FB |
| `post-to-facebook.mjs` (real Graph API posting) | ✅ Works, credentials in `.env.fb` |

**One correction to your mental model:** there's no sheet and no cron job on your side. It's a Supabase Edge Function serving live CSV that **Meta pulls on its own schedule**. That's better than a sheet — it never goes stale. And the admin "post to Facebook" button doesn't post; `post-preview.component.ts:60` only copies the caption to your clipboard. The *real* posting script exists but only runs when you type it into a terminal.

## The three gaps that are actually costing you leads

**1. Meta cannot see your conversions.** There is zero Conversions API — I grepped, nothing. Everything is browser pixel, which your own code comments admit is "blocked by most ad blockers." Worse: the moment someone clicks through to WhatsApp, Meta goes blind. It never learns whether that person became a lead or bought a phone. **Your bot knows. Nothing tells Meta.** So the optimizer is spending your money chasing clicks, not customers.

**2. A third of your catalog is invisible.** The feed header says `x-catalog-exported: 27`, `x-catalog-skipped: 13`. Thirteen products are dropped for having no image. Ads cannot show what isn't in the catalog.

**3. Your domain isn't verified.** No meta tag, no DNS TXT record. This blocks Aggregated Event Measurement, so you can't prioritize your conversion events.

Also worth knowing: **all of this Meta work is uncommitted.** `backend/scripts/`, `backend/src/services/whatsapp/`, `backend/supabase/functions/meta-catalog/`, and the `wa_messages` migration are untracked in git. It's running in production but exists only on this laptop.

---

# The phased plan

### Phase 0 — Protect and unblock (half a day, do this first)

1. **Commit everything.** 69 uncommitted files, including your entire Meta stack. One disk failure and it's gone.
2. **Fix the 13 imageless products.** Instant +48% catalog size, no ad spend needed.
3. **Verify smartcell.pk in Business Manager** (DNS TXT is easiest). Unblocks Phase 1.

### Phase 1 — Close the measurement loop ⭐ *This is the unlock*

Everything else is decoration until this is done.

1. **Conversions API from your backend**, with `event_id` deduplication against the browser pixel so events aren't double-counted.
2. **Fire a server-side `Lead` when the WhatsApp bot receives a real inbound conversation.** You already log to `wa_messages` and `contact_messages` — the data is sitting there. This is the single highest-value change in the whole plan: it's the only way Meta learns what a real customer looks like.
3. Add `PageView` on Angular route change (currently fires once at boot only).
4. Set AEM event priority: `Lead` > `Contact` > `ViewContent` > `Search` > `PageView`.

### Phase 2 — Look alive before you spend (1 week)

People *will* check your Page before messaging. A dead Page kills conversion.

1. **Automate the posting script you already have.** It works — it just needs a schedule (GitHub Action or Supabase cron). Note: it defaults to your *local* DB (`127.0.0.1:54322`), so it must be pointed at prod.
2. Confirm in Commerce Manager that the feed is actually connected on a schedule, and that the **WhatsApp Business catalog** is linked to the same catalog.

### Phase 3 — Turn ads on, in this order (start small)

1. **Click-to-WhatsApp ads first.** In Pakistan, WhatsApp *is* your checkout. CTWA has native attribution that doesn't depend on website pixel signal at all, and your bot is already standing by to answer. This is your best-fit ad product by a wide margin.
2. **Then catalog retargeting**, once `ViewContent` has built audience volume (needs Phase 1 running for ~2 weeks first).
3. Cold traffic-to-website ads last — they're the weakest option for your model.

**Positioning note:** 24 of your 27 live products are Google Pixels, and 22 are used. You aren't a generic phone shop — you're a Pixel specialist. "Pakistan's Pixel experts, PTA and non-PTA" is a far stronger ad than "we sell phones."

### Phase 4 — Scale on real data

Once `Lead` events have volume, switch campaigns to conversion optimization, build lookalikes off actual buyers, and let Advantage+ take over budget allocation.

---

**My recommendation: do Phase 0 and Phase 1 before spending another rupee on ads.** Running ads without CAPI is how you got here — Meta optimized toward the only thing it could measure, which was clicks.

Want me to start on Phase 0 and 1? I can commit the work, fix the catalog image gap, and build the Conversions API integration including the WhatsApp `Lead` event. The Business Manager steps (domain verification, event priority) you'd need to do yourself — I'll write out the exact clicks.
