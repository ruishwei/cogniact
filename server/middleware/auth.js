import { getSupabaseClient } from '../config/supabase.js';
import { isPostgresMode } from '../config/db.js';
import { getUserFromTokenPg } from '../services/auth-service.js';
import { createPgAdapter } from '../config/pg-adapter.js';

let pgPool = null;

async function getPgPool() {
  if (!pgPool) {
    const { getDb } = await import('../config/db.js');
    pgPool = await getDb();
  }
  return pgPool;
}

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);

    if (isPostgresMode()) {
      const pool = await getPgPool();
      const user = await getUserFromTokenPg(pool, token);

      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = user;
      req.db = pool;
      req.supabase = createPgAdapter(pool);
      return next();
    }

    const supabase = getSupabaseClient(token);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    req.supabase = supabase;
    req.db = supabase;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};
