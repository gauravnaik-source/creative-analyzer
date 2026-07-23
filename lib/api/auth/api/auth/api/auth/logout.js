import { sql } from '../../lib/db.js';
import { parseCookies, clearSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const cookies = parseCookies(req);
    const token = cookies.ca_session;
    if (token) {
      await sql`DELETE FROM sessions WHERE token = ${token}`;
    }
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Something went wrong logging out' });
  }
}
