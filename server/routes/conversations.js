import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { processMessage } from '../services/agent-processor.js';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { agent_id } = req.query;
    let query = req.supabase
      .from('conversations')
      .select('*, agents(name, model_name)')
      .order('updated_at', { ascending: false });

    if (agent_id) {
      query = query.eq('agent_id', agent_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('conversations')
      .select('*, agents(*), messages(*)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.get('/:id/messages', async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { agent_id, title } = req.body;

    const { data, error } = await req.supabase
      .from('conversations')
      .insert({
        user_id: req.user.id,
        agent_id,
        title: title || 'New Conversation',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const { content, content_type, attachments } = req.body;

    const { data: userMessage, error: userMsgError } = await req.supabase
      .from('messages')
      .insert({
        conversation_id: req.params.id,
        role: 'user',
        content,
        content_type: content_type || 'text',
        attachments: attachments || [],
      })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    const { data: conversation } = await req.supabase
      .from('conversations')
      .select('*, agents(*)')
      .eq('id', req.params.id)
      .single();

    await req.supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    const assistantResponse = await processMessage(
      conversation,
      userMessage,
      req.supabase,
      req.user.id
    );

    const { data: assistantMessage, error: assistantMsgError } = await req.supabase
      .from('messages')
      .insert({
        conversation_id: req.params.id,
        role: 'assistant',
        content: assistantResponse.content,
        content_type: 'text',
        metadata: assistantResponse.metadata || {},
      })
      .select()
      .single();

    if (assistantMsgError) throw assistantMsgError;

    res.status(201).json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, status } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title;
    if (status !== undefined) updates.status = status;

    const { data, error } = await req.supabase
      .from('conversations')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await req.supabase
      .from('conversations')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

export default router;
