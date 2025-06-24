// pages/api/saveWorkoutPlan.js
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is missing from .env');
}else{
    console.log("db is found")
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  }
});


export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Only POST allowed' });

  const {
    member_ic,
    height,
    weight,
    bmr,
    tdee,
    plan_name,
    description,
    exercises /*  [{ exercise_name, duration_sec }] */
  } = req.body;

  if (!member_ic || !plan_name || !exercises?.length)
    return res.status(400).json({ error: 'Missing fields' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. insert plan -----------------------------------
    const {
      rows: [{ p_workoutplan_id }]
    } = await client.query(
      `INSERT INTO preset_workout_plan (plan_name, description)
       VALUES ($1,$2) RETURNING p_workoutplan_id`,
      [plan_name, description || null]
    );

    // 2. for each exercise -----------------------------
    for (const ex of exercises) {
      // find exercise_id & calories_per_sec
      const {
        rows: [dbEx]
      } = await client.query(
        `SELECT exercise_id, calories_per_sec FROM exercise
         WHERE exercise_name = $1 LIMIT 1`,
        [ex.exercise_name]
      );
      if (!dbEx) continue; // skip if not found

      const estimated_cal = Math.round(ex.duration_sec * dbEx.calories_per_sec);

      await client.query(
        `INSERT INTO preset_workout_exercise
         (p_workoutplan_id, exercise_id, duration_seconds, estimated_calories)
         VALUES ($1,$2,$3,$4)`,
        [p_workoutplan_id, dbEx.exercise_id, ex.duration_sec, estimated_cal]
      );
    }

    // 3. update member profile -------------------------
    await client.query(
      `UPDATE member SET
         height = $1,
         weight = $2,
         bmr    = $3,
         tdee   = $4
       WHERE member_ic = $5`,
      [height, weight, bmr, tdee, member_ic]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: '✅ Plan saved', p_workoutplan_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Save plan error:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  } finally {
    client.release();
  }
}
