-- FTS үлгісі (қолмен қолдану / cutover кейін тест): құжат `docs/MIGRATION_SQLITE_TO_POSTGRES.md` §14.7
-- Құран/хадис мәтіні үшін тілдік конфиг (arabic / simple) бөлек таңдалады.

-- CREATE EXTENSION IF NOT EXISTS unaccent;  -- қажет болса

-- Мысал: хадис text_kk үшін tsvector баған (идемпотент емес — алдымен бағаны қосыңыз):
-- ALTER TABLE hadith ADD COLUMN IF NOT EXISTS text_kk_tsv tsvector;
-- UPDATE hadith SET text_kk_tsv = to_tsvector('simple', coalesce(text_kk, ''));
-- CREATE INDEX IF NOT EXISTS idx_hadith_text_kk_tsv ON hadith USING GIN (text_kk_tsv);

-- Іздеу мысалы:
-- SELECT id FROM hadith WHERE text_kk_tsv @@ plainto_tsquery('simple', 'ниет');
