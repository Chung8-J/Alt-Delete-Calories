import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      food_name,
      description,
      calories,
      carbohydrate_per_100g,
      protein_per_100g,
      fat_per_100g,
      food_genre,
      food_pic, // just filename, not the file itself
    } = req.body;

    if (!food_name || !calories || !food_genre) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const insertQuery = `
      INSERT INTO food (
        food_name,
        description,
        calories,
        carbohydrate_per_100g,
        protein_per_100g,
        fat_per_100g,
        food_genre,
        food_pic
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      food_name,
      description,
      calories,
      carbohydrate_per_100g,
      protein_per_100g,
      fat_per_100g,
      food_genre,
      food_pic || null,
    ];

    const result = await pool.query(insertQuery, values);
    return res.status(200).json({ message: 'Food added', food: result.rows[0] });
  } catch (error) {
    console.error('Add_food API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
