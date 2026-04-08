import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { agent_id, enabled } = req.query;

    let query = req.supabase
      .from('scheduled_tasks')
      .select('*, agents(name)')
      .order('created_at', { ascending: false });

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    if (enabled !== undefined) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('scheduled_tasks')
      .select('*, agents(name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { agent_id, name, description, schedule, task_type, configuration, enabled } = req.body;

    const { data, error } = await req.supabase
      .from('scheduled_tasks')
      .insert({
        user_id: req.user.id,
        agent_id,
        name,
        description,
        schedule,
        task_type,
        configuration: configuration || {},
        enabled: enabled !== undefined ? enabled : true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, description, schedule, task_type, configuration, enabled } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (schedule !== undefined) updates.schedule = schedule;
    if (task_type !== undefined) updates.task_type = task_type;
    if (configuration !== undefined) updates.configuration = configuration;
    if (enabled !== undefined) updates.enabled = enabled;

    const { data, error } = await req.supabase
      .from('scheduled_tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('scheduled_tasks')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

router.get('/:id/executions', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('task_executions')
      .select('*')
      .eq('task_id', req.params.id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get task executions error:', error);
    res.status(500).json({ error: 'Failed to fetch task executions' });
  }
});

router.post('/:id/run', async (req, res) => {
  try {
    const { data: task } = await req.supabase
      .from('scheduled_tasks')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task execution started', task_id: req.params.id });
  } catch (error) {
    console.error('Run task error:', error);
    res.status(500).json({ error: 'Failed to run task' });
  }
});

export default router;
