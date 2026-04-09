-- System configuration table for storing runtime settings (e.g. auto-generated JWT secret)
CREATE TABLE IF NOT EXISTS system_config (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  created_at timestamptz DEFAULT now()
);
