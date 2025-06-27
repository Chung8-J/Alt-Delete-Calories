import nextConnect from 'next-connect';
import multer from 'multer';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const upload = multer({ storage: multer.diskStorage({
  destination: './public/uploads',
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
}) });

const handler = nextConnect();
handler.use(upload.single('avatar'));

handler.put(async (req, res) => {
  const {
    original_ic, coach_ic, coach_name, d_birth,
    expr_coaching, email, no_tel, coach_gender
  } = req.body;

  // validate required fields
  if (!original_ic) return res.status(400).json({ error: 'Missing original_ic' });

  const updatedFields = [];
  const values = [];

  // Build dynamic SQL based on supplied fields
  const mapping = { coach_ic, coach_name, d_birth, expr_coaching, email, no_tel, coach_gender };
  let idx = 1;
  for (const [col, val] of Object.entries(mapping)) {
    if (val !== undefined) {
      updatedFields.push(`${col} = $${idx++}`);
      values.push(val);
    }
  }

  // Avatar path
  if (req.file) {
    const avatarPath = `/uploads/${req.file.filename}`;
    updatedFields.push(`avatar = $${idx++}`);
    values.push(avatarPath);
  }

  if (updatedFields.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(original_ic); // WHERE clause

  const sql = `UPDATE coach SET ${updatedFields.join(', ')} WHERE coach_ic = $${idx} RETURNING coach_ic, coach_name, d_birth, expr_coaching, email, no_tel, coach_gender, avatar`;
  try {
    const { rows } = await pool.query(sql, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Coach not found' });
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error', details: err.message });
  }
});

// Disable body parsing for multer
export const config = { api: { bodyParser: false } };
export default handler;
