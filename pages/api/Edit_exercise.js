import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    exercise_id,
    exercise_name,
    description,
    calories_per_sec,
    example_pic, // now should contain FULL public URL
    targeted_area,
    exercise_genre,
  } = req.body;

  if (!exercise_id) return res.status(400).json({ error: 'Missing ID' });
  if (!example_pic) return res.status(400).json({ error: 'Image URL missing' });

  try {
    await pool.query(
      `UPDATE exercise SET 
        exercise_name = $1,
        description = $2,
        calories_per_sec = $3,
        example_pic = $4,
        targeted_area = $5,
        exercise_genre = $6
      WHERE exercise_id = $7`,
      [
        exercise_name,
        description,
        calories_per_sec,
        example_pic, // ✅ store full Supabase URL here
        targeted_area,
        exercise_genre,
        exercise_id,
      ]
    );

    res.status(200).json({ message: 'Exercise updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Database error' });
  }
}
