import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    const { member_ic } = req.query;

    try {
      await pool.query('DELETE FROM member WHERE member_ic = $1', [member_ic]);
      res.status(200).json({ message: 'Member deleted successfully' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Database delete failed' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
