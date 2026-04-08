# Cloud Agent Browser System

A powerful cloud-based intelligent agent browser system with multi-user support, enabling intelligent automation, browser session management, and extensible skills.

## Features

### Core Capabilities
- **Multi-User Support**: Full authentication and user management
- **Intelligent Agents**: Create and manage AI-powered agents with configurable models
- **Virtual Browser**: Automated browser sessions with Playwright
- **Chat Interface**: Natural language conversations with agents
- **Skills System**: Extensible skill framework for custom functionality
- **Knowledge Base**: Learned knowledge and documentation management
- **Scheduled Tasks**: Automated recurring operations
- **File Processing**: Upload, download, and process documents

### Agent Capabilities
- Web browsing and automation
- File analysis (Word, PDF, ZIP, etc.)
- Information extraction and summarization
- Automated form filling and submissions
- Document drafting with reference search
- Website monitoring and reporting
- Custom skill execution

## Technology Stack

### Backend
- **Node.js + Express**: RESTful API server
- **Supabase/PostgreSQL**: Database with Row Level Security
- **Playwright**: Browser automation
- **WebSocket**: Real-time communication

### Frontend
- **Vue.js 3**: Modern reactive UI framework
- **Pinia**: State management
- **Vue Router**: Client-side routing
- **Axios**: HTTP client

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or use Supabase)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Install Playwright browsers:
```bash
npx playwright install
```

4. Run the development server:
```bash
npm run dev
```

This starts both the backend (port 3000) and frontend (port 5173).

## Key Features

### 1. Intelligent Agents
Create AI-powered agents with customizable system prompts and capabilities. Agents can browse the web, process files, and execute custom skills.

### 2. Virtual Browser
Automated browser sessions using Playwright. Agents can navigate websites, interact with pages, fill forms, and capture screenshots.

### 3. Knowledge Management
Build a knowledge base from documentation, user interactions, and learned experiences. Agents use this knowledge to provide better responses.

### 4. Skills System
Extend agent capabilities with custom JavaScript skills. Skills can be public or private, and easily assigned to agents.

### 5. Scheduled Tasks
Automate recurring operations like login checks, data collection, and report generation with cron-based scheduling.

## API Documentation

See the full API documentation in the code comments. Key endpoints:

- `/api/auth/*` - Authentication
- `/api/agents/*` - Agent management
- `/api/conversations/*` - Chat conversations
- `/api/browser/*` - Browser sessions
- `/api/skills/*` - Skills management
- `/api/knowledge/*` - Knowledge base
- `/api/tasks/*` - Scheduled tasks

## Security

- Row Level Security (RLS) on all database tables
- JWT-based authentication
- Secure password hashing
- User data isolation
- XSS and injection prevention

## Contributing

Contributions are welcome! Please check the code for extension points and submit pull requests.

## License

MIT License