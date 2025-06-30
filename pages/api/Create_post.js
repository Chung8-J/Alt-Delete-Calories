import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { description, image, member_ic, role, created_at } = req.body;

  console.log('📥 Incoming post request:', req.body);

  try {
    if (!member_ic || !role) {
      return res.status(400).json({ error: 'Missing member_ic or role' });
    }

    if (role === 'admin') {
      // Treat as coach post
      const check = await pool.query('SELECT 1 FROM coach WHERE coach_ic = $1', [member_ic]);
      if (check.rowCount === 0) {
        return res.status(400).json({ error: 'Admin (coach) does not exist' });
      }

      await pool.query(
        `INSERT INTO post (description, image, member_ic, coach_ic, created_at)
         VALUES ($1, $2, NULL, $3, $4)`,
        [description, image, member_ic, created_at]
      );

    } else if (role === 'user') {
      // Treat as member post
      const check = await pool.query('SELECT 1 FROM member WHERE member_ic = $1', [member_ic]);
      if (check.rowCount === 0) {
        return res.status(400).json({ error: 'Member does not exist' });
      }

      await pool.query(
        `INSERT INTO post (description, image, member_ic, coach_ic, created_at)
         VALUES ($1, $2, $3, NULL, $4)`,
        [description, image, member_ic, created_at]
      );

    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    res.status(200).json({ message: 'Post created successfully' });

  } catch (err) {
    console.error('❌ Error creating post:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
}
