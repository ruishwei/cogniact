import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import agentRoutes from './routes/agents.js';
import conversationRoutes from './routes/conversations.js';
import skillRoutes from './routes/skills.js';
import browserRoutes from './routes/browser.js';
import knowledgeRoutes from './routes/knowledge.js';
import taskRoutes from './routes/tasks.js';
import fileRoutes from './routes/files.js';
import authRoutes from './routes/auth.js';
import { handleWebSocketConnection } from './services/websocket.js';
import { initializeScheduler } from './services/scheduler.js';
import { getDb, isPostgresMode } from './config/db.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/files', fileRoutes);

wss.on('connection', handleWebSocketConnection);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  if (isPostgresMode()) {
    await getDb();
  }
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [DB_MODE=${process.env.DB_MODE || 'supabase'}]`);
    initializeScheduler();
  });
}

start().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

export { wss };
