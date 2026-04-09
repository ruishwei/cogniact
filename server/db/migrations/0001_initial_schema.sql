-- Initial schema: core tables for Cloud Agent Browser System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION WHEN others THEN
  RAISE NOTICE 'vector extension not available, skipping';
END $$;

CREATE TABLE IF NOT EXISTS users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        UNIQUE NOT NULL,
  password_hash text,
  full_name     text,
  avatar_url    text,
  preferences   jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agents (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  description    text,
  model_provider text        DEFAULT 'openai',
  model_name     text        DEFAULT 'gpt-4-turbo-preview',
  system_prompt  text,
  capabilities   jsonb       DEFAULT '[]',
  status         text        DEFAULT 'active',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS browser_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id          uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url              text,
  title            text,
  status           text        DEFAULT 'active',
  viewport         jsonb       DEFAULT '{"width":1920,"height":1080}',
  cookies          jsonb       DEFAULT '[]',
  local_storage    jsonb       DEFAULT '{}',
  screenshot_url   text,
  created_at       timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  closed_at        timestamptz
);

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id   uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  title      text,
  status     text        DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            text        NOT NULL,
  content         text        NOT NULL,
  content_type    text        DEFAULT 'text',
  metadata        jsonb       DEFAULT '{}',
  attachments     jsonb       DEFAULT '[]',
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        UNIQUE NOT NULL,
  description text,
  category    text,
  author_id   uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public   boolean     DEFAULT false,
  code        text        NOT NULL,
  schema      jsonb       DEFAULT '{}',
  version     text        DEFAULT '1.0.0',
  usage_count integer     DEFAULT 0,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agent_skills (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_id      uuid        NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  enabled       boolean     DEFAULT true,
  configuration jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  UNIQUE (agent_id, skill_id)
);

CREATE TABLE IF NOT EXISTS knowledge_base (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    uuid        REFERENCES agents(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  content     text        NOT NULL,
  source_type text        DEFAULT 'manual',
  source_url  text,
  metadata    jsonb       DEFAULT '{}',
  tags        text[]      DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_id      uuid        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text,
  schedule      text        NOT NULL,
  task_type     text        NOT NULL,
  configuration jsonb       DEFAULT '{}',
  enabled       boolean     DEFAULT true,
  last_run_at   timestamptz,
  next_run_at   timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_executions (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      uuid        NOT NULL REFERENCES scheduled_tasks(id) ON DELETE CASCADE,
  status       text        DEFAULT 'running',
  started_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  result       jsonb       DEFAULT '{}',
  error        text,
  logs         text
);

CREATE TABLE IF NOT EXISTS file_storage (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename   text        NOT NULL,
  file_path  text        NOT NULL,
  file_type  text,
  file_size  bigint,
  metadata   jsonb       DEFAULT '{}',
  source     text        DEFAULT 'upload',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agents_user_id             ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_agent_id  ON browser_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id   ON browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id      ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id     ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id   ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at        ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_skills_slug                ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_is_public           ON skills(is_public);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id      ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent_id    ON knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id     ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id    ON scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run   ON scheduled_tasks(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_file_storage_user_id       ON file_storage(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content     ON knowledge_base USING gin(to_tsvector('english', content));
