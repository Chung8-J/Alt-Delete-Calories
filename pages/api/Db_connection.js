import { Pool } from 'pg';

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
        await pool.query(
          'INSERT INTO member (member_name, password) VALUES ($1, $2)',
          [data.member_name, data.password]
        );
        return res.status(200).json({ message: 'Member added' });
      }

      if (action === 'login') {
        const result = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );

        if (
          result.rows.length === 0 ||
          result.rows[0].password !== data.password
        ) {
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

    res.status(400).json({ error: 'Invalid request' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}
