// pages/api/Edit_member_password.js
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const { member_ic, password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password required' });

    const hashed = await bcrypt.hash(password, 10);
    try {
      const result = await pool.query(
        'UPDATE member SET password = $1 WHERE member_ic = $2',
        [hashed, member_ic]
      );
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }
      res.status(200).json({ message: 'Password updated' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
