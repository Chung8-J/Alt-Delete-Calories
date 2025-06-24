import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export default async function handler(req, res) {
  const { table, action, data } = req.body || {}; // prevent destructuring error for GET

  try {
    // ✅ 1. GET Profile
    if (req.method === 'GET') {
      const { member_ic, role } = req.query;

      if (!member_ic || !role) {
        return res.status(400).json({ error: 'Missing member_ic or role' });
      }

      const tableName = role === 'admin' ? 'coach' : 'member';

      const result = await pool.query(
        `SELECT * FROM ${tableName} WHERE ${tableName}_ic = $1`,
        [member_ic]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `${role === 'admin' ? 'Coach' : 'Member'} not found` });
      }

      return res.status(200).json(result.rows[0]);
    }

    // ✅ 2. POST - Register, Login, Update
    if (req.method === 'POST') {

      // ➕ Member Registration
      if (table === 'member' && action === 'create') {
        if (!data.password || !data.member_name || !data.member_ic || !data.d_birth || !data.email) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const checkResult = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );
        if (checkResult.rows.length > 0) {
          return res.status(400).json({ error: '❌ Username already taken' });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        await pool.query(
          `INSERT INTO member (member_ic, member_name, password, d_birth, email)
           VALUES ($1, $2, $3, $4, $5)`,
          [data.member_ic, data.member_name, hashedPassword, data.d_birth, data.email]
        );

        return res.status(200).json({ message: '✅ Member added' });
      }

      // 🔐 Login (member or coach)
      if (action === 'login') {
        const userResult = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const match = await bcrypt.compare(data.password, user.password);
          if (match) {
            return res.status(200).json({
              user,
              role: 'user'
            });
          }
        }

        const coachResult = await pool.query(
          'SELECT * FROM coach WHERE coach_name = $1',
          [data.member_name]
        );

        if (coachResult.rows.length > 0) {
          const coach = coachResult.rows[0];
          const match = await bcrypt.compare(data.password, coach.password);
          if (match) {
            return res.status(200).json({
              user: {
                member_name: coach.coach_name,
                member_ic: coach.coach_ic
              },
              role: 'admin'
            });
          }
        }

        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // ✏️ Update Profile (member or coach)
        if (action === 'update_profile') {
          try {
            const { role, member_ic, updates } = data;

            if (!role || !member_ic || !updates) {
              return res.status(400).json({ error: 'Missing update data' });
            }

            const tableName = role === 'admin' ? 'coach' : 'member';
            const idColumn = role === 'admin' ? 'coach_ic' : 'member_ic';

            const validColumns = ['height', 'weight', 'goal_weight', 'bmr', 'tdee', 'email', 'gender', 'age']; // add more if needed

            const keys = Object.keys(updates).filter(key => validColumns.includes(key));
            const values = keys.map(key => updates[key]);


            if (keys.length === 0) {
              return res.status(400).json({ error: 'No fields to update' });
            }

            const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');

            const query = `
              UPDATE ${tableName}
              SET ${setClause}
              WHERE ${idColumn} = $${keys.length + 1}
            `;

            await pool.query(query, [...values, member_ic]);

            return res.status(200).json({ message: '✅ Profile updated' });
          } catch (err) {
            console.error('❌ Update query failed:', err);
            return res.status(500).json({
              error: 'Failed to update profile',
              details: err.message
            });
          }
        }


      // 🛒 Create Product (extra case)
      if (table === 'product' && action === 'create') {
        await pool.query('INSERT INTO product (name, price) VALUES ($1, $2)', [
          data.name,
          data.price,
        ]);
        return res.status(200).json({ message: 'Product added' });
      }

      return res.status(400).json({ error: 'Invalid POST request' });
    }

    res.status(405).end(); // Method not allowed
  } catch (err) {
    console.error('❌ API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
