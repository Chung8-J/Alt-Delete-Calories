// pages/api/Edit_member.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    const {
      original_ic,
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
         SET member_ic = $1,
             member_name = $2,
             email = $3,
             d_birth = $4,
             height = $5,
             weight = $6,
             goal_weight = $7,
             gender = $8,
             active_level = $9
         WHERE member_ic = $10
         RETURNING *`,
        [
          member_ic,
          member_name,
          email,
          d_birth,
          height,
          weight,
          goal_weight,
          gender,
          active_level,
          original_ic // this ensures update is performed on the correct record
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
