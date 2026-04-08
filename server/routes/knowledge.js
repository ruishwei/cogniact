import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { agent_id, source_type, search } = req.query;

    let query = req.supabase
      .from('knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (source_type) {
      query = query.eq('source_type', source_type);
    }

    if (search) {
      query = query.textSearch('content', search);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('knowledge_base')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get knowledge entry error:', error);
    res.status(500).json({ error: 'Failed to fetch knowledge entry' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { agent_id, title, content, source_type, source_url, metadata, tags } = req.body;

    const { data, error } = await req.supabase
      .from('knowledge_base')
      .insert({
        user_id: req.user.id,
        agent_id,
        title,
        content,
        source_type: source_type || 'manual',
        source_url,
        metadata: metadata || {},
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ error: 'Failed to create knowledge entry' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, content, source_url, metadata, tags } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (source_url !== undefined) updates.source_url = source_url;
    if (metadata !== undefined) updates.metadata = metadata;
    if (tags !== undefined) updates.tags = tags;

    const { data, error } = await req.supabase
      .from('knowledge_base')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ error: 'Failed to update knowledge entry' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('knowledge_base')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Knowledge entry deleted successfully' });
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ error: 'Failed to delete knowledge entry' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const { query, agent_id, limit = 10 } = req.body;

    let searchQuery = req.supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('content', query)
      .limit(limit);

    if (agent_id) {
      searchQuery = searchQuery.eq('agent_id', agent_id);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ error: 'Failed to search knowledge' });
  }
});

export default router;
