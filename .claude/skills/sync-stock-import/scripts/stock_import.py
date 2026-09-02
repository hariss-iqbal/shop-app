#!/usr/bin/env python3
"""
stock_import.py — import the shop's Excel stock sheet into the local Supabase DB,
with GSMArena normalization (model names, marketing colors, RAM), or compare the
sheet against the current DB.

Subcommands:
  overview   Parse the Excel + read DB counts. Print what an import/compare would do.
             (No DB writes, no GSMArena needed.)
  prepare    Fetch GSMArena specs per model, build the generic->marketing color map,
             and write the normalized dataset. Flags UNCERTAIN color mappings.
             (Needs the GSMArena backend reachable at $STOCK_API. No DB writes.)
  compare    Compare the normalized Excel dataset against the current DB. (Run prepare first.)
  load       Reconcile the DB against the normalized dataset (run prepare first).
             Requires --yes, or --dry-run to execute the whole thing and roll it
             back with a before/after report. Nothing is wiped — only the
             difference is applied:
             • NEVER creates models or variants. The catalog is pre-seeded with every
               valid combination by the `sync-new-products` skill, so a sheet row with
               no matching variant means a typo or a genuinely new phone — it is
               FLAGGED and skipped, never invented. Run `/sync-new-products <phone>`
               to create the combinations, then re-run this sync.
             • Updates stock (and price) on variants that already exist.
             • Per (variant, colour): tops up or trims the AVAILABLE unit count to
               match the sheet's Quantity. Units already at the right count are left
               untouched, so their product UUIDs and view stats survive.
             • Anything absent from the sheet loses its AVAILABLE units, so the
               recalculate_variant trigger zeroes stock_count and flips is_active
               to false — it drops out of the public catalog without being deleted.
             • sold/reserved/out units are never touched, so sales history is intact.
             • Units tied to a device_outs row are never deleted (FK is RESTRICT).
             • Variant UUIDs are never recycled — variant_images stay linked.

Config via env:
  STOCK_XLSX  path to the Excel sheet     (default: ~/Downloads/Stock Management.xlsx)
  STOCK_DB    postgres URL                (default: local supabase)
  STOCK_API   GSMArena backend base URL   (default: http://localhost:3001)
  STOCK_WORK  scratch dir for json/sql    (default: /tmp/stock-import)

The Excel is expected to have columns:
  Name, Type, Brand, Color, Storage (GB), RAM (GB), Condition, Condition Rating (1-10),
  Battery Health (%), PTA Status, IMEI / Serial, Quantity, Cost Price (PKR),
  Selling Price (PKR), Notes
"""
import os, sys, re, json, time, subprocess, urllib.request
from collections import defaultdict, OrderedDict

XLSX = os.environ.get("STOCK_XLSX", os.path.expanduser("~/Downloads/Stock Management.xlsx"))
DB   = os.environ.get("STOCK_DB", "postgresql://postgres:postgres@127.0.0.1:54322/postgres")
API  = os.environ.get("STOCK_API", "http://localhost:3001").rstrip("/")
WORK = os.environ.get("STOCK_WORK", "/tmp/stock-import")
os.makedirs(WORK, exist_ok=True)

# ----------------------------------------------------------------------------- helpers
def _psql_env():
    """Pass PGPASSWORD from env so psql doesn't need it embedded in the URL."""
    env = dict(os.environ)
    pw = os.environ.get("STOCK_DB_PASSWORD")
    if pw:
        env["PGPASSWORD"] = pw
    return env

def psql(sql):
    r = subprocess.run(["psql", DB, "-t", "-A", "-F", "\t", "-c", sql],
                       capture_output=True, text=True, env=_psql_env())
    if r.returncode != 0:
        raise RuntimeError("psql error: " + r.stderr.strip())
    return [ln.split("\t") for ln in r.stdout.strip().split("\n") if ln.strip()]

def psql_file(path):
    r = subprocess.run(["psql", DB, "-v", "ON_ERROR_STOP=1", "-f", path],
                       capture_output=True, text=True, env=_psql_env())
    if r.returncode != 0:
        raise RuntimeError("psql load error: " + r.stderr.strip())
    return r.stdout

def api_post(path, body):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)

def api_up():
    try:
        urllib.request.urlopen(API + "/health", timeout=4); return True
    except Exception:
        return False

# ------------------------------------------------------------------- canonicalization
# Vocab is matched case-insensitively (sheets vary: "PTA"/"pta", "Box"/"open box").
PTA  = {"pta approved": "pta_approved", "pta": "pta_approved",
        "non-pta": "non_pta", "non pta": "non_pta",
        "online approved": "non_pta"}   # shop's "online approved" -> Non-PTA (per import choice)
COND = {"new": "new", "used": "used", "open box": "open_box", "box": "open_box",
        "sealed box": "new", "sealed": "new", "refurbished": "refurbished",
        "box pack": "new", "new box": "new", "new without box": "open_box"}

def pta_norm(v):
    if v is None or str(v).strip() == "": return None
    return PTA.get(str(v).strip().lower(), str(v).strip())

def cond_norm(v):
    if v is None or str(v).strip() == "": return "new"   # blank condition -> new (column is NOT NULL)
    return COND.get(str(v).strip().lower(), str(v).strip().lower())

BRANDS_KNOWN = {"google": "Google", "apple": "Apple", "nothing": "Nothing",
                "oneplus": "OnePlus", "samsung": "Samsung", "xiaomi": "Xiaomi"}
def canon_brand(b):
    s = re.sub(r"\s+", " ", str(b or "").strip())
    return BRANDS_KNOWN.get(s.lower(), s)

ACCESSORY_KW = ("buds", "earbud", "watch", "case", "charger", "cable", "adapter")
def is_accessory(name):
    n = str(name or "").lower()
    return any(k in n for k in ACCESSORY_KW)

def canon_model(brand, name):
    """Light cleanup for grouping + a GSMArena search query. Final display name
    comes from GSMArena (gsm_name) during `prepare`."""
    s = re.sub(r"\s+", " ", str(name).strip().lower())
    bl = str(brand).strip().lower()
    if bl and s.startswith(bl + " "):
        s = s[len(bl):].strip()                        # drop a leading brand prefix in the name
    s = re.sub(r"\bcp\b", "", s).strip()              # shop convention: CP = Non-PTA marker
    s = re.sub(r"\bjv\b", "", s).strip()              # "JV" = regional (Japan) SKU marker, not the model
    s = re.sub(r"\b512\b", "", s).strip()              # redundant storage suffix in name
    s = re.sub(r"pixel\s+(\d+)\s+a\b", r"pixel \1a", s)  # "pixel 7 a" -> "pixel 7a"
    s = re.sub(r"^(oneplus)(\d.*)$", r"\1 \2", s)         # "oneplus13t" -> "oneplus 13t"
    s = re.sub(r"\s+", " ", s).strip()
    out = []
    for tok in s.split(" "):
        if tok in ("pro", "max", "plus", "ultra", "mini"): out.append(tok.capitalize())
        elif tok == "xl": out.append("XL")
        elif tok == "se": out.append("SE")
        elif tok == "iphone": out.append("iPhone")
        elif tok == "oneplus": out.append("OnePlus")
        elif tok == "pixel": out.append("Pixel")
        elif tok == str(brand).lower(): continue          # strip brand token from model name
        elif re.fullmatch(r"\d+a", tok): out.append(tok)  # a-series stays lowercase a
        elif re.fullmatch(r"\d+t", tok): out.append(tok[:-1] + "T")
        else: out.append(tok)
    return " ".join(out)

def canon_color(c):
    s = re.sub(r"\s+", " ", str(c).strip().lower()).replace("bule", "blue")
    return " ".join(w.capitalize() for w in s.split(" "))

def slugify(*parts):
    out = [re.sub(r"[^a-z0-9]+", "-", str(p).lower()) for p in parts if p not in (None, "")]
    return re.sub(r"-+", "-", "-".join(out)).strip("-")

# generic family -> candidate GSMArena marketing keywords (priority order)
COLOR_KW = {
    "black": ["obsidian", "stormy black", "midnight", "graphite", "charcoal", "matte space gray", "space gray", "black"],
    "white": ["snow", "porcelain", "cloudy white", "chalk", "starlight", "matte silver", "silver", "white"],
    "blue":  ["bay", "sierra blue", "pacific blue", "sea", "indigo", "blue"],
    "green": ["alpine green", "matte midnight green", "midnight green", "wintergreen", "sage", "mint", "seafoam", "green"],
    "gold":  ["matte gold", "gold"],
    "pink":  ["peony", "rose quartz", "rose", "kinda coral", "coral", "pink"],
    "purple": ["iris", "indigo", "purple"],
    "gray":  ["graphite", "space gray", "gray"],
    "silver": ["matte silver", "silver"],
    "hazel": ["hazel"], "moonstone": ["moonstone"], "jade": ["jade"],
    "lemon grass": ["lemongrass"], "lemongrass": ["lemongrass"],
}

def map_color(generic, gsm_colors, overrides, brand, model):
    if (brand, model, generic) in overrides:
        return overrides[(brand, model, generic)], "override"
    if not gsm_colors:
        return None, "no-data"        # GSMArena gave us nothing to map against
    g = generic.lower().strip()
    norm = lambda s: re.sub(r"\s+", "", s.lower())
    for c in gsm_colors:
        if norm(c) == norm(g): return c, "exact"
    for kw in COLOR_KW.get(g, []):
        for c in gsm_colors:
            if kw in c.lower(): return c, "mapped"
    for c in gsm_colors:
        if g in c.lower(): return c, "loose"
    return None, "UNCERTAIN"

# -------------------------------------------------------------------------- parse Excel
COLS = ["Name", "Type", "Brand", "Color", "Storage (GB)", "RAM (GB)", "Condition",
        "Condition Rating (1-10)", "Battery Health (%)", "PTA Status", "IMEI / Serial",
        "Quantity", "Cost Price (PKR)", "Selling Price (PKR)", "Notes"]

def parse_excel():
    import openpyxl
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.worksheets[0]
    ncol = ws.max_column                               # honor the sheet's actual column count
    hdr = [ws.cell(row=1, column=c).value for c in range(1, ncol + 1)]
    rows, skipped_acc = [], 0
    for r in range(2, ws.max_row + 1):
        vals = [ws.cell(row=r, column=c).value for c in range(1, ncol + 1)]
        if all(v is None for v in vals):
            continue
        d = {k: (v.strip() if isinstance(v, str) else v) for k, v in zip(hdr, vals)}
        if is_accessory(d.get("Name")):                # non-phone items (e.g. earbuds) excluded
            skipped_acc += 1
            continue
        rows.append((r, d))
    if skipped_acc:
        print(f"(skipped {skipped_acc} non-phone/accessory row(s))", file=sys.stderr)

    def vkey(d):
        brand = canon_brand(d.get("Brand"))
        return (brand, canon_model(brand, d["Name"]),
                int(d["Storage (GB)"]) if d.get("Storage (GB)") is not None else None,
                pta_norm(d.get("PTA Status")),
                cond_norm(d.get("Condition")))

    groups = defaultdict(list)
    for r, d in rows:
        groups[vkey(d)].append((r, d))

    # price conflicts: same variant key, >1 distinct selling price -> set aside
    conflicts = {k for k, items in groups.items()
                 if len({i[1]["Selling Price (PKR)"] for i in items}) > 1}

    variants = OrderedDict()
    for k, items in groups.items():
        if k in conflicts:
            continue
        brand, model, storage, pta, cond = k
        sp = float(items[0][1]["Selling Price (PKR)"])
        variants[k] = {
            "brand": brand, "model": model, "storage_gb": storage,
            "pta_status": pta, "condition": cond, "selling_price": sp,
            "rows": [{
                "excel_row": r,
                "color": canon_color(d["Color"]),
                "ram_gb": int(d["RAM (GB)"]) if d.get("RAM (GB)") is not None else None,
                "cost_price": float(d["Cost Price (PKR)"]) if d.get("Cost Price (PKR)") is not None else 0.0,
                "condition_rating": int(d["Condition Rating (1-10)"]) if d.get("Condition Rating (1-10)") is not None else None,
                "battery_health": int(d["Battery Health (%)"]) if d.get("Battery Health (%)") is not None else None,
                "imei": (str(d["IMEI / Serial"]).strip() if d.get("IMEI / Serial") is not None else None),
                "qty": int(d["Quantity"]) if d.get("Quantity") is not None else 1,
                "notes": (str(d["Notes"]).strip() if d.get("Notes") is not None else None),
            } for r, d in items],
        }
    conflict_detail = [{"key": k, "rows": [r for r, _ in groups[k]],
                        "prices": sorted({i[1]["Selling Price (PKR)"] for i in groups[k]})}
                       for k in conflicts]
    return variants, conflict_detail

def db_counts():
    try:
        rows = psql("SELECT (SELECT count(*) FROM models),(SELECT count(*) FROM variants),"
                    "(SELECT count(*) FROM products),(SELECT count(*) FROM products WHERE variant_id IS NULL)")
        m, v, p, o = rows[0]
        return dict(models=int(m), variants=int(v), products=int(p), orphans=int(o))
    except Exception as e:
        return {"error": str(e)}

# ------------------------------------------------------------------------- subcommands
def cmd_overview():
    variants, conflicts = parse_excel()
    units = sum(r["qty"] for v in variants.values() for r in v["rows"])
    brands = sorted({v["brand"] for v in variants.values()})
    models = sorted({(v["brand"], v["model"]) for v in variants.values()})
    db = db_counts()
    print("=" * 64)
    print("STOCK SYNC — OVERVIEW  (stock-only: never creates models or variants)")
    print("=" * 64)
    print(f"Excel file : {XLSX}")
    print(f"\nExcel (clean, loadable):")
    print(f"  brands   : {', '.join(brands)}")
    print(f"  models   : {len(models)}")
    print(f"  variants : {len(variants)}   (grouped by model+storage+PTA+condition)")
    print(f"  units    : {units}")
    if conflicts:
        print(f"\n  ⚠ price-conflict variant groups SKIPPED ({len(conflicts)}):")
        for c in conflicts:
            b, m, st, pta, cond = c["key"]
            print(f"     - {m} {st}GB {cond}/{pta}  excel rows {c['rows']}  prices {c['prices']}")
    print(f"\nCurrent local DB:")
    if "error" in db:
        print(f"  (could not read DB: {db['error']})")
    else:
        print(f"  models={db['models']}  variants={db['variants']}  products={db['products']}  orphans={db['orphans']}")
    print(f"\nWhat each option does:")
    print(f"  • SYNC    : GSMArena-normalize, then update stock/price on EXISTING variants to "
          f"match the sheet's\n              {len(variants)} variants / {units} units — nothing is wiped and nothing is created.")
    print(f"              Matching stock is left alone, short colours are topped up, and anything the")
    print(f"              sheet no longer lists loses its available units so it drops out of the public")
    print(f"              catalog (sold/reserved/out history untouched).")
    print(f"              Sheet rows with no matching variant are FLAGGED and skipped — seed them with")
    print(f"              /sync-new-products <phone>, then re-run this sync to bring their stock in.")
    print(f"  • COMPARE : GSMArena-normalize the sheet and diff against the current DB (no writes).")
    print(f"\nGSMArena backend ($STOCK_API={API}): {'reachable' if api_up() else 'NOT reachable — needed for import/compare'}")

def cmd_prepare():
    if not api_up():
        print(f"ERROR: GSMArena backend not reachable at {API}. Start the shop backend "
              f"(cd backend && npm run dev) or set STOCK_API.", file=sys.stderr)
        sys.exit(2)
    variants, conflicts = parse_excel()
    models = sorted({(v["brand"], v["model"]) for v in variants.values()})

    # load optional human overrides for color mapping
    ov_path = os.path.join(WORK, "color_overrides.json")
    overrides = {}
    if os.path.exists(ov_path):
        for k, val in json.load(open(ov_path)).items():
            b, m, g = k.split("|"); overrides[(b, m, g)] = val

    specs, missed = {}, []
    print(f"Fetching GSMArena specs for {len(models)} models...")
    for b, m in models:
        try:
            res = api_post("/api/products/fetch-specs", {"brand": b, "model": m})
            if not res.get("success"):          # HTTP 200 with success:false is still a miss
                raise RuntimeError(res.get("error") or "GSMArena returned no data")
            d = res.get("data") or {}
            specs[(b, m)] = {"gsm_name": d.get("modelName") or m, "colors": d.get("colors") or [],
                             "storage": d.get("storage") or [], "ram": d.get("ram") or []}
            print(f"  ok  {b} {m} -> {d.get('modelName')!r} colors={d.get('colors')}")
        except Exception as e:
            specs[(b, m)] = {"gsm_name": m, "colors": [], "storage": [], "ram": []}
            missed.append(f"{b} {m}")
            print(f"  !!  {b} {m} -> {e}; keeping the sheet's name and colours as-is")
        time.sleep(0.4)  # GSMArena throttles rapid calls

    norm = {"models": [], "variants": []}
    color_review, uncertain = [], 0
    for v in variants.values():
        sp = specs[(v["brand"], v["model"])]
        gsm_name, gsm_ram, gsm_storage = sp["gsm_name"], sp["ram"], sp["storage"]
        def pick_ram(excel_ram):
            if len(gsm_ram) == 1: return gsm_ram[0]
            if len(gsm_ram) == 0: return excel_ram
            return excel_ram if excel_ram in gsm_ram else (gsm_ram[-1] if excel_ram is None else excel_ram)
        nv = {**{k: v[k] for k in ("brand", "storage_gb", "pta_status", "condition", "selling_price")},
              "model": gsm_name, "orig_model": v["model"],
              "predicted_slug": slugify(v["brand"], gsm_name,
                                        (str(v["storage_gb"]) + "gb") if v["storage_gb"] else None,
                                        v["condition"], v["pta_status"]),
              "rows": []}
        for r in v["rows"]:
            mk, conf = map_color(r["color"], sp["colors"], overrides, v["brand"], v["model"])
            if conf in ("UNCERTAIN", "loose"): uncertain += 1
            color_review.append({"brand": v["brand"], "model": gsm_name, "generic": r["color"],
                                 "marketing": mk, "confidence": conf, "gsm_colors": sp["colors"]})
            nv["rows"].append({**r, "generic_color": r["color"], "color": mk or r["color"],
                               "ram_gb": pick_ram(r["ram_gb"])})
        norm["variants"].append(nv)
    norm["models"] = sorted({(v["brand"], v["model"]) for v in norm["variants"]})
    json.dump(norm, open(os.path.join(WORK, "dataset_norm.json"), "w"), indent=2, default=str)
    json.dump(color_review, open(os.path.join(WORK, "color_review.json"), "w"), indent=2)

    print(f"\nNormalized -> {WORK}/dataset_norm.json  "
          f"({len(norm['models'])} models, {len(norm['variants'])} variants)")
    print("\nCOLOR MAP (generic -> GSMArena marketing):")
    shown = [c for c in color_review if c["confidence"] != "no-data"]
    for c in sorted(shown, key=lambda x: (x["confidence"] != "UNCERTAIN", x["model"], x["generic"])):
        flag = "   <== REVIEW" if c["confidence"] in ("UNCERTAIN", "loose") else ""
        print(f"  {c['brand']:7} {c['model']:16} {c['generic']:12} -> {str(c['marketing']):16} "
              f"[{c['confidence']}]{flag}")
    nodata = len(color_review) - len(shown)
    if nodata:
        print(f"  ({nodata} colour(s) passed through unchanged — GSMArena had no specs for "
              f"their model)")
    if missed:
        print(f"\n⚠ GSMArena returned nothing for {len(missed)} of {len(models)} model(s): "
              f"{', '.join(missed[:6])}{' ...' if len(missed) > 6 else ''}")
        print("  Their sheet names and colours are used verbatim. That is safe for the sync "
              "(the DB matches on name), but no marketing-colour normalization happens.")
    if uncertain:
        print(f"\n⚠ {uncertain} mapping(s) need review. To override, write {ov_path} as "
              f'{{"Brand|Model|GenericColor": "MarketingColor", ...}} and re-run prepare.')

def _snapshot():
    out = psql("""
    SELECT b.name, m.name, v.storage_gb, v.pta_status, v.condition::text, v.selling_price,
           v.slug, v.stock_count,
           coalesce((SELECT string_agg(c,'|' ORDER BY c) FROM unnest(v.available_colors) c),'')
    FROM variants v JOIN models m ON v.model_id=m.id JOIN brands b ON m.brand_id=b.id
    """)
    snap = {}
    for r in out:
        storage = int(r[2]) if r[2] not in (None, "") else None
        snap[(r[0], r[1], storage, r[3], r[4])] = dict(
            sell=float(r[5]), slug=r[6], stock=int(r[7]), colors=r[8])
    return snap

def cmd_compare():
    path = os.path.join(WORK, "dataset_norm.json")
    if not os.path.exists(path):
        print("ERROR: run `prepare` first (need dataset_norm.json).", file=sys.stderr); sys.exit(2)
    norm = json.load(open(path))
    db = _snapshot()
    db_models = {(k[0], k[1]) for k in db}       # models the DB actually stores
    excel = {}
    for v in norm["variants"]:
        # Mirror the loader: a model the DB already holds is not renamed by GSMArena.
        model = v["model"]
        orig = v.get("orig_model") or model
        if (v["brand"], model) not in db_models and (v["brand"], orig) in db_models:
            model = orig
        excel[(v["brand"], model, v["storage_gb"], v["pta_status"], v["condition"])] = {
            "sell": float(v["selling_price"]),
            "units": sum(r["qty"] for r in v["rows"]),
            "colors": "|".join(sorted({r["color"] for r in v["rows"]})),
            "slug": v["predicted_slug"]}
    only_excel = sorted(set(excel) - set(db))
    only_db = sorted(set(db) - set(excel))
    both = sorted(set(excel) & set(db))
    print("=" * 64); print("COMPARE — normalized Excel vs current DB"); print("=" * 64)
    print(f"\n!! FLAGGED — in Excel but NOT in DB. These are NOT created and NOT synced;")
    print(f"   run /sync-new-products <phone> to seed the combinations, then re-run — {len(only_excel)}:")
    for k in only_excel: print(f"  ! {k[1]} {k[2]}GB {k[4]}/{k[3]}  ({excel[k]['units']} units NOT imported, {excel[k]['colors']})")
    if only_excel:
        print(f"   -> {sum(excel[k]['units'] for k in only_excel)} units in the sheet will be skipped.")
    print(f"\nIn DB but NOT in Excel (extra in DB) — {len(only_db)}:")
    for k in only_db: print(f"  - {k[1]} {k[2]}GB {k[4]}/{k[3]}  (db stock {db[k]['stock']})")
    print(f"\nIn BOTH — {len(both)} (field differences):")
    diffs = 0
    for k in both:
        e, d = excel[k], db[k]
        msg = []
        if abs(e["sell"] - d["sell"]) > 0.001: msg.append(f"sell {e['sell']:.0f}!=db {d['sell']:.0f}")
        if e["slug"] != d["slug"]: msg.append(f"slug {e['slug']}!=db {d['slug']}")
        if e["colors"] != d["colors"]: msg.append(f"colors [{e['colors']}]!=db[{d['colors']}]")
        if e["units"] != d["stock"]: msg.append(f"excel units {e['units']}!=db stock {d['stock']}")
        if msg: diffs += 1; print(f"  ~ {k[1]} {k[2]}GB {k[4]}/{k[3]}: {'; '.join(msg)}")
    if not diffs: print("  (all matching variants identical on sell/slug/colors/units)")

def sheet_units(norm):
    """Collapse the sheet to one entry per (variant, colour) with the summed Quantity.

    The sheet has no IMEI column, so a colour group is the finest identity a unit
    has — reconciliation is therefore count-based per colour, not row-based.
    """
    out = OrderedDict()
    for v in norm["variants"]:
        for r in v["rows"]:
            key = (v["brand"], v["model"], v.get("orig_model") or v["model"],
                   v["storage_gb"], v["pta_status"], v["condition"], r["color"])
            e = out.get(key)
            if e is None:
                out[key] = {"qty": r["qty"], "ram_gb": r["ram_gb"],
                            "cost_price": r["cost_price"],
                            "condition_rating": r.get("condition_rating"),
                            "battery_health": r.get("battery_health"),
                            "notes": r.get("notes")}
            else:
                e["qty"] += r["qty"]                 # same colour listed on several rows
    return out

def _gen_upsert_sql(norm, dry_run=False):
    """Generate reconciling SQL — it applies the difference, it never rebuilds.

    With dry_run the statements all execute (so type errors, constraint violations
    and FK blocks surface for real) and the changes are then rolled back. The
    before/after report is produced inside the transaction, where the trigger has
    already recalculated stock_count and is_active.

    - NEVER creates models or variants. Every valid combination is pre-seeded by
      the `sync-new-products` skill, so a sheet row that matches nothing is a typo
      or a new phone — it is collected into _unmatched_variants / _unknown_models
      and reported, not invented. Brands are still added (a brand is just a label
      and carries no combination set).
    - Per (variant, colour), compares the sheet Quantity with the AVAILABLE unit
      count and only inserts the shortfall or deletes the surplus. Groups that
      already match are not touched at all, so their product UUIDs (and the
      product_views rows hanging off them) survive every import.
    - Anything the sheet no longer lists — a whole variant, or just one colour of
      it — loses its AVAILABLE units. recalculate_variant() then zeroes
      stock_count and sets is_active=false, which is what removes it from the
      public catalog. The variant row, its images and its sales history all stay.
    - Only status='available' rows are ever deleted: sold/reserved/out units are
      untouched. Units referenced by device_outs (returned or cancelled
      consignments come back as 'available') are held back too, because that FK
      is ON DELETE RESTRICT and would otherwise abort the whole transaction.
    """
    def q(s): return "NULL" if s is None else "'" + str(s).replace("'", "''") + "'"
    def n(x): return "NULL" if x is None else str(x)

    brands = sorted({v["brand"] for v in norm["variants"]})
    # (brand, GSMArena name, pre-GSMArena name) — the third is the fallback used to
    # recognise a model the DB already stores under its un-normalized name.
    mm = sorted({(v["brand"], v["model"], v.get("orig_model") or v["model"])
                 for v in norm["variants"]})
    vv = ",".join("(%s,%s,%s,%s,%s,%s)" % (q(v["brand"]), q(v["model"]), n(v["storage_gb"]),
                  q(v["pta_status"]), q(v["condition"]), n(v["selling_price"]))
                  for v in norm["variants"])
    uu = ",".join("(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)" % (
                  q(k[0]), q(k[1]), n(k[3]), q(k[4]), q(k[5]), q(k[6]),
                  n(u["ram_gb"]), n(u["cost_price"]), n(u["condition_rating"]),
                  n(u["battery_health"]), n(u["qty"]), q(u["notes"]))
                  for k, u in sheet_units(norm).items())

    L = ["BEGIN;", ""]

    # 0. Snapshot the visible state so the run can report what it actually changed
    L.append("-- 0. Snapshot the current catalog state (for the before/after report)")
    L.append("CREATE TEMP TABLE _before_v AS")
    L.append("SELECT id, is_active, stock_count, selling_price FROM variants;")
    L.append("")

    # 1. Upsert brands (skip if already present)
    L.append("-- 1. Upsert brands")
    L.append("INSERT INTO brands (name) SELECT v.name FROM (VALUES %s) AS v(name) "
             "WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.name=v.name);"
             % ",".join("(%s)" % q(b) for b in brands))
    L.append("")

    # 2. Resolve models. A model the DB already holds is NEVER renamed: GSMArena's
    #    lookup is flaky, so the same sheet can normalize "turbo 6" to "Turbo 6" on one
    #    run and not the next. Renaming would orphan the existing variants/images and
    #    duplicate the model, so an existing row always wins over the normalized name.
    L.append("-- 2. Resolve each sheet model to a DB model (existing name wins over a rename)")
    L.append("CREATE TEMP TABLE _sheet_models AS")
    L.append("SELECT sm.brand, sm.model, sm.orig_model, b.id AS brand_id,")
    L.append("       COALESCE(")
    L.append("         (SELECT m.id FROM models m WHERE m.brand_id=b.id AND m.name=sm.model),")
    L.append("         (SELECT m.id FROM models m WHERE m.brand_id=b.id AND m.name=sm.orig_model)")
    L.append("       ) AS model_id")
    L.append("FROM (VALUES %s) AS sm(brand,model,orig_model)"
             % ",".join("(%s,%s,%s)" % (q(b), q(m), q(o)) for b, m, o in mm))
    L.append("JOIN brands b ON b.name=sm.brand;")
    L.append("")
    L.append("-- 2b. Models the sheet names that the DB does not hold. NOT created — the")
    L.append("--     catalog is pre-seeded by sync-new-products, so an unknown model means a")
    L.append("--     sheet typo or a genuinely new phone. Collect it for the flagged report.")
    L.append("CREATE TEMP TABLE _unknown_models AS")
    L.append("SELECT brand, model, orig_model FROM _sheet_models WHERE model_id IS NULL;")
    L.append("")

    # 3. Sheet variants with no DB row are FLAGGED, never created. Anything left in
    #    _unmatched_variants is stock the sheet lists that this run will not import.
    L.append("-- 3. Sheet variants with no matching DB row. NOT created — flagged, so the")
    L.append("--    user can run /sync-new-products <phone> and re-run this sync.")
    L.append("CREATE TEMP TABLE _unmatched_variants AS")
    L.append("SELECT sv.brand, sv.model, sv.storage_gb::integer AS storage_gb,")
    L.append("       sv.pta, sv.cond, sv.sell::numeric AS sell")
    L.append("FROM (VALUES %s) AS sv(brand,model,storage_gb,pta,cond,sell)" % vv)
    L.append("LEFT JOIN _sheet_models sm ON sm.brand=sv.brand AND sm.model=sv.model")
    L.append("WHERE sm.model_id IS NULL OR NOT EXISTS (")
    L.append("  SELECT 1 FROM variants vr WHERE vr.model_id=sm.model_id")
    L.append("  AND vr.storage_gb IS NOT DISTINCT FROM sv.storage_gb::integer")
    L.append("  AND vr.pta_status=sv.pta AND vr.condition=sv.cond::product_condition);")
    L.append("")
    L.append("-- 3b. The units behind those flagged rows — this is the stock NOT being imported.")
    L.append("CREATE TEMP TABLE _unmatched_units AS")
    L.append("SELECT u.brand, u.model, u.storage_gb::integer AS storage_gb, u.pta, u.cond,")
    L.append("       u.color::text AS color, u.qty::integer AS qty")
    L.append("FROM (VALUES %s) AS u(brand,model,storage_gb,pta,cond,color,ram_gb,cost,rating,batt,qty,notes)" % uu)
    L.append("LEFT JOIN _sheet_models sm ON sm.brand=u.brand AND sm.model=u.model")
    L.append("WHERE sm.model_id IS NULL OR NOT EXISTS (")
    L.append("  SELECT 1 FROM variants vr WHERE vr.model_id=sm.model_id")
    L.append("  AND vr.storage_gb IS NOT DISTINCT FROM u.storage_gb::integer")
    L.append("  AND vr.pta_status=u.pta AND vr.condition=u.cond::product_condition);")
    L.append("")

    # 4. Resolve every sheet variant to its DB id
    L.append("-- 4. Resolve every sheet variant that DOES exist in the DB. Rows that matched")
    L.append("--    nothing are absent here by construction, so they are skipped everywhere below.")
    L.append("CREATE TEMP TABLE _sheet_variants AS")
    L.append("SELECT vr.id AS variant_id, sv.sell::numeric AS selling_price")
    L.append("FROM (VALUES %s) AS sv(brand,model,storage_gb,pta,cond,sell)" % vv)
    L.append("JOIN _sheet_models sm ON sm.brand=sv.brand AND sm.model=sv.model")
    L.append("JOIN variants vr ON vr.model_id=sm.model_id")
    L.append("  AND vr.storage_gb IS NOT DISTINCT FROM sv.storage_gb::integer")
    L.append("  AND vr.pta_status=sv.pta AND vr.condition=sv.cond::product_condition;")
    L.append("")
    L.append("-- Guard: an empty sheet must never be read as 'everything is gone'. Since this")
    L.append("-- sync no longer creates variants, 0 matches can ALSO mean the catalog was never")
    L.append("-- seeded for these phones — abort either way and say so.")
    L.append("DO $$ BEGIN")
    L.append("  IF (SELECT count(*) FROM _sheet_variants)=0 THEN")
    L.append("    RAISE EXCEPTION 'sheet resolved to 0 existing variants - aborting before it empties the catalog. "
             "Every sheet row was flagged as unmatched: seed the models first with /sync-new-products <phone>, then re-run.';")
    L.append("  END IF;")
    L.append("END $$;")
    L.append("")

    # 5. Price refresh (variant is the source of truth; products carry a copy)
    L.append("-- 5. Refresh selling_price from the sheet")
    L.append("UPDATE variants SET selling_price=sv.selling_price")
    L.append("FROM _sheet_variants sv")
    L.append("WHERE variants.id=sv.variant_id AND variants.selling_price IS DISTINCT FROM sv.selling_price;")
    L.append("")
    L.append("UPDATE products SET selling_price=sv.selling_price")
    L.append("FROM _sheet_variants sv")
    L.append("WHERE products.variant_id=sv.variant_id AND products.status='available'")
    L.append("  AND products.selling_price IS DISTINCT FROM sv.selling_price;")
    L.append("")

    # 6. Desired unit counts per (variant, colour)
    L.append("-- 6. Desired AVAILABLE unit count per (variant, colour)")
    L.append("CREATE TEMP TABLE _sheet_units AS")
    L.append("SELECT vr.id AS variant_id, u.color::text AS color, lower(u.color) AS lcolor,")
    L.append("       u.ram_gb::integer AS ram_gb, u.cost::numeric AS cost_price,")
    L.append("       u.rating::integer AS condition_rating, u.batt::integer AS battery_health,")
    L.append("       u.qty::integer AS qty, u.notes::text AS notes")
    L.append("FROM (VALUES %s) AS u(brand,model,storage_gb,pta,cond,color,ram_gb,cost,rating,batt,qty,notes)" % uu)
    L.append("JOIN _sheet_models sm ON sm.brand=u.brand AND sm.model=u.model")
    L.append("JOIN variants vr ON vr.model_id=sm.model_id")
    L.append("  AND vr.storage_gb IS NOT DISTINCT FROM u.storage_gb::integer")
    L.append("  AND vr.pta_status=u.pta AND vr.condition=u.cond::product_condition;")
    L.append("")

    # 7. Retire units the sheet no longer lists
    L.append("-- 7a. Variants dropped from the sheet: retire every available unit, so the")
    L.append("--     recalculate_variant trigger zeroes stock and un-publishes the variant.")
    L.append("DELETE FROM products p")
    L.append("WHERE p.status='available' AND p.variant_id IS NOT NULL")
    L.append("  AND NOT EXISTS (SELECT 1 FROM _sheet_variants sv WHERE sv.variant_id=p.variant_id)")
    L.append("  AND NOT EXISTS (SELECT 1 FROM device_outs d WHERE d.product_id=p.id)")
    L.append("  AND NOT EXISTS (SELECT 1 FROM sales s WHERE s.product_id=p.id);")
    L.append("")
    L.append("-- 7b. Sheet variants: trim each colour down to the sheet Quantity. A colour that")
    L.append("--     vanished from the sheet has a desired count of 0, so it goes entirely.")
    L.append("--     Units pinned by device_outs OR by a sales row sort first, so they are the")
    L.append("--     last to be cut. Both FKs are NO ACTION/RESTRICT: deleting a pinned unit")
    L.append("--     aborts the whole transaction, so they must never be chosen for deletion.")
    L.append("WITH cur AS (")
    L.append("  SELECT p.id, p.variant_id, lower(p.color) AS lcolor,")
    L.append("         (EXISTS (SELECT 1 FROM device_outs d WHERE d.product_id=p.id)")
    L.append("          OR EXISTS (SELECT 1 FROM sales s WHERE s.product_id=p.id)) AS pinned,")
    L.append("         row_number() OVER (")
    L.append("           PARTITION BY p.variant_id, lower(p.color)")
    L.append("           ORDER BY (EXISTS (SELECT 1 FROM device_outs d WHERE d.product_id=p.id)")
    L.append("                     OR EXISTS (SELECT 1 FROM sales s WHERE s.product_id=p.id)) DESC,")
    L.append("                    p.created_at ASC, p.id ASC) AS rn")
    L.append("  FROM products p")
    L.append("  JOIN _sheet_variants sv ON sv.variant_id=p.variant_id")
    L.append("  WHERE p.status='available'")
    L.append("), want AS (")
    L.append("  SELECT variant_id, lcolor, sum(qty)::integer AS qty FROM _sheet_units GROUP BY 1,2")
    L.append(")")
    L.append("DELETE FROM products WHERE id IN (")
    L.append("  SELECT c.id FROM cur c")
    L.append("  LEFT JOIN want w ON w.variant_id=c.variant_id AND w.lcolor=c.lcolor")
    L.append("  WHERE NOT c.pinned AND c.rn > COALESCE(w.qty,0));")
    L.append("")

    # 8. Top up the shortfall
    L.append("-- 8. Top up each (variant, colour) that is now short of the sheet Quantity")
    L.append("WITH cur AS (")
    L.append("  SELECT p.variant_id, lower(p.color) AS lcolor, count(*)::integer AS n")
    L.append("  FROM products p JOIN _sheet_variants sv ON sv.variant_id=p.variant_id")
    L.append("  WHERE p.status='available' GROUP BY 1,2")
    L.append(")")
    L.append("INSERT INTO products (brand_id,model,model_id,variant_id,storage_gb,ram_gb,color,condition,"
             "pta_status,cost_price,selling_price,condition_rating,battery_health,status,product_type,notes)")
    L.append("SELECT b.id,m.name,m.id,vr.id,vr.storage_gb,u.ram_gb,u.color,vr.condition,"
             "vr.pta_status::pta_status,")
    L.append("       u.cost_price,vr.selling_price,u.condition_rating,u.battery_health,'available','phone',u.notes")
    L.append("FROM _sheet_units u")
    L.append("JOIN variants vr ON vr.id=u.variant_id")
    L.append("JOIN models m ON m.id=vr.model_id")
    L.append("JOIN brands b ON b.id=m.brand_id")
    L.append("LEFT JOIN cur c ON c.variant_id=u.variant_id AND c.lcolor=u.lcolor")
    L.append("CROSS JOIN LATERAL generate_series(1,u.qty-COALESCE(c.n,0)) g")
    L.append("WHERE u.qty-COALESCE(c.n,0) > 0;")
    L.append("")

    # 9. Report — the trigger has already recalculated by now, so this is the real effect
    L.append("-- 9. Before/after report")
    L.append(r"\echo ''")
    L.append(r"\echo '=== FLAGGED — in the sheet, NOT in the DB, NOT synced ==='")
    L.append(r"\echo '--- unknown models (the DB has no such model at all) ---'")
    L.append("SELECT brand, model AS sheet_model, orig_model AS as_written_in_sheet")
    L.append("FROM _unknown_models ORDER BY brand, model;")
    L.append("")
    L.append(r"\echo '--- unmatched variant combinations (model exists, this combination does not) ---'")
    L.append("SELECT uv.brand||' '||uv.model||' '||coalesce(uv.storage_gb::text||'GB','?GB')")
    L.append("       ||' '||uv.cond||'/'||coalesce(uv.pta,'-') AS sheet_row,")
    L.append("       uv.sell AS sheet_price,")
    L.append("       coalesce((SELECT sum(uu.qty) FROM _unmatched_units uu")
    L.append("                 WHERE uu.brand=uv.brand AND uu.model=uv.model")
    L.append("                   AND uu.storage_gb IS NOT DISTINCT FROM uv.storage_gb")
    L.append("                   AND uu.pta IS NOT DISTINCT FROM uv.pta AND uu.cond=uv.cond),0) AS units_not_imported")
    L.append("FROM _unmatched_variants uv ORDER BY sheet_row;")
    L.append("")
    L.append(r"\echo '--- flagged totals ---'")
    L.append("SELECT (SELECT count(*) FROM _unknown_models)      AS unknown_models,")
    L.append("       (SELECT count(*) FROM _unmatched_variants)  AS unmatched_variants,")
    L.append("       (SELECT coalesce(sum(qty),0) FROM _unmatched_units) AS units_not_imported;")
    L.append("")
    L.append(r"\echo ''")
    L.append(r"\echo '=== WRITE PREVIEW — every stock change this run will apply ==='")
    L.append(r"\echo '--- stock per variant (delta, and whether it changes catalog visibility) ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       bv.stock_count AS stock_was, v.stock_count AS stock_now,")
    L.append("       (v.stock_count - bv.stock_count) AS delta,")
    L.append("       CASE WHEN NOT bv.is_active AND v.is_active     THEN 'ENTERS catalog'")
    L.append("            WHEN bv.is_active AND NOT v.is_active     THEN 'LEAVES catalog'")
    L.append("            ELSE '' END AS visibility")
    L.append("FROM variants v JOIN _before_v bv ON bv.id=v.id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE v.stock_count IS DISTINCT FROM bv.stock_count")
    L.append("ORDER BY abs(v.stock_count - bv.stock_count) DESC, variant;")
    L.append("")
    L.append(r"\echo '--- write summary (confirm these numbers before running --yes) ---'")
    L.append("SELECT count(*) FILTER (WHERE v.stock_count > bv.stock_count) AS variants_gaining,")
    L.append("       coalesce(sum(greatest(v.stock_count-bv.stock_count,0)),0) AS units_added,")
    L.append("       count(*) FILTER (WHERE v.stock_count < bv.stock_count) AS variants_losing,")
    L.append("       coalesce(sum(greatest(bv.stock_count-v.stock_count,0)),0) AS units_removed,")
    L.append("       (SELECT count(*) FROM variants x JOIN _before_v bx ON bx.id=x.id")
    L.append("         WHERE x.selling_price IS DISTINCT FROM bx.selling_price) AS price_changes,")
    L.append("       (SELECT coalesce(sum(qty),0) FROM _unmatched_units) AS units_skipped_flagged")
    L.append("FROM variants v JOIN _before_v bv ON bv.id=v.id;")
    L.append("")
    L.append(r"\echo ''")
    L.append(r"\echo '--- variants leaving the public catalog (stock -> 0, is_active -> false) ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       bv.stock_count AS stock_was, v.stock_count AS stock_now")
    L.append("FROM variants v JOIN _before_v bv ON bv.id=v.id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE bv.is_active AND NOT v.is_active ORDER BY variant;")
    L.append("")
    L.append(r"\echo '--- variants entering / returning to the catalog ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       coalesce(bv.stock_count,0) AS stock_was, v.stock_count AS stock_now")
    L.append("FROM variants v LEFT JOIN _before_v bv ON bv.id=v.id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE v.is_active AND NOT coalesce(bv.is_active,false) ORDER BY variant;")
    L.append("")
    L.append(r"\echo '--- stock count changes on variants that stay published ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       bv.stock_count AS stock_was, v.stock_count AS stock_now")
    L.append("FROM variants v JOIN _before_v bv ON bv.id=v.id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE v.is_active AND bv.is_active AND v.stock_count IS DISTINCT FROM bv.stock_count")
    L.append("ORDER BY variant;")
    L.append("")
    L.append(r"\echo '--- price changes ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       bv.selling_price AS price_was, v.selling_price AS price_now")
    L.append("FROM variants v JOIN _before_v bv ON bv.id=v.id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE v.selling_price IS DISTINCT FROM bv.selling_price ORDER BY variant;")
    L.append("")
    L.append(r"\echo '--- units the sheet does not list but that were KEPT (device_outs / sales pin them) ---'")
    L.append("SELECT b.name||' '||m.name||' '||coalesce(v.storage_gb::text||'GB','')"
             "||' '||v.condition||'/'||coalesce(v.pta_status,'-') AS variant,")
    L.append("       p.color, count(*) AS units,")
    L.append("       coalesce(string_agg(DISTINCT d.status,','),'sale') AS ledger")
    L.append("FROM products p")
    L.append("LEFT JOIN device_outs d ON d.product_id=p.id")
    L.append("JOIN variants v ON v.id=p.variant_id")
    L.append("JOIN models m ON m.id=v.model_id JOIN brands b ON b.id=m.brand_id")
    L.append("WHERE p.status='available'")
    L.append("  AND (d.id IS NOT NULL OR EXISTS (SELECT 1 FROM sales s WHERE s.product_id=p.id))")
    L.append("  AND NOT EXISTS (")
    L.append("  SELECT 1 FROM _sheet_units u")
    L.append("  WHERE u.variant_id=p.variant_id AND u.lcolor=lower(p.color))")
    L.append("GROUP BY 1,2 ORDER BY 1,2;")
    L.append("")
    L.append(r"\echo '--- totals ---'")
    L.append("SELECT (SELECT count(*) FROM _before_v WHERE is_active) AS published_was,")
    L.append("       (SELECT count(*) FROM variants WHERE is_active) AS published_now,")
    L.append("       (SELECT sum(stock_count) FROM _before_v) AS units_was,")
    L.append("       (SELECT sum(stock_count) FROM variants) AS units_now,")
    L.append("       (SELECT count(*) FROM variants) AS variants_total,")
    L.append("       (SELECT count(*) FROM products WHERE status<>'available') AS non_available_kept;")
    L.append("")

    L.append("DROP TABLE _sheet_units;")
    L.append("DROP TABLE _sheet_variants;")
    L.append("DROP TABLE _sheet_models;")
    L.append("DROP TABLE _unmatched_units;")
    L.append("DROP TABLE _unmatched_variants;")
    L.append("DROP TABLE _unknown_models;")
    L.append("DROP TABLE _before_v;")
    L.append("")
    if dry_run:
        L.append(r"\echo ''")
        L.append(r"\echo '=== DRY RUN — rolling back, nothing was written ==='")
        L.append("ROLLBACK;")
    else:
        L.append("COMMIT;")
    return "\n".join(L)

def cmd_load(yes, dry_run=False):
    path = os.path.join(WORK, "dataset_norm.json")
    if not os.path.exists(path):
        print("ERROR: run `prepare` first.", file=sys.stderr); sys.exit(2)
    if not (yes or dry_run):
        print("REFUSING: pass --yes to confirm the load (or --dry-run to preview it).",
              file=sys.stderr); sys.exit(2)
    norm = json.load(open(path))

    if dry_run:
        sql_path = os.path.join(WORK, "load_dryrun.sql")
        open(sql_path, "w").write(_gen_upsert_sql(norm, dry_run=True))
        units = sum(r["qty"] for v in norm["variants"] for r in v["rows"])
        print(f"DRY RUN — executing the full sync, then rolling it back. "
              f"Sheet has {len(norm['variants'])} variants / {units} units.")
        print(f"SQL: {sql_path}\n")
        print(psql_file(sql_path))
        after = psql("SELECT count(*) FROM products WHERE status='available'")[0][0]
        print(f"Confirmed rolled back: available units still {after}.")
        return

    sql_path = os.path.join(WORK, "load.sql")
    open(sql_path, "w").write(_gen_upsert_sql(norm))
    before = psql("SELECT count(*) FROM products WHERE status='available'")[0][0]
    print("Syncing (stock-only mode): updating stock and price on variants that already "
          "exist, trimming what's gone, leaving matching stock untouched. "
          "No model or variant is created — unmatched sheet rows are flagged.")
    print(psql_file(sql_path))
    db = db_counts()
    units = sum(r["qty"] for v in norm["variants"] for r in v["rows"])
    after = psql("SELECT count(*) FROM products WHERE status='available'")[0][0]
    inactive = psql("SELECT count(*) FROM variants WHERE NOT is_active")[0][0]
    print(f"Done. DB now: models={db['models']} variants={db['variants']} "
          f"(+{inactive} inactive, hidden from the catalog) products={db['products']} "
          f"orphans={db['orphans']}")
    print(f"Available units: {before} -> {after}   (sheet says {units})")
    print(f"Expected: variants={len(norm['variants'])} units={units}")
    if after != units:
        print(f"NOTE: {units - after} sheet unit(s) did not land. With stock-only sync this is "
              f"normally the FLAGGED rows above — variants the DB does not have. Seed them with "
              f"/sync-new-products <phone> and re-run to import their stock.")
    noslug = psql("SELECT count(*) FROM variants WHERE slug IS NULL")[0][0]
    print(f"Variants without slug: {noslug} (should be 0)")

# ------------------------------------------------------------------------------- main
def main():
    args = sys.argv[1:]
    cmd = args[0] if args else "overview"
    if cmd == "overview": cmd_overview()
    elif cmd == "prepare": cmd_prepare()
    elif cmd == "compare": cmd_compare()
    elif cmd == "load": cmd_load("--yes" in args, "--dry-run" in args)
    else:
        print(__doc__); sys.exit(1)

if __name__ == "__main__":
    main()
