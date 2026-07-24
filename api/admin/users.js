import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromRequest(req, sql);
    if (!user) return res.status(401).json({ error: 'Please sign in' });

    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${user.id}`;
    if (!adminCheck[0] || !adminCheck[0].is_admin) {
      return res.status(403).json({ error: 'Admin access only' });
    }

    const rows = await sql`
      SELECT u.id, u.username, u.created_at,
        (SELECT COUNT(*) FROM analyses a WHERE a.user_id = u.id) AS analysis_count
      FROM users u
      ORDER BY u.created_at DESC
    `;

    const statsRows = await sql`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM analyses) AS total_analyses,
        (SELECT pg_database_size(current_database())) AS db_size_bytes
    `;
    const stats = statsRows[0] || { total_users: 0, total_analyses: 0, db_size_bytes: 0 };

    return res.status(200).json({ users: rows, stats });
  } catch (err) {
    console.error('Admin users list error:', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}
