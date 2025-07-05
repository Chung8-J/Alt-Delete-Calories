import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { member_ic } = req.body;

  if (!member_ic) return res.status(400).json({ error: 'Missing member_ic' });

  try {
    const result = await pool.query(
      `SELECT *, 
        TO_CHAR(completion_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD') AS malaysia_date 
       FROM workout_log 
       WHERE member_ic = $1`,
      [member_ic]
    );

    console.log("✅ Workout log results:", result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching workout logs:', err);
    res.status(500).json({ error: 'Failed to fetch workout logs' });
  }
}
