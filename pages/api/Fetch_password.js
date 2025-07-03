import db from '../../lib/db'; // adjust path to your DB setup

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { table, action, data } = req.body;

    if (action === 'getPasswordByEmail') {
      const { email } = data;

      try {
        const result = await db.query(
          'SELECT password FROM member WHERE email = $1',
          [email]
        );

        if (result.rows.length > 0) {
          res.status(200).json({ password: result.rows[0].password });
        } else {
          res.status(404).json({ error: 'Email not found' });
        }
      } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
      }
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
