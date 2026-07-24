import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const admin = await getUserFromRequest(req, sql);
    if (!admin) return res.status(401).json({ error: 'Please sign in' });

    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${admin.id}`;
    if (!adminCheck[0] || !adminCheck[0].is_admin) {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    if (Number(userId) === admin.id) {
      return res.status(400).json({ error: "You can't delete your own admin account" });
    }

    // ON DELETE CASCADE on sessions and analyses handles cleanup automatically
    const deleted = await sql`DELETE FROM users WHERE id = ${userId} RETURNING id, username`;
    if (!deleted[0]) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ deleted: deleted[0] });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Something went wrong deleting this user' });
  }
}
