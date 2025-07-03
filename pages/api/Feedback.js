import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { member_ic, message } = req.body;

    if (!member_ic || !message) {
      return res.status(400).json({ success: false, error: 'Missing member_ic or message' });
    }

    try {
      const result = await pool.query(
        `INSERT INTO feedback (member_ic, feedback_text, publish_date)
         VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *`,
        [member_ic, message]
      );

      return res.status(200).json({ success: true, feedback: result.rows[0] });
    } catch (error) {
      console.error('❌ DB Error:', error);
      return res.status(500).json({ success: false, error: 'Database insert failed' });
    }
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
