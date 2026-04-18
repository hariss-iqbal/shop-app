#!/bin/bash
# Populate models table from GSM Arena API
# Prerequisites: local Supabase running, API server at localhost:3001

DB="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
API="http://localhost:3001/api/products/fetch-specs"

echo "=== Populating models from GSM Arena ==="
echo ""

# Get distinct brand_id, model, brand_name from products
psql "$DB" -t -A -F '|' -c "
  SELECT DISTINCT p.brand_id, p.model, b.name
  FROM products p JOIN brands b ON p.brand_id = b.id
  ORDER BY b.name, p.model
" | while IFS='|' read -r brand_id model brand_name; do
  [ -z "$brand_id" ] && continue

  # Clean model name: strip common suffixes for API lookup
  clean=$(echo "$model" | sed -E '
    s/ Official PTA$//i;
    s/ Official$//i;
    s/ Non-PTA$//i;
    s/ Simple CPID$//i;
    s/ CPID$//i;
    s/ Box Pack$//i;
    s/ 128gb\/256gb$//i;
    s/ 128GB$//i;
    s/ 256GB$//i;
    s/ PTA$//i;
  ')

  echo -n "[$brand_name] \"$model\" → "

  # Call GSM Arena API
  result=$(curl -s -X POST "$API" \
    -H "Content-Type: application/json" \
    -d "{\"brand\": \"$brand_name\", \"model\": \"$clean\"}" 2>/dev/null)

  canonical=$(echo "$result" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    if d.get('success') and d.get('data', {}).get('modelName'):
        print(d['data']['modelName'])
except: pass
" 2>/dev/null)

  if [ -n "$canonical" ]; then
    final_name="$canonical"
    echo "GSM: \"$final_name\""
  else
    final_name="$clean"
    echo "Fallback: \"$final_name\""
  fi

  # Insert into models + update products
  model_id=$(psql "$DB" -t -A -c "
    INSERT INTO models (brand_id, name) VALUES ('$brand_id', '$(echo "$final_name" | sed "s/'/''/g")')
    ON CONFLICT (brand_id, name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  ")

  updated=$(psql "$DB" -t -A -c "
    UPDATE products SET model_id = '$model_id'
    WHERE brand_id = '$brand_id' AND model = '$(echo "$model" | sed "s/'/''/g")';
    SELECT count(*) FROM products WHERE model_id = '$model_id';
  " | tail -1)

  echo "  → model_id=${model_id:0:8}... ($updated products)"
  echo ""

  # Rate limit
  sleep 2.5
done

echo ""
echo "=== Results ==="
psql "$DB" -c "SELECT count(*) as total_models FROM models;"
psql "$DB" -c "SELECT count(*) as products_with_model FROM products WHERE model_id IS NOT NULL;"
psql "$DB" -c "SELECT count(*) as products_without_model FROM products WHERE model_id IS NULL;"
psql "$DB" -c "SELECT m.name, b.name as brand, count(p.id) as units FROM models m JOIN brands b ON m.brand_id = b.id LEFT JOIN products p ON p.model_id = m.id GROUP BY m.id, m.name, b.name ORDER BY b.name, m.name;"
