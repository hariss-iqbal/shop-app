-- =============================================================================
-- Smart Cell stock import — DESTRUCTIVE wipe & replace  (CURRENT / authoritative)
-- Generated: 2026-05-23  from ~/Downloads/Smart Cell Stock.xlsx (48 rows)
-- Supersedes smartcell-stock-2026-05-23.sql (that snapshot is now stale).
-- This is the exact data operation run against the LOCAL db, frozen for prod.
--
-- WHAT IT DOES
--   1. Deletes ALL products, variants, models (brands & suppliers are kept).
--   2. Loads 28 variants / 58 units (19 models) from the sheet.
--   Triggers fill slug, stock_count, available_colors, avg_cost_price, is_active.
--
-- WHAT CHANGED vs the previous import
--   * Most stock condition flipped new -> used.
--   * Pixel 8 Pro 128GB (pta): 4 -> 6 units (Obsidian x4, Porcelain x1, Bay x1).
--   * New variant: Pixel 8 Pro 256GB (pta, used, Bay) x1 @ 130000.
--   * Net: 27->28 variants, 55->58 units.
--
-- NORMALIZATION DECISIONS BAKED IN (unchanged from prior import)
--   * PTA:  "pta" -> pta_approved ;  "non pta" -> non_pta ;
--           "online approved" -> non_pta (owner's choice).
--   * Condition:  blank -> new ;  "Box" -> open_box ;  "Sealed Box" -> new ;  "used" -> used.
--   * Colors normalized via GSMArena, with overrides:
--           Pixel 6 / 6 Pro "Obsidian" -> "Stormy Black" ; iPhone 13 -> "Blue".
--           OnePlus 13T "Indigo" kept as-is (not in GSMArena's list).
--   * Pixel Buds (4 units) SKIPPED — accessories, not phones.
--   * No Cost Price column in this sheet -> cost_price = 0 for all units.
--   * 2 price-conflict groups SKIPPED (one selling price per variant):
--           Pixel 9 128GB used/non_pta (115k vs 125k), Pixel 8 128GB used/pta (78k vs 85k).
--
-- HOW TO DEPLOY TO PROD (manually, surgically — never `supabase db push`)
--   psql "$PROD_SESSION_POOLER_URL" -v ON_ERROR_STOP=1 \
--        -f backend/data-imports/smart-cell-stock-2026-05-23-v2.sql
--   The whole thing is one transaction: it either fully applies or rolls back.
--
-- TO REGENERATE: run the stock-import skill (overview -> prepare -> load),
--   then combine the wipe below with $STOCK_WORK/load.sql.
-- =============================================================================
BEGIN;

-- 1) Wipe (FK order: products -> variants -> models). Brands/suppliers preserved.
DELETE FROM products;
DELETE FROM variants;
DELETE FROM models;

-- 2) Brands (only insert any that don't already exist)
INSERT INTO brands (name) SELECT v.name FROM (VALUES ('Apple'),('Google'),('Nothing'),('OnePlus')) AS v(name) WHERE NOT EXISTS (SELECT 1 FROM brands b WHERE b.name=v.name);

-- 3) Models
INSERT INTO models (brand_id,name) SELECT b.id,v.name FROM (VALUES ('Apple','iPhone 13'),('Google','Pixel 10'),('Google','Pixel 10 Pro'),('Google','Pixel 10 Pro XL'),('Google','Pixel 10a'),('Google','Pixel 6'),('Google','Pixel 6 Pro'),('Google','Pixel 6a'),('Google','Pixel 7'),('Google','Pixel 7 Pro'),('Google','Pixel 7a'),('Google','Pixel 8'),('Google','Pixel 8 Pro'),('Google','Pixel 9'),('Google','Pixel 9 Pro'),('Google','Pixel 9 Pro XL'),('Google','Pixel 9a'),('Nothing','Phone (1)'),('OnePlus','13T')) AS v(brand,name) JOIN brands b ON b.name=v.brand;

-- 4) Variants (slug auto-filled by trg_variants_auto_slug)
INSERT INTO variants (model_id,storage_gb,pta_status,condition,selling_price,is_active) SELECT m.id,v.storage_gb::integer,v.pta,v.cond::product_condition,v.sell::numeric,false FROM (VALUES ('Google','Pixel 10 Pro XL',256,'non_pta','used',235000.0),('Google','Pixel 9 Pro XL',256,'pta_approved','used',210000.0),('Google','Pixel 9 Pro XL',512,'pta_approved','used',225000.0),('Google','Pixel 9 Pro XL',256,'non_pta','open_box',170000.0),('Google','Pixel 9 Pro XL',128,'non_pta','open_box',165000.0),('Google','Pixel 9 Pro',256,'non_pta','open_box',170000.0),('Google','Pixel 9 Pro',128,'non_pta','used',155000.0),('Google','Pixel 9a',128,'non_pta','open_box',115000.0),('Google','Pixel 10 Pro',256,'non_pta','used',245000.0),('Google','Pixel 10 Pro',128,'non_pta','open_box',235000.0),('Google','Pixel 10',128,'non_pta','new',190000.0),('Google','Pixel 10a',128,'non_pta','new',155000.0),('Google','Pixel 8 Pro',128,'pta_approved','used',123000.0),('Google','Pixel 8',256,'non_pta','used',80000.0),('Google','Pixel 7 Pro',128,'pta_approved','used',90000.0),('Google','Pixel 7 Pro',256,'pta_approved','used',103000.0),('Google','Pixel 7',128,'pta_approved','used',68000.0),('Google','Pixel 7a',128,'pta_approved','used',59000.0),('Google','Pixel 6 Pro',256,'pta_approved','used',78000.0),('Google','Pixel 6 Pro',512,'pta_approved','used',85000.0),('Google','Pixel 6',256,'pta_approved','used',60000.0),('Google','Pixel 6',128,'pta_approved','used',55000.0),('Google','Pixel 6a',128,'pta_approved','used',45000.0),('OnePlus','13T',512,'non_pta','used',150000.0),('Nothing','Phone (1)',128,'non_pta','used',60000.0),('Google','Pixel 9',128,'pta_approved','open_box',165000.0),('Apple','iPhone 13',128,'non_pta','new',83000.0),('Google','Pixel 8 Pro',256,'pta_approved','used',130000.0)) AS v(brand,model,storage_gb,pta,cond,sell) JOIN brands b ON b.name=v.brand JOIN models m ON m.brand_id=b.id AND m.name=v.model;

-- 5) Products (one row per unit; vr.selling_price copied from the variant)
INSERT INTO products (brand_id,model,model_id,variant_id,storage_gb,ram_gb,color,condition,pta_status,cost_price,selling_price,condition_rating,battery_health,status,product_type,notes) SELECT b.id,m.name,m.id,vr.id,r.storage_gb::integer,r.ram_gb::integer,r.color,r.cond::product_condition,r.pta::pta_status,r.cost::numeric,vr.selling_price,r.rating::integer,r.batt::integer,'available','phone',r.notes FROM (VALUES ('Google','Pixel 10 Pro XL',256,'non_pta','used','Moonstone',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 10 Pro XL',256,'non_pta','used','Jade',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9 Pro XL',256,'pta_approved','used','Hazel',16,0.0,NULL,NULL,2,NULL),('Google','Pixel 9 Pro XL',512,'pta_approved','used','Obsidian',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9 Pro XL',512,'pta_approved','used','Hazel',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9 Pro XL',256,'non_pta','open_box','Obsidian',16,0.0,NULL,NULL,2,NULL),('Google','Pixel 9 Pro XL',128,'non_pta','open_box','Porcelain',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9 Pro',256,'non_pta','open_box','Obsidian',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9 Pro',128,'non_pta','used','Obsidian',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 9a',128,'non_pta','open_box','Peony',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 10 Pro',256,'non_pta','used','Obsidian',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 10 Pro',128,'non_pta','open_box','Moonstone',16,0.0,NULL,NULL,1,NULL),('Google','Pixel 10',128,'non_pta','new','Obsidian',12,0.0,NULL,NULL,2,NULL),('Google','Pixel 10',128,'non_pta','new','Indigo',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 10a',128,'non_pta','new','Obsidian',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 8 Pro',128,'pta_approved','used','Obsidian',12,0.0,NULL,NULL,4,NULL),('Google','Pixel 8 Pro',128,'pta_approved','used','Porcelain',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 8 Pro',128,'pta_approved','used','Bay',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 8',256,'non_pta','used','Hazel',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 7 Pro',128,'pta_approved','used','Hazel',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 7 Pro',256,'pta_approved','used','Hazel',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 7',128,'pta_approved','used','Lemongrass',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 7',128,'pta_approved','used','Obsidian',8,0.0,NULL,NULL,5,NULL),('Google','Pixel 7a',128,'pta_approved','used','Snow',8,0.0,NULL,NULL,4,NULL),('Google','Pixel 7a',128,'pta_approved','used','Sea',8,0.0,NULL,NULL,5,NULL),('Google','Pixel 6 Pro',256,'pta_approved','used','Stormy Black',12,0.0,NULL,NULL,2,NULL),('Google','Pixel 6 Pro',512,'pta_approved','used','Stormy Black',12,0.0,NULL,NULL,1,NULL),('Google','Pixel 6',256,'pta_approved','used','Stormy Black',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 6',256,'pta_approved','used','Stormy Black',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 6',128,'pta_approved','used','Sorta Seafoam',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 6a',128,'pta_approved','used','Chalk',6,0.0,NULL,NULL,1,NULL),('Google','Pixel 6a',128,'pta_approved','used','Sage',6,0.0,NULL,NULL,2,NULL),('OnePlus','13T',512,'non_pta','used','Indigo',16,0.0,NULL,NULL,1,NULL),('Nothing','Phone (1)',128,'non_pta','used','Black',8,0.0,NULL,NULL,1,NULL),('Google','Pixel 9',128,'pta_approved','open_box','Porcelain',12,0.0,NULL,NULL,2,NULL),('Google','Pixel 9',128,'pta_approved','open_box','Obsidian',12,0.0,NULL,NULL,1,NULL),('Apple','iPhone 13',128,'non_pta','new','Blue',4,0.0,NULL,NULL,1,NULL),('Google','Pixel 8 Pro',256,'pta_approved','used','Bay',12,0.0,NULL,NULL,1,NULL)) AS r(brand,model,storage_gb,pta,cond,color,ram_gb,cost,rating,batt,qty,notes) JOIN brands b ON b.name=r.brand JOIN models m ON m.brand_id=b.id AND m.name=r.model JOIN variants vr ON vr.model_id=m.id AND vr.storage_gb IS NOT DISTINCT FROM r.storage_gb::integer AND vr.pta_status=r.pta AND vr.condition=r.cond::product_condition CROSS JOIN LATERAL generate_series(1,r.qty::integer) g;

COMMIT;

-- Sanity (expected: models=19, variants=28, products=58, orphans=0):
-- SELECT (SELECT count(*) FROM models), (SELECT count(*) FROM variants),
--        (SELECT count(*) FROM products), (SELECT count(*) FROM products WHERE variant_id IS NULL);
