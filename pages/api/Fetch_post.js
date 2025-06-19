import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const result = await pool.query(`
      SELECT p.postid, p.description, p.image, p.created_at, m.member_name
      FROM post p
      JOIN member m ON p.member_ic = m.member_ic
      ORDER BY p.created_at ASC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
