import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { coach_ic } = req.query;
  if (!coach_ic) return res.status(400).json({ error: 'Missing coach_ic' });

  try {
    const { rows } = await pool.query('SELECT * FROM coach WHERE coach_ic = $1', [coach_ic]);
    if (rows.length === 0) return res.status(404).json({ error: 'Coach not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
