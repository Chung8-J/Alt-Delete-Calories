// /api/Create_post.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { description, image, member_ic, coach_ic, created_at } = req.body;

  try {
    if (member_ic) {
      await pool.query(
        `INSERT INTO post (description, image, member_ic, created_at)
         VALUES ($1, $2, $3, $4)`,
        [description, image, member_ic, created_at]
      );
    } else if (coach_ic) {
      await pool.query(
        `INSERT INTO post (description, image, coach_ic, created_at)
         VALUES ($1, $2, $3, $4)`,
        [description, image, coach_ic, created_at]
      );
    } else {
      return res.status(400).json({ error: 'Missing member_ic or coach_ic' });
    }

    res.status(200).json({ message: 'Post created' });
  } catch (err) {
    console.error('❌ Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
}
