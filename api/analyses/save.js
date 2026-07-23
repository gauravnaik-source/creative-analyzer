import { sql } from '../../lib/db.js';
import { getUserFromRequest } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = await getUserFromRequest(req, sql);
    if (!user) return res.status(401).json({ error: 'Please sign in to save analyses' });

    const { platform, creativeType, context, result } = req.body || {};
    if (!result || typeof result !== 'object') {
      return res.status(400).json({ error: 'Missing analysis result' });
    }

    const overallScore = typeof result.overallScore === 'number' ? result.overallScore : null;
    const headline = typeof result.headline === 'string' ? result.headline : null;

    const inserted = await sql`
      INSERT INTO analyses (user_id, platform, creative_type, context, overall_score, headline, result)
      VALUES (${user.id}, ${platform || null}, ${creativeType || null}, ${context || null}, ${overallScore}, ${headline}, ${JSON.stringify(result)})
      RETURNING id, created_at
    `;

    return res.status(201).json({ id: inserted[0].id, created_at: inserted[0].created_at });
  } catch (err) {
    console.error('Save analysis error:', err);
    return res.status(500).json({ error: 'Something went wrong saving this analysis' });
  }
}
