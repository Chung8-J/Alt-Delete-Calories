// /pages/api/Add_exercise.js
import { supabase } from '../supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { exercise_name, description, targeted_area, exercise_genre, calories_per_sec, example_pic } = req.body;

  const { data, error } = await supabase
    .from('exercise')
    .insert([{ exercise_name, description, targeted_area, exercise_genre, calories_per_sec, example_pic }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json(data);
}
