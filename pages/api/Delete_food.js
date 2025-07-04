import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing food code' });
  }

  try {
    const result = await pool.query('DELETE FROM food WHERE food_code = $1', [code]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Food not found' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ DELETE /api/Delete_food error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
