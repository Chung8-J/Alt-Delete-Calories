import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const { coach_ic, password } = req.body;
  if (!coach_ic || !password) return res.status(400).json({ error: 'Missing coach_ic or password' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query('UPDATE coach SET password = $1 WHERE coach_ic = $2', [hash, coach_ic]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Coach not found' });
    res.status(200).json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
}
