// pages/api/exercises.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM exercise ORDER BY exercise_id ASC');
      console.log('Fetched from DB:', result.rows); // <--- add this
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('DB error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

