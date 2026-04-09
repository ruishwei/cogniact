import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { isPostgresMode } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

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
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
  const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { user, session: { access_token: token } };
}

export function verifyTokenPg(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getUserFromTokenPg(pool, token) {
  const payload = verifyTokenPg(token);
  if (!payload) return null;

  const { rows } = await pool.query(
    'SELECT id, email, full_name, created_at FROM users WHERE id = $1',
    [payload.sub]
  );
  if (rows.length === 0) return null;
  return rows[0];
}
