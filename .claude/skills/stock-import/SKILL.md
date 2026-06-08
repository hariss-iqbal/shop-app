---
name: stock-import
description: Import the shop's Excel stock sheet into the local Supabase DB with GSMArena normalization (model names, marketing colors like black→Obsidian, RAM), or compare the sheet against the current DB. Use when the user wants to import/load/dump stock or inventory from the Excel sheet, sync the sheet into the database, refresh variants from the sheet, or compare the Excel sheet vs the DB. Always show an overview first, then let the user choose Import-all (destructive) or Compare-only.
---

# Stock Import (Excel → DB) with GSMArena normalization

Imports variants + products from the shop's Excel stock sheet into the local Supabase
database, normalizing names/colors/RAM via GSMArena, and forming variant slugs (via the
DB trigger). Can also just compare the sheet against the current DB.

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
python3 .claude/skills/stock-import/scripts/stock_import.py overview
```
Relay it to the user: Excel models/variants/units, any **price-conflict groups that will
be skipped**, current DB counts, and what each option does. Then ask the user with
AskUserQuestion:
- **Import all** — wipe DB models/variants/products and load the sheet (destructive).
- **Compare only** — show differences between the sheet and the DB (no writes).
- **Cancel**.

### 3a. Compare only
```bash
python3 .claude/skills/stock-import/scripts/stock_import.py prepare   # GSMArena fetch + color map + normalize
python3 .claude/skills/stock-import/scripts/stock_import.py compare   # diff normalized sheet vs current DB
```
Relay the diff: variants that would be added, extras in the DB, and field differences
(price/slug/colors/units) for matching variants.

### 3b. Import all (destructive — only after the user picked it)
```bash
python3 .claude/skills/stock-import/scripts/stock_import.py prepare
```
`prepare` prints the **color map** and flags any **UNCERTAIN** generic→marketing
mappings. If any are flagged, show them to the user and resolve before loading:
write `$STOCK_WORK/color_overrides.json` like
`{"Brand|Model|GenericColor": "MarketingColor"}` and re-run `prepare`.
Then load and verify:
```bash
python3 .claude/skills/stock-import/scripts/stock_import.py load --yes
```
Confirm the printed result (variants/products counts, 0 orphans, 0 missing slugs).

## Notes
- `load` is the only destructive command and requires `--yes`. It wipes
  models/variants/products (brands/suppliers kept) before loading.
- Price-conflict variant groups (same model+storage+PTA+condition, different selling
  price) are auto-skipped and listed in `overview`; resolve them in the sheet if needed.
- The Excel column layout and shop-specific cleanup rules (CP = Non-PTA, drop redundant
  `512`/a-series spacing) are documented in `reference/notes.md`.
- For a fully autonomous run, the `stock-importer` agent wraps this same flow.
