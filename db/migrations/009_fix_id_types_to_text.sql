-- Migration: 009_fix_id_types_to_text.sql
-- Created: 2026-04-15
-- Purpose: Convert SERIAL/INTEGER id columns to TEXT to support UUID-based identifiers
--
-- Context: Routes generate UUIDs via uuid() for all IDs, but the original schema used
-- SERIAL (auto-increment integers). This migration aligns the DB schema with the code.
-- On the live server, authors.id was already altered to TEXT; this migration fixes
-- xassidas.author_id (still INTEGER) and hardens the verses/translations/favorites FKs.

-- ─── 1. Drop foreign key constraints ─────────────────────────────────────────

ALTER TABLE xassidas      DROP CONSTRAINT IF EXISTS xassidas_author_id_fkey;
ALTER TABLE xassidas      DROP CONSTRAINT IF EXISTS xassidas_author_id_fkey1;

ALTER TABLE verses        DROP CONSTRAINT IF EXISTS verses_xassida_id_fkey;
ALTER TABLE translations  DROP CONSTRAINT IF EXISTS translations_xassida_id_fkey;
ALTER TABLE favorites     DROP CONSTRAINT IF EXISTS favorites_xassida_id_fkey;

-- ─── 2. Convert xassidas columns ─────────────────────────────────────────────

-- id: SERIAL → TEXT (only if not already TEXT)
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'xassidas' AND column_name = 'id') = 'integer' THEN
    ALTER TABLE xassidas DROP CONSTRAINT IF EXISTS xassidas_pkey;
    ALTER TABLE xassidas ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE xassidas ADD PRIMARY KEY (id);
  END IF;
END $$;

-- author_id: INTEGER → TEXT
DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'xassidas' AND column_name = 'author_id') = 'integer' THEN
    ALTER TABLE xassidas ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;
  END IF;
END $$;

-- ─── 3. Convert verses columns ────────────────────────────────────────────────

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'verses' AND column_name = 'id') = 'integer' THEN
    ALTER TABLE verses DROP CONSTRAINT IF EXISTS verses_pkey;
    ALTER TABLE verses ALTER COLUMN id TYPE TEXT USING id::TEXT;
    ALTER TABLE verses ADD PRIMARY KEY (id);
  END IF;
END $$;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'verses' AND column_name = 'xassida_id') = 'integer' THEN
    ALTER TABLE verses ALTER COLUMN xassida_id TYPE TEXT USING xassida_id::TEXT;
  END IF;
END $$;

-- ─── 4. Convert translations columns ─────────────────────────────────────────

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'translations' AND column_name = 'xassida_id') = 'integer' THEN
    ALTER TABLE translations ALTER COLUMN xassida_id TYPE TEXT USING xassida_id::TEXT;
  END IF;
END $$;

-- ─── 5. Convert favorites columns ────────────────────────────────────────────

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'favorites' AND column_name = 'xassida_id') = 'integer' THEN
    ALTER TABLE favorites ALTER COLUMN xassida_id TYPE TEXT USING xassida_id::TEXT;
  END IF;
END $$;

-- ─── 6. Re-add foreign key constraints ───────────────────────────────────────

ALTER TABLE xassidas ADD CONSTRAINT xassidas_author_id_fkey
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE;

ALTER TABLE verses ADD CONSTRAINT verses_xassida_id_fkey
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE;

ALTER TABLE translations ADD CONSTRAINT translations_xassida_id_fkey
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE;

ALTER TABLE favorites ADD CONSTRAINT favorites_xassida_id_fkey
  FOREIGN KEY (xassida_id) REFERENCES xassidas(id) ON DELETE CASCADE;
