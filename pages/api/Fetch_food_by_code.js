// /pages/api/Fetch_food_by_code.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  const { code } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await pool.query('SELECT * FROM food WHERE food_code = $1', [code]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Fetch food by code error:', err);
    res.status(500).json({ error: 'Database error' });
  }
}
