import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { createBrowserSession, closeBrowserSession, getBrowserScreenshot } from '../services/browser-manager.js';

const router = express.Router();

router.use(authenticate);

router.get('/sessions', async (req, res) => {
  try {
    const { agent_id } = req.query;

    let query = req.supabase
      .from('browser_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get browser sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch browser sessions' });
  }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('browser_sessions')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Browser session not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get browser session error:', error);
    res.status(500).json({ error: 'Failed to fetch browser session' });
  }
});

router.post('/sessions', async (req, res) => {
  try {
    const { agent_id } = req.body;

    const session = await createBrowserSession(agent_id, req.user.id, req.supabase);

    res.status(201).json(session);
  } catch (error) {
    console.error('Create browser session error:', error);
    res.status(500).json({ error: 'Failed to create browser session' });
  }
});

router.post('/sessions/:id/navigate', async (req, res) => {
  try {
    const { url } = req.body;

    const result = await req.supabase.rpc('navigate_browser', {
      session_id: req.params.id,
      target_url: url,
    });

    res.json({ success: true, url });
  } catch (error) {
    console.error('Navigate browser error:', error);
    res.status(500).json({ error: 'Failed to navigate browser' });
  }
});

router.get('/sessions/:id/screenshot', async (req, res) => {
  try {
    const screenshot = await getBrowserScreenshot(req.params.id);

    res.json({ screenshot });
  } catch (error) {
    console.error('Get screenshot error:', error);
    res.status(500).json({ error: 'Failed to get screenshot' });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    await closeBrowserSession(req.params.id, req.supabase);

    res.json({ message: 'Browser session closed successfully' });
  } catch (error) {
    console.error('Close browser session error:', error);
    res.status(500).json({ error: 'Failed to close browser session' });
  }
});

export default router;
