import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


export default async function handler(req, res) {
  const { log_ids } = req.body;

  try {
const result = await pool.query(`
  SELECT e.exercise_name,
         wle.duration_seconds,
         wle.sets_completed,
         wle.reps_per_set,
         wle.weight_per_set,
         wle.calories_burned
  FROM workout_log_exercise wle
  JOIN exercise e ON e.exercise_id = wle.exercise_id
  WHERE wle.log_id = ANY($1)
`, [log_ids]);


    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
}
