// pages/api/Fetch_all_coach.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM coach ORDER BY coach_name ASC');
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Database query failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
