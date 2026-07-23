import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromRequest(req, sql);
    if (!user) return res.status(401).json({ error: 'Please sign in to view your history' });

    const rows = await sql`
      SELECT id, platform, creative_type, context, overall_score, headline, result, created_at
      FROM analyses
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({ analyses: rows });
  } catch (err) {
    console.error('List analyses error:', err);
    return res.status(500).json({ error: 'Something went wrong loading your history' });
  }
}
