---
name: sync-stock-import
description: Sync the shop's Excel stock sheet into the local Supabase DB — updating STOCK and price on variants that already exist, with GSMArena normalization (model names, marketing colors like black→Obsidian, RAM). The catalog is pre-seeded with every valid combination, so this never creates models or variants: sheet rows that match nothing are FLAGGED and skipped. Use when the user wants to import/load/sync stock or inventory from the Excel sheet, update stock counts from the sheet, or compare the Excel sheet vs the DB. Always show an overview first, then let the user choose Sync or Compare-only.
---

# Stock Sync (Excel → DB), stock-only, with GSMArena normalization

Updates stock counts and prices in the local Supabase DB from the shop's Excel stock
sheet, normalizing names/colors/RAM via GSMArena. Can also just compare sheet vs DB.

## Critical rules (NEVER violate)

1. **NEVER write to the database without showing the user what will change and getting
   an explicit "yes" first.** This covers `load --yes`, and any ad-hoc `INSERT`/`UPDATE`/
   `DELETE` you might be tempted to run by hand. No exceptions — not for a "small" fix,
   not because the user sounded like they were in a hurry, not because the same sync was
   approved earlier in the session. Each write needs its own confirmation.
2. **The confirmation must be a real `load --dry-run`**, never a description of what you
   think will happen. The dry run executes the whole sync against the live DB and rolls it
   back, so constraint violations and FK blocks surface for real. A summary you wrote from
   reading the sheet is not evidence.
3. **Show the user two things, in this order, and wait:**
   - **What stock is being written** — the `=== WRITE PREVIEW ===` block: per-variant
     `stock_was → stock_now (delta)`, which variants enter or leave the catalog, price
     changes, and the write-summary totals.
   - **The issues** — the `=== FLAGGED ===` block: unknown models, unmatched combinations,
     and the unit count that will NOT be imported. Plus any UNCERTAIN colour mappings from
     `prepare`, and any price-conflict groups from `overview`.
   Then ask. Only run `load --yes` after they say go.
4. **NEVER run `supabase db reset`** — it destroys the user's local auth users.
5. **NEVER write to the production database.** This skill is local-only. Prod is deployed
   manually by the user.
6. **If the flagged count is not zero, say so explicitly in the confirmation prompt**, with
   the number of units that will be skipped. Never let it be something the user has to
   notice for themselves in a wall of output.

## What changed, and why it matters

**The catalog is pre-seeded.** Every valid `storage × condition × PTA` combination for the
phones the shop deals in already exists as a variant (stock 0, price 0, `is_active=false`),
created by the **`sync-new-products`** skill. Shop staff therefore never create a variant —
they only put stock against one that is already there.

**So this skill no longer creates anything.** It updates stock and price on variants that
exist. It does **not** insert models or variants. A sheet row that matches no variant is
not a new product to invent — it is almost always a **typo in the sheet** (wrong storage,
misspelled model, wrong PTA wording), and inventing a row for it would put a phantom
product in the catalog and hide the typo. So it is **FLAGGED and skipped**.

**Flagged rows mean stock that did not get imported.** Never let them scroll past silently.
Report every one to the user, with the unit count that was skipped, and tell them the fix:

> Run `/sync-new-products <phone>` to seed that phone's combinations, then re-run this sync
> to bring its stock in — *or* correct the row in the sheet if it's a typo.

**The sheet is still the source of truth for what the public catalog shows.** The sync
applies only the difference — it never rebuilds. Stock that already matches is left
physically untouched (same product rows, same UUIDs, same view stats); short colours are
topped up, surplus ones trimmed. Anything the sheet stops listing — a whole variant, or one
colour of it — loses its *available* units, which makes `recalculate_variant()` zero
`stock_count` and set `is_active=false`, so it disappears from the catalog while its variant
row, images and sales history stay in the DB. `sold`/`reserved`/`out` units are never
touched, and units pinned by a `device_outs` **or a `sales`** row are never deleted.

**Loads via SQL, not the app UI** — the SQL path is complete and reliable. (The app's
"Add stock to existing variant" RPC historically dropped `ram_gb`/`condition_rating` and
once had a `pta_status` cast bug — see `reference/notes.md`.)

The engine is `scripts/stock_import.py` with four subcommands: `overview`, `prepare`,
`compare`, `load`. Config via env: `STOCK_XLSX`, `STOCK_DB`, `STOCK_API`, `STOCK_WORK`.

## Always follow this flow

### 1. Prerequisites
- Local Supabase must be running (`cd backend && supabase status`). DB URL default:
  `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (override with `STOCK_DB`).
- `python3` with `openpyxl` (already available in this env).
- Excel path: default `~/Downloads/Stock Management.xlsx` (override with `STOCK_XLSX`).
- GSMArena backend (needed for `prepare`/`compare`/`load`): check
  `curl -s $STOCK_API/health`. If not reachable, start it and point `STOCK_API` at it:
  ```bash
  cd backend && PORT=3099 npm run dev   # run in background; then export STOCK_API=http://localhost:3099
  ```
  Note: port 3001 is often taken by an unrelated app on this machine, so prefer 3099.
  This calls the backend's GSMArena scraper directly — no frontend/Playwright needed.

### 2. Show the OVERVIEW first (always)
```bash
python3 .claude/skills/sync-stock-import/scripts/stock_import.py overview
```
Relay it to the user: Excel models/variants/units, any **price-conflict groups that will
be skipped**, current DB counts, and what each option does. Then ask the user with
AskUserQuestion:
- **Sync** — update stock and price on existing variants to match the sheet, un-publish
  what the sheet no longer lists, and flag anything the DB doesn't have. Nothing is wiped,
  nothing is created.
- **Compare only** — show differences between the sheet and the DB (no writes).
- **Cancel**.

### 3a. Compare only
```bash
python3 .claude/skills/sync-stock-import/scripts/stock_import.py prepare   # GSMArena fetch + color map + normalize
python3 .claude/skills/sync-stock-import/scripts/stock_import.py compare   # diff normalized sheet vs current DB
```
Relay the diff. The **`!! FLAGGED`** block lists sheet rows with no DB variant and the
units that would be skipped — lead with that, it's the actionable part. Then the extras in
the DB and the field differences (price/slug/colors/units) for matching variants.

### 3b. Sync (only after the user picked it)
```bash
python3 .claude/skills/sync-stock-import/scripts/stock_import.py prepare
```
`prepare` prints the **color map** and flags any **UNCERTAIN** generic→marketing
mappings. If any are flagged, show them to the user and resolve before loading:
write `$STOCK_WORK/color_overrides.json` like
`{"Brand|Model|GenericColor": "MarketingColor"}` and re-run `prepare`.
Then load and verify:
```bash
python3 .claude/skills/sync-stock-import/scripts/stock_import.py load --dry-run   # preview, always run this first
python3 .claude/skills/sync-stock-import/scripts/stock_import.py load --yes
```
`--dry-run` is the confirmation artifact required by rule 1 — it is **not optional**. It
executes the entire sync for real and then rolls it back, so type errors, constraint
violations and FK blocks surface exactly as they would on the live run. It prints, in
this order:

1. **`=== FLAGGED — in the sheet, NOT in the DB, NOT synced ===`** — unknown models,
   unmatched variant combinations, and the total units skipped. If the count is non-zero,
   the sheet and the catalog disagree, and syncing anyway means that stock stays out of
   the system.
2. **`=== WRITE PREVIEW — every stock change this run will apply ===`** — per variant:
   `stock_was`, `stock_now`, `delta`, and whether it enters or leaves the catalog, biggest
   change first. Then a one-line write summary: variants gaining/losing stock, units
   added/removed, price changes, and units skipped as flagged.
3. which variants leave / enter the catalog, stock and price changes in detail,
4. units the sheet omits that were kept because a `device_outs` or `sales` row pins them,
5. before/after totals.

**Relay blocks 1 and 2 to the user and stop.** Lead with the write summary line ("adding
N units across M variants, removing X, P price changes") and the flagged count, then ask
for the go-ahead. Only after they confirm, run `--yes`.
Confirm the printed result: the `available units: before -> after` line should land on
the sheet's unit count **minus the flagged units**, plus 0 orphans and 0 missing slugs.
The script prints a NOTE reconciling the difference when they don't match. The
`+N inactive` count is the variants now hidden from the catalog.

## Handling flagged rows

For each flagged row, work out which it is — the sheet is far more often wrong than the
catalog:

- **Typo / wrong value in the sheet** (e.g. `1024GB` on a phone that maxes at 512, or
  `Pixle 9`). Fix the sheet and re-run. Do not seed the combination.
- **A phone genuinely new to the shop.** Run `/sync-new-products <phone>` — it verifies
  the real storage tiers against GSMArena, previews the combinations, and seeds them after
  confirmation. Then re-run this sync to bring the stock in.
- **A combination that never shipped** (e.g. a 128GB Pixel 10 Pro XL). The sheet is wrong;
  `sync-new-products` will refuse to seed it too. Fix the sheet.

Never "fix" a flagged row by inserting the variant by hand — that bypasses the storage
verification that stops phantom products reaching the catalog.

## Notes
- `load` is the only writing command and requires `--yes`. It updates rather than
  rebuilds: no table is wiped, and only `status='available'` product rows are ever
  deleted. It aborts if the sheet resolves to 0 *existing* variants, so a bad/empty sheet
  can't empty the catalog — and with stock-only sync that abort also fires if nothing in
  the sheet was ever seeded, which the error message calls out.
- Brands are still created when new: a brand is only a label and carries no combination
  set, so there is nothing to verify or get wrong.
- Price-conflict variant groups (same model+storage+PTA+condition, different selling
  price) are auto-skipped and listed in `overview`; resolve them in the sheet if needed.
- The sheet drives `selling_price`, which is what gives a pre-seeded variant its real
  price the first time it is stocked (seeded rows start at 0).
- The Excel column layout and shop-specific cleanup rules (CP = Non-PTA, drop redundant
  `512`/a-series spacing) are documented in `reference/notes.md`.
- **FK pins:** both `device_outs.product_id` and `sales.product_id` are NO ACTION /
  RESTRICT. An `available` unit referenced by either can never be deleted — attempting it
  aborts the whole transaction. The retire/trim steps exclude both. If a new table ever
  takes an FK to `products`, it needs the same exclusion.
