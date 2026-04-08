/*
  # Cloud Agent Browser System - Core Tables

  ## Overview
  This migration creates the foundational database schema for a multi-user cloud agent browser system
  that supports intelligent automation, browser session management, and extensible skills.

  ## New Tables

  ### 1. users
  Extended user profile table for application-specific user data
  - `id` (uuid, primary key) - Links to auth.users
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `preferences` (jsonb) - User preferences and settings
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. agents
  Intelligent agents that users can interact with
  - `id` (uuid, primary key) - Unique agent identifier
  - `user_id` (uuid, foreign key) - Owner of the agent
  - `name` (text) - Agent name
  - `description` (text) - Agent description
  - `model_provider` (text) - AI model provider (openai, anthropic, etc.)
  - `model_name` (text) - Specific model name
  - `system_prompt` (text) - Agent's system instructions
  - `capabilities` (jsonb) - Array of enabled capabilities
  - `status` (text) - Agent status (active, inactive, error)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. browser_sessions
  Virtual browser sessions for agent automation
  - `id` (uuid, primary key) - Session identifier
  - `agent_id` (uuid, foreign key) - Associated agent
  - `user_id` (uuid, foreign key) - Session owner
  - `url` (text) - Current URL
  - `title` (text) - Page title
  - `status` (text) - Session status (active, idle, closed)
  - `viewport` (jsonb) - Browser viewport configuration
  - `cookies` (jsonb) - Stored cookies
  - `local_storage` (jsonb) - Local storage data
  - `screenshot_url` (text) - Latest screenshot URL
  - `created_at` (timestamptz) - Session start time
  - `last_activity_at` (timestamptz) - Last activity timestamp
  - `closed_at` (timestamptz) - Session end time

  ### 4. conversations
  Chat conversations between users and agents
  - `id` (uuid, primary key) - Conversation identifier
  - `user_id` (uuid, foreign key) - User participating
  - `agent_id` (uuid, foreign key) - Agent participating
  - `title` (text) - Conversation title
  - `status` (text) - Conversation status (active, archived)
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last message timestamp

  ### 5. messages
  Individual messages in conversations
  - `id` (uuid, primary key) - Message identifier
  - `conversation_id` (uuid, foreign key) - Parent conversation
  - `role` (text) - Message role (user, assistant, system)
  - `content` (text) - Message text content
  - `content_type` (text) - Content type (text, image, audio, file)
  - `metadata` (jsonb) - Additional message metadata
  - `attachments` (jsonb) - File attachments
  - `created_at` (timestamptz) - Message timestamp

  ### 6. skills
  Extensible skills that agents can use
  - `id` (uuid, primary key) - Skill identifier
  - `name` (text) - Skill name
  - `slug` (text, unique) - URL-safe identifier
  - `description` (text) - Skill description
  - `category` (text) - Skill category
  - `author_id` (uuid, foreign key) - Skill creator
  - `is_public` (boolean) - Public availability
  - `code` (text) - Skill implementation code
  - `schema` (jsonb) - Input/output schema
  - `version` (text) - Skill version
  - `usage_count` (integer) - Times used
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. agent_skills
  Many-to-many relationship between agents and skills
  - `id` (uuid, primary key) - Relationship identifier
  - `agent_id` (uuid, foreign key) - Agent
  - `skill_id` (uuid, foreign key) - Skill
  - `enabled` (boolean) - Whether skill is active
  - `configuration` (jsonb) - Skill-specific config
  - `created_at` (timestamptz) - Assignment timestamp

  ### 8. knowledge_base
  Learned knowledge and documentation for agents
  - `id` (uuid, primary key) - Knowledge entry identifier
  - `agent_id` (uuid, foreign key) - Associated agent
  - `user_id` (uuid, foreign key) - Owner
  - `title` (text) - Knowledge title
  - `content` (text) - Knowledge content
  - `source_type` (text) - Source type (manual, learned, documentation)
  - `source_url` (text) - Original source URL
  - `metadata` (jsonb) - Additional metadata
  - `embedding` (vector(1536)) - Text embedding for semantic search
  - `tags` (text[]) - Searchable tags
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 9. scheduled_tasks
  Automated recurring tasks
  - `id` (uuid, primary key) - Task identifier
  - `user_id` (uuid, foreign key) - Task owner
  - `agent_id` (uuid, foreign key) - Agent to execute task
  - `name` (text) - Task name
  - `description` (text) - Task description
  - `schedule` (text) - Cron expression
  - `task_type` (text) - Task type (login, check, report, etc.)
  - `configuration` (jsonb) - Task configuration
  - `enabled` (boolean) - Whether task is active
  - `last_run_at` (timestamptz) - Last execution time
  - `next_run_at` (timestamptz) - Next scheduled run
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 10. task_executions
  Task execution history and results
  - `id` (uuid, primary key) - Execution identifier
  - `task_id` (uuid, foreign key) - Parent task
  - `status` (text) - Execution status (running, success, failed)
  - `started_at` (timestamptz) - Start time
  - `completed_at` (timestamptz) - Completion time
  - `result` (jsonb) - Execution result
  - `error` (text) - Error message if failed
  - `logs` (text) - Execution logs

  ### 11. file_storage
  Uploaded and downloaded files
  - `id` (uuid, primary key) - File identifier
  - `user_id` (uuid, foreign key) - File owner
  - `filename` (text) - Original filename
  - `file_path` (text) - Storage path
  - `file_type` (text) - MIME type
  - `file_size` (bigint) - File size in bytes
  - `metadata` (jsonb) - Additional file metadata
  - `source` (text) - File source (upload, download, generated)
  - `created_at` (timestamptz) - Upload timestamp

  ## Security
  - All tables have RLS enabled
  - Users can only access their own data
  - Skills can be public or private
  - Agent sessions are isolated per user

  ## Indexes
  - Performance indexes on foreign keys
  - Full-text search indexes on content fields
  - Timestamp indexes for sorting and filtering
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  model_provider text DEFAULT 'openai',
  model_name text DEFAULT 'gpt-4-turbo-preview',
  system_prompt text,
  capabilities jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agents"
  ON agents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON agents FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Browser sessions table
CREATE TABLE IF NOT EXISTS browser_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  url text,
  title text,
  status text DEFAULT 'active',
  viewport jsonb DEFAULT '{"width": 1920, "height": 1080}',
  cookies jsonb DEFAULT '[]',
  local_storage jsonb DEFAULT '{}',
  screenshot_url text,
  created_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own browser sessions"
  ON browser_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own browser sessions"
  ON browser_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own browser sessions"
  ON browser_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own browser sessions"
  ON browser_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  title text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text,
  author_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_public boolean DEFAULT false,
  code text NOT NULL,
  schema jsonb DEFAULT '{}',
  version text DEFAULT '1.0.0',
  usage_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON skills FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id OR is_public = true);

CREATE POLICY "Users can create own skills"
  ON skills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own skills"
  ON skills FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete own skills"
  ON skills FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Agent skills table
CREATE TABLE IF NOT EXISTS agent_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES skills(id) ON DELETE CASCADE NOT NULL,
  enabled boolean DEFAULT true,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, skill_id)
);

ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent skills"
  ON agent_skills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_skills.agent_id
      AND agents.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own agent skills"
  ON agent_skills FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_skills.agent_id
      AND agents.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents
      WHERE agents.id = agent_skills.agent_id
      AND agents.user_id = auth.uid()
    )
  );

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source_type text DEFAULT 'manual',
  source_url text,
  metadata jsonb DEFAULT '{}',
  embedding vector(1536),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge"
  ON knowledge_base FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own knowledge"
  ON knowledge_base FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own knowledge"
  ON knowledge_base FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own knowledge"
  ON knowledge_base FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scheduled tasks table
CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  schedule text NOT NULL,
  task_type text NOT NULL,
  configuration jsonb DEFAULT '{}',
  enabled boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scheduled tasks"
  ON scheduled_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scheduled tasks"
  ON scheduled_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scheduled tasks"
  ON scheduled_tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled tasks"
  ON scheduled_tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Task executions table
CREATE TABLE IF NOT EXISTS task_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES scheduled_tasks(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  result jsonb DEFAULT '{}',
  error text,
  logs text
);

ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own task executions"
  ON task_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_tasks
      WHERE scheduled_tasks.id = task_executions.task_id
      AND scheduled_tasks.user_id = auth.uid()
    )
  );

-- File storage table
CREATE TABLE IF NOT EXISTS file_storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size bigint,
  metadata jsonb DEFAULT '{}',
  source text DEFAULT 'upload',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE file_storage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files"
  ON file_storage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload own files"
  ON file_storage FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files"
  ON file_storage FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_agent_id ON browser_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id ON browser_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_is_public ON skills(is_public);
CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_agent_id ON knowledge_base(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_user_id ON knowledge_base(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_file_storage_user_id ON file_storage(user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content ON knowledge_base USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills USING gin(to_tsvector('english', name || ' ' || description));
