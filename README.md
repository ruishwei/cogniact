# Cloud Agent Browser System

A cloud-based intelligent agent platform with multi-user support, browser automation, extensible skills, and a natural language chat interface.

## Features

- **Multi-User Authentication**: Register and log in with email/password; JWT sessions auto-managed
- **Intelligent Agents**: Create AI-powered agents with configurable models and system prompts
- **Virtual Browser**: Automated browser sessions via Playwright — navigate, fill forms, capture screenshots
- **Chat Interface**: Natural language conversations with agents in real time
- **Skills System**: Extensible custom JavaScript skills that can be assigned to agents
- **Knowledge Base**: Store and retrieve documentation, notes, and learned experiences
- **Scheduled Tasks**: Cron-based recurring operations (monitoring, data collection, etc.)
- **File Processing**: Upload and process Word, PDF, ZIP, and other document formats

## Technology Stack

| Layer | Technologies |
|---|---|
| Backend | Node.js, Express, WebSocket |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Browser Automation | Playwright |
| Frontend | Vue.js 3, Pinia, Vue Router, Axios |

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (or a PostgreSQL database)
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Copy `.env` and fill in your Supabase connection values:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> When using PostgreSQL mode (`DB_MODE=postgres`), set `DATABASE_URL`. The JWT secret is **auto-generated** on first run and stored in the database — no manual configuration needed.

3. Install Playwright browsers (only needed for browser automation):

```bash
npx playwright install
```

4. Start the development server:

```bash
npm run dev
```

Backend runs on port **3000**, frontend on port **5173**.

## Database Modes

| Mode | Config | Notes |
|---|---|---|
| Supabase (default) | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | Uses Supabase auth and RLS |
| PostgreSQL | `DB_MODE=postgres` + `DATABASE_URL` | Self-hosted; JWT secret auto-generated |

## API Endpoints

| Prefix | Description |
|---|---|
| `/api/auth/*` | Registration, login, session |
| `/api/agents/*` | Agent CRUD and configuration |
| `/api/conversations/*` | Chat history and messaging |
| `/api/browser/*` | Browser session control |
| `/api/skills/*` | Custom skill management |
| `/api/knowledge/*` | Knowledge base entries |
| `/api/tasks/*` | Scheduled task management |
| `/api/files/*` | File upload and processing |

## Security

- Row Level Security (RLS) enforced on all tables
- Passwords hashed with bcrypt
- JWT secret auto-generated and persisted in the database (overridable via `JWT_SECRET` env var)
- Per-user data isolation throughout

## License

MIT