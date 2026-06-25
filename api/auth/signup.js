import { sql, ensureTable } from './db.js';
import crypto from 'crypto';

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureTable();
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanUsername = username.trim().toLowerCase();

    const existing = await sql`SELECT id FROM users WHERE username = ${cleanUsername}`;
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);
    const passwordHash = `${salt}:${hash}`;

    await sql`INSERT INTO users (username, password_hash) VALUES (${cleanUsername}, ${passwordHash})`;

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await sql`INSERT INTO sessions (token, username, expires_at) VALUES (${token}, ${cleanUsername}, ${expiresAt.toISOString()})`;

    return res.status(200).json({ success: true, token, username: cleanUsername });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
