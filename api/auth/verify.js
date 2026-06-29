import { sql } from '@vercel/postgres';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );
  `;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureTable();
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const result = await sql`SELECT username, expires_at FROM sessions WHERE token = ${token}`;
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const session = result.rows[0];
    if (new Date(session.expires_at) < new Date()) {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
      return res.status(401).json({ error: 'Session expired' });
    }

    return res.status(200).json({ success: true, username: session.username });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
