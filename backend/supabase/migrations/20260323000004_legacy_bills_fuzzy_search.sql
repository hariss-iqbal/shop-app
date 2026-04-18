-- Migration: Fuzzy search RPC for legacy_bills
-- Uses pg_trgm word_similarity for multi-word fuzzy matching across all text fields.

CREATE OR REPLACE FUNCTION search_legacy_bills(
  p_search TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  row_num INTEGER,
  bill_num INTEGER,
  bill_date DATE,
  customer_name VARCHAR(200),
  phone VARCHAR(30),
  phone_missing BOOLEAN,
  customer_id UUID,
  brand VARCHAR(50),
  primary_product VARCHAR(200),
  all_products TEXT,
  qty INTEGER,
  amount INTEGER,
  storage VARCHAR(20),
  imei VARCHAR(50),
  condition_notes TEXT,
  raw_details TEXT,
  severity VARCHAR(10),
  doubt_reasons TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  relevance REAL,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search TEXT;
BEGIN
  -- Lower threshold for more relaxed fuzzy matching (default 0.6)
  PERFORM set_config('pg_trgm.word_similarity_threshold', '0.3', true);

  IF p_search IS NULL OR TRIM(p_search) = '' THEN
    -- No search — return all ordered by date
    RETURN QUERY
    SELECT
      lb.*,
      1.0::REAL AS relevance,
      COUNT(*) OVER() AS total_count
    FROM legacy_bills lb
    ORDER BY lb.bill_date DESC, lb.bill_num DESC
    LIMIT p_limit OFFSET p_offset;
  ELSE
    v_search := TRIM(p_search);

    -- Combine all searchable text into one field per row,
    -- then use word_similarity for fuzzy matching.
    -- word_similarity handles "Faisal Mobile" matching "Faisal G 05 Venus Mobile"
    -- because it checks if the query words appear as subsequences.
    RETURN QUERY
    SELECT
      lb.*,
      GREATEST(
        word_similarity(v_search, COALESCE(lb.customer_name, '')),
        word_similarity(v_search, COALESCE(lb.phone, '')),
        word_similarity(v_search, COALESCE(lb.brand, '')),
        word_similarity(v_search, COALESCE(lb.primary_product, '')),
        word_similarity(v_search, COALESCE(lb.all_products, '')),
        word_similarity(v_search, COALESCE(lb.imei, '')),
        word_similarity(v_search, COALESCE(lb.condition_notes, '')),
        word_similarity(v_search, COALESCE(lb.raw_details, '')),
        CASE WHEN lb.bill_num::TEXT = v_search THEN 1.0 ELSE 0.0 END
      )::REAL AS relevance,
      COUNT(*) OVER() AS total_count
    FROM legacy_bills lb
    WHERE
      v_search <% lb.customer_name OR
      v_search <% lb.phone OR
      v_search <% lb.brand OR
      v_search <% lb.primary_product OR
      v_search <% lb.all_products OR
      v_search <% lb.imei OR
      v_search <% lb.condition_notes OR
      v_search <% lb.raw_details OR
      lb.bill_num::TEXT = v_search
    ORDER BY relevance DESC, lb.bill_date DESC
    LIMIT p_limit OFFSET p_offset;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION search_legacy_bills(TEXT, INTEGER, INTEGER) TO authenticated;
