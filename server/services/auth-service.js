import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

let _secret = null;

async function getSecret(pool) {
  if (_secret) return _secret;

  if (process.env.JWT_SECRET) {
    _secret = process.env.JWT_SECRET;
    return _secret;
  }

  const res = await pool.query(
    "SELECT value FROM system_config WHERE key = 'jwt_secret'"
  );

  if (res.rows.length > 0) {
    _secret = res.rows[0].value;
    return _secret;
  }

  const generated = randomBytes(48).toString('hex');
  await pool.query(
    "INSERT INTO system_config (key, value) VALUES ('jwt_secret', $1) ON CONFLICT (key) DO NOTHING",
    [generated]
  );
  _secret = generated;
  console.log('[Auth] JWT secret auto-generated and stored in database.');
  return _secret;
}

export async function signupPg(pool, email, password, fullName) {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) throw new Error('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, created_at`,
    [email, hash, fullName || null]
  );

  const user = rows[0];
  const secret = await getSecret(pool);
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: JWT_EXPIRES });
  return { user, session: { access_token: token } };
}

export async function loginPg(pool, email, password) {
  const { rows } = await pool.query(
    'SELECT id, email, full_name, password_hash FROM users WHERE email = $1',
    [email]
  );
  if (rows.length === 0) throw new Error('Invalid email or password');

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new Error('Invalid email or password');

  delete user.password_hash;
  const secret = await getSecret(pool);
  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: JWT_EXPIRES });
  return { user, session: { access_token: token } };
}

export async function getUserFromTokenPg(pool, token) {
  try {
    const secret = await getSecret(pool);
    const payload = jwt.verify(token, secret);
    const { rows } = await pool.query(
      'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
      [payload.sub]
    );
    if (rows.length === 0) return null;
    return rows[0];
  } catch {
    return null;
  }
}
