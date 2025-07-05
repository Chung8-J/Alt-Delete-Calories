// /api/Fetch_post.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

      return res.status(200).json(result.rows);
    } catch (err) {
      console.error('❌ Error fetching posts:', err);
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }
  }

  // ✅ Add DELETE method support for admins
if (req.method === 'DELETE') {
  const { postid } = req.body;

  if (!postid) {
    return res.status(400).json({ error: 'Missing post ID' });
  }

  try {
    // First delete all comments linked to the post
    await pool.query('DELETE FROM comment WHERE post_id = $1', [postid]);

    // Then delete the post itself
    await pool.query('DELETE FROM post WHERE postid = $1', [postid]);

    return res.status(200).json({ message: '✅ Post and related comments deleted' });
  } catch (err) {
    console.error('❌ Error deleting post:', err);
    return res.status(500).json({ error: 'Failed to delete post and related comments' });
  }
}
  
  // ❌ Reject unsupported methods
  return res.status(405).json({ error: 'Method Not Allowed' });
}
