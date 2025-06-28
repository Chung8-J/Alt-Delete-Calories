import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [memberCount, coachCount, exerciseCount, foodCount] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM member'),
      pool.query('SELECT COUNT(*) FROM coach'),
      pool.query('SELECT COUNT(*) FROM exercise'),
      pool.query('SELECT COUNT(*) FROM food')
    ]);

    res.status(200).json({
      totalMembers: parseInt(memberCount.rows[0].count),
      totalCoaches: parseInt(coachCount.rows[0].count),
      totalExercises: parseInt(exerciseCount.rows[0].count),
      totalFoods: parseInt(foodCount.rows[0].count)
    });
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
