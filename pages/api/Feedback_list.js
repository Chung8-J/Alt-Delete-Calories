import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  const { sort } = req.query;
  const order = sort === 'asc' ? 'ASC' : 'DESC';

  try {
    const result = await pool.query(
      `
      SELECT 
        f.feed_id,
        f.feedback_text,
        f.publish_date,
        m.member_name
      FROM feedback f
      JOIN member m ON f.member_ic = m.member_ic
      ORDER BY f.publish_date ${order}
      `
    );

    res.status(200).json({ success: true, feedbacks: result.rows });
  } catch (err) {
    console.error('❌ DB Error:', err);
    res.status(500).json({ success: false, error: 'Database error' });
  }
}
