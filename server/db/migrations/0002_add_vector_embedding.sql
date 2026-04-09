-- Add vector embedding column to knowledge_base if the vector extension is available

DO $$ BEGIN
  ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(1536);
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'vector type not available, skipping embedding column';
END $$;
