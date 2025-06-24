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
        `SELECT c.comment_id, c.content, c.created_at, m.member_name 
         FROM comment c
         JOIN member m ON c.member_ic = m.member_ic
         WHERE c.post_id = $1 ORDER BY c.created_at ASC`,
        [post_id]
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error('Error fetching comments:', err);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }

  else if (method === 'POST') {
    const { post_id, member_ic, content } = body;

    if (!post_id || !member_ic || !content)
      return res.status(400).json({ error: 'Missing required fields' });

    try {
      await pool.query(
        `INSERT INTO comment (post_id, member_ic, content) VALUES ($1, $2, $3)`,
        [post_id, member_ic, content]
      );
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
