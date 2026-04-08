import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { category, is_public } = req.query;

    let query = req.supabase
      .from('skills')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (is_public !== undefined) {
      query = query.eq('is_public', is_public === 'true');
    } else {
      query = query.or(`author_id.eq.${req.user.id},is_public.eq.true`);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('skills')
      .select('*, users(full_name, email)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    if (!data.is_public && data.author_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ error: 'Failed to fetch skill' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, slug, description, category, code, schema, is_public, version } = req.body;

    const { data, error } = await req.supabase
      .from('skills')
      .insert({
        author_id: req.user.id,
        name,
        slug,
        description,
        category: category || 'general',
        code,
        schema: schema || {},
        is_public: is_public || false,
        version: version || '1.0.0',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, category, code, schema, is_public, version } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (code !== undefined) updates.code = code;
    if (schema !== undefined) updates.schema = schema;
    if (is_public !== undefined) updates.is_public = is_public;
    if (version !== undefined) updates.version = version;

    const { data, error } = await req.supabase
      .from('skills')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ error: 'Failed to update skill' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('skills')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ error: 'Failed to delete skill' });
  }
});

router.get('/agent/:agentId', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('agent_skills')
      .select('*, skills(*)')
      .eq('agent_id', req.params.agentId);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get agent skills error:', error);
    res.status(500).json({ error: 'Failed to fetch agent skills' });
  }
});

router.post('/agent/:agentId/assign', async (req, res) => {
  try {
    const { skill_id, enabled, configuration } = req.body;

    const { data, error } = await req.supabase
      .from('agent_skills')
      .insert({
        agent_id: req.params.agentId,
        skill_id,
        enabled: enabled !== undefined ? enabled : true,
        configuration: configuration || {},
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Assign skill error:', error);
    res.status(500).json({ error: 'Failed to assign skill' });
  }
});

router.delete('/agent/:agentId/unassign/:skillId', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('agent_skills')
      .delete()
      .eq('agent_id', req.params.agentId)
      .eq('skill_id', req.params.skillId);

    if (error) throw error;

    res.json({ message: 'Skill unassigned successfully' });
  } catch (error) {
    console.error('Unassign skill error:', error);
    res.status(500).json({ error: 'Failed to unassign skill' });
  }
});

export default router;
