// pages/api/Edit_member.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const {
      member_ic,
      member_name,
      email,
      d_birth,
      height,
      weight,
      goal_weight,
      gender,
      active_level,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE member 
         SET member_name = $1,
             email = $2,
             d_birth = $3,
             height = $4,
             weight = $5,
             goal_weight = $6,
             gender = $7,
             active_level = $8
         WHERE member_ic = $9
         RETURNING *`,
        [
          member_name,
          email,
          d_birth,
          height,
          weight,
          goal_weight,
          gender,
          active_level,
          member_ic,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      res.status(200).json({ message: 'Member updated successfully' });
    } catch (error) {
      console.error('DB error:', error);
      res.status(500).json({ error: 'Database error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
