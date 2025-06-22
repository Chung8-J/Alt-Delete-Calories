// /api/Fetch_post.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const result = await pool.query(`
      SELECT 
        p.postid, p.description, p.image, p.created_at,
        COALESCE(m.member_name, c.coach_name) AS poster_name,
        CASE 
          WHEN p.member_ic IS NOT NULL THEN 'member'
          WHEN p.coach_ic IS NOT NULL THEN 'coach'
        END AS poster_role
      FROM post p
      LEFT JOIN member m ON p.member_ic = m.member_ic
      LEFT JOIN coach c ON p.coach_ic = c.coach_ic
      ORDER BY p.created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}
