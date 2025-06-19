import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { description, image, member_ic } = req.body;

  try {
    await pool.query(
      `INSERT INTO post (description, image, member_ic, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [description, image, member_ic]
    );
    res.status(200).json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Error inserting post:', error);
    res.status(500).json({ error: 'Failed to insert post' });
  }
}
