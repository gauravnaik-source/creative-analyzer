import { sql } from '../../lib/db.js';
import { hashPassword, randomToken, sessionCookie, sessionExpiry } from '../../lib/auth.js';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};

    if (!username || !USERNAME_RE.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters (letters, numbers, underscore only)',
      });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    const { hash, salt } = await hashPassword(password);

    const inserted = await sql`
      INSERT INTO users (username, password_hash, password_salt)
      VALUES (${username}, ${hash}, ${salt})
      RETURNING id, username
    `;
    const user = inserted[0];

    const token = randomToken();
    const expiresAt = sessionExpiry();
    await sql`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (${token}, ${user.id}, ${expiresAt.toISOString()})
    `;

    res.setHeader('Set-Cookie', sessionCookie(token));
    return res.status(201).json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Something went wrong creating your account' });
  }
}
