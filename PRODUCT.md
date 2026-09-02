# SmartCell — PRODUCT.md

## Register
product — app UI / tools. Design serves the task; earned familiarity over novelty.

## What it is
Inventory, POS, and two-shop transfer management for SmartCell, a phone shop in Islamabad
(master shop G-15 IT Tower + branch G-7 Fazal Tower). Three surfaces:
- **Web admin** (Angular + PrimeNG): full back office — inventory, sales, customers, reports.
- **Public catalog** (Angular): customer-facing phone listings.
- **Mobile app** (Expo/React Native, `mobile/`): the counter tool — variants admin plus the
  two-shop transfer model (move stock between shops, sell what the branch holds, IMEI-verified
  returns, claims, partner consignments).

## Users
- **The owner** (admin): technical, runs both shops, needs partner ledgers, price control,
  master-shop switching, full history. Uses web + mobile.
- **Cashiers/salesmen** (e.g. a 45-year-old non-technical salesman; a 22-year-old impatient
  one): mobile-only, mid-transaction with a customer standing at the counter. Plain language,
  minimal taps, forgiving guardrails. No IT jargon — "settle", "net balance", "consignment"
  must be translated to shop-speak ("sell", "owed to us", "partner phones with us").

## Product truths that shape design
- One shared device per counter; users hand the phone across shifts → sign-out must be obvious,
  state must survive user switches, and claims must NAME their holder.
- Money mistakes are the worst failure: mandatory buyer identity on branch sales (owner's rule),
  price sanity caps, IMEI confirmation on returns, honest counts on bulk actions.
- Concurrency is real (two counters, one phone stock) → claim-locks, no double-sales, and the
  UI must never invite a submit the server will reject.

## Brand personality
Utilitarian, trustworthy, calm. A tool that disappears into the task. Blue-slate palette,
system typography, dense-but-legible lists. Delight is speed, not decoration.

## Anti-references
- Consumer-app onboarding tours, decorative motion, gradients-as-identity.
- Accounting jargon in cashier-facing copy.
- Anything that adds taps to the sell/move/return loop.

## Accessibility
Counter use in bright shops on mid-range Androids: AA contrast on all text (including chips),
large tap targets, one-handed reach for primary actions.
