import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: 'Exercise ID is required' });
    }

    try {
      const result = await pool.query('DELETE FROM exercise WHERE exercise_id = $1', [id]);
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Exercise not found' });
      }
      return res.status(200).json({ message: 'Exercise deleted successfully' });
    } catch (error) {
      console.error('Database delete error:', error);
      return res.status(500).json({ error: 'Database error during delete' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
