import express from 'express';
import { supabase } from '../config/supabase.js';
import { isPostgresMode, getDb } from '../config/db.js';
import { signupPg, loginPg } from '../services/auth-service.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (isPostgresMode()) {
      const pool = await getDb();
      const { user, session } = await signupPg(pool, email, password, fullName);
      return res.json({ user, session });
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) return res.status(400).json({ error: authError.message });

    if (authData.user) {
      await supabase.from('users').insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
      });
    }

    res.json({ user: authData.user, session: authData.session });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message || 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isPostgresMode()) {
      const pool = await getDb();
      const { user, session } = await loginPg(pool, email, password);
      return res.json({ user, session });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    res.json({ user: data.user, session: data.session });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message || 'Login failed' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    if (!isPostgresMode() && supabase) {
      await supabase.auth.signOut();
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;
