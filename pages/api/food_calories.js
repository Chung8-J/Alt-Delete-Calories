import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { foods } = req.body; // [{ name: 'Apple', grams: 150 }, ...]

  try {
    const results = [];

    for (const item of foods) {
      const result = await pool.query(
        'SELECT food_name, calories_per_100g FROM food WHERE LOWER(food_name) = LOWER($1) LIMIT 1',
        [item.name]
      );

      if (result.rows.length > 0) {
        const { food_name, calories_per_100g } = result.rows[0];
        const total = (item.grams / 100) * calories_per_100g;
        results.push({
          food_name,
          grams: item.grams,
          total_calories: Math.round(total),
        });
      } else {
        results.push({
          food_name: item.name,
          grams: item.grams,
          total_calories: null,
          not_found: true,
        });
      }
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error('❌ Error fetching food data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
