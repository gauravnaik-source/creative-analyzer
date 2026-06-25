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

    const cleanUsername = username.trim().toLowerCase();

    const result = await sql`SELECT password_hash FROM users WHERE username = ${cleanUsername}`;
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const [salt, storedHash] = result.rows[0].password_hash.split(':');
    const hash = hashPassword(password, salt);

    if (hash !== storedHash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await sql`INSERT INTO sessions (token, username, expires_at) VALUES (${token}, ${cleanUsername}, ${expiresAt.toISOString()})`;

    return res.status(200).json({ success: true, token, username: cleanUsername });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
