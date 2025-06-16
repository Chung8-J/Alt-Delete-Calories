import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { table, action, data } = req.body;

  try {
    if (table === 'member') {
      if (action === 'create') {
        // Check for required fields
        if (!data.password || !data.member_name || !data.member_ic || !data.d_birth || !data.email) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Check if member_name already exists
        const checkResult = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );
        if (checkResult.rows.length > 0) {
          return res.status(400).json({ error: '❌ Username already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Insert new member
        await pool.query(
          `INSERT INTO member (member_ic, member_name, password, d_birth, email)
           VALUES ($1, $2, $3, $4, $5)`,
          [data.member_ic, data.member_name, hashedPassword, data.d_birth, data.email]
        );

        return res.status(200).json({ message: '✅ Member added' });
      }

      if (action === 'login') {
        const result = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(data.password, result.rows[0].password);

        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        return res
          .status(200)
          .json({ message: 'Login successful', user: result.rows[0] });
      }
    }

    if (table === 'product' && action === 'create') {
      await pool.query('INSERT INTO product (name, price) VALUES ($1, $2)', [
        data.name,
        data.price,
      ]);
      return res.status(200).json({ message: 'Product added' });
    }

    return res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
