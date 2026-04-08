import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('agents')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, model_provider, model_name, system_prompt, capabilities } = req.body;

    const { data, error } = await req.supabase
      .from('agents')
      .insert({
        user_id: req.user.id,
        name,
        description,
        model_provider: model_provider || 'openai',
        model_name: model_name || 'gpt-4-turbo-preview',
        system_prompt: system_prompt || 'You are a helpful AI assistant that can browse the web and help users with tasks.',
        capabilities: capabilities || ['web_browsing', 'file_processing', 'task_automation'],
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, model_provider, model_name, system_prompt, capabilities, status } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (model_provider !== undefined) updates.model_provider = model_provider;
    if (model_name !== undefined) updates.model_name = model_name;
    if (system_prompt !== undefined) updates.system_prompt = system_prompt;
    if (capabilities !== undefined) updates.capabilities = capabilities;
    if (status !== undefined) updates.status = status;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await req.supabase
      .from('agents')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('agents')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

export default router;
