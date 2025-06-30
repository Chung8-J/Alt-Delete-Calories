import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const { post_id } = query;

    if (!post_id) return res.status(400).json({ error: 'post_id is required' });

    try {
      const { rows } = await pool.query(
        `SELECT 
          c.comment_id, 
          c.content, 
          c.created_at,
          COALESCE(m.member_name, co.coach_name) AS member_name,
          CASE 
            WHEN c.coach_ic IS NOT NULL THEN 'coach'
            ELSE 'member'
          END AS poster_role
        FROM comment c
        LEFT JOIN member m ON c.member_ic = m.member_ic
        LEFT JOIN coach co ON c.coach_ic = co.coach_ic
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
        `,
        [post_id]
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  else if (method === 'POST') {
    const { post_id, member_ic, content, role } = body;

    if (!post_id || !member_ic || !content || !role)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      if (role === 'admin') {
        // Verify coach exists
        const check = await pool.query('SELECT 1 FROM coach WHERE coach_ic = $1', [member_ic]);
        if (check.rowCount === 0) {
          return res.status(400).json({ error: 'Coach does not exist' });
        }

        await pool.query(
          `INSERT INTO comment (post_id, coach_ic, content) VALUES ($1, $2, $3)`,
          [post_id, member_ic, content]
        );
      } else {
        // Verify member exists
        const check = await pool.query('SELECT 1 FROM member WHERE member_ic = $1', [member_ic]);
        if (check.rowCount === 0) {
          return res.status(400).json({ error: 'Member does not exist' });
        }

        await pool.query(
          `INSERT INTO comment (post_id, member_ic, content) VALUES ($1, $2, $3)`,
          [post_id, member_ic, content]
        );
      }

      res.status(200).json({ message: '✅ Comment added' });
    } catch (err) {
      console.error('Error adding comment:', err);
      res.status(500).json({ error: 'Failed to add comment' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
