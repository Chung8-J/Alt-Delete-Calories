import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    original_ic,
    coach_ic,
    coach_name,
    d_birth,
    expr_coaching,
    email,
    no_tel,
    coach_gender
  } = req.body;

  if (!original_ic) {
    return res.status(400).json({ error: 'Missing original_ic' });
  }

  const updatedFields = [];
  const values = [];
  let idx = 1;

  const mapping = {
    coach_ic,
    coach_name,
    d_birth,
    expr_coaching,
    email,
    no_tel,
    coach_gender,
  };

  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined && val !== null && val !== '') {
      updatedFields.push(`${col} = $${idx++}`);
      values.push(val);
    }
  }

  if (updatedFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(original_ic);

  const sql = `
    UPDATE coach 
    SET ${updatedFields.join(', ')}
    WHERE coach_ic = $${idx}
    RETURNING coach_ic, coach_name, d_birth, expr_coaching, email, no_tel, coach_gender
  `;

  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Coach not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('❌ DB ERROR:', err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
}
