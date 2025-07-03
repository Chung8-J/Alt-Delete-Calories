// /pages/api/Add_exercise.js
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    exercise_name,
    description,
    calories_per_sec,
    targeted_area,
    exercise_genre,
    example_pic
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO exercise (
        exercise_name,
        description,
        calories_per_sec,
        targeted_area,
        exercise_genre,
        example_pic
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [exercise_name, description, calories_per_sec, targeted_area, exercise_genre, example_pic]
    );

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('❌ DB Insert Error:', err);
    res.status(500).json({ error: 'Database insert failed' });
  }
}
