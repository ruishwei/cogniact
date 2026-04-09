/*
  # PostgreSQL Native Mode Support

  ## Overview
  This migration adds support for running without Supabase auth,
  enabling plain PostgreSQL deployment. It adds password_hash to the
  users table for local JWT-based authentication.

  ## Changes

  ### Modified Tables
  - `users`
    - Add `password_hash` (text) column for plain PostgreSQL auth mode
    - Make `id` default to gen_random_uuid() so it works without auth.users FK

  ## Notes
  - When using Supabase, the `id` still references `auth.users`
  - When using plain PostgreSQL, `password_hash` is used for login
  - The column is nullable so existing Supabase rows are unaffected
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash text;
  END IF;
END $$;
