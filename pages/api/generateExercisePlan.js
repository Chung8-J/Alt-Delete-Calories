// pages/api/generateExercisePlan.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pool } from 'pg';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 🧠 Prompt generator
function generateFitnessPrompt(user, exerciseList, foodList) {
  const {
    currentWeight,
    goalWeight,
    height,
    gender,
    age,
    bmr,
    tdee,
    genre,
    targetArea
  } = user;

  const calorieDiff = (goalWeight - currentWeight) * 7700;
  const dailyDiff = Math.round(calorieDiff / 30);
  const dailyCalories = tdee + dailyDiff;

  return `
You are a fitness AI coach. Create a personalized **daily workout** and **nutrition plan** to help the user reach their goal in 30 days.

🧑‍💼 **User Profile**
- Gender: ${gender}
- Age: ${age}
- Height: ${height} cm
- Current Weight: ${currentWeight} kg
- Goal Weight: ${goalWeight} kg
- BMR: ${bmr}
- TDEE: ${tdee}
- Daily Calorie Target: ${dailyCalories} kcal
- Daily Calorie ${dailyDiff > 0 ? 'Surplus' : 'Deficit'}: ${Math.abs(dailyDiff)} kcal
- Preferred Genre: ${genre}
- Targeted Body Part: ${targetArea}

📌 **Guidelines**
1. Select 4–6 exercises only from the given list (JSON below).
   - Match user’s **age** and **gender preferences**.
   - Focus on their **targeted area** and **genre**.
   - Total burn should ≈ ${Math.abs(dailyDiff)} kcal.

2. Recommend 3 meals and 1–2 snacks using the food list.
   - Total intake ≈ ${dailyCalories} kcal.
   - Ensure diversity, nutrition balance, and realism.

3. Avoid repeated exercises/foods.
4. Prioritize safety, especially based on user age and gender.

📦 **Exercise List (JSON)**:
${JSON.stringify(exerciseList)}

🍽️ **Food List (JSON)**:
${JSON.stringify(foodList)}

📤 **Output JSON Format**:
{
  "workout": [
    { "exercise_name": "Squats", "duration_sec": 300 },
    ...
  ],
  "meals": [
    {
      "meal": "Lunch",
      "foods": [
        { "name": "Grilled Chicken Breast", "calories": 220 },
        ...
      ]
    },
    ...
  ],
  "summary": "To ${goalWeight > currentWeight ? 'gain' : 'lose'} ${Math.abs(goalWeight - currentWeight)}kg in 30 days, maintain a daily ${dailyDiff > 0 ? 'surplus' : 'deficit'} of ${Math.abs(dailyDiff)} kcal. Burn about ${Math.abs(dailyDiff)} kcal from exercise and consume ${dailyCalories} kcal from food."
}
`;
}

// 🔧 API Handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const user = req.body;

  if (!user) {
    return res.status(400).json({ error: 'Missing user data' });
  }

  try {
    // 🏋️ Get relevant exercises
        const { rows: exerciseList } = await pool.query(
        `SELECT exercise_name, calories_per_sec, targeted_area, exercise_genre
        FROM exercise
        WHERE exercise_genre::TEXT ILIKE $1 OR targeted_area ILIKE $2`,
        [`%${user.genre}%`, `%${user.targetArea}%`]
        );


    if (!exerciseList.length) {
      return res.status(404).json({ error: 'No exercises matched user preference' });
    }

    // 🍽️ Get food list
    const { rows: foodList } = await pool.query(
      `SELECT food_name AS name, calories FROM food`
    );

    if (!foodList.length) {
      return res.status(404).json({ error: 'No food found in database' });
    }

    // 🧠 Generate prompt & ask Gemini
    const prompt = generateFitnessPrompt(user, exerciseList, foodList);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

    const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    const text = result.response.text();

    res.status(200).json({ plan: text });
  } catch (err) {
    console.error('❌ generateExercisePlan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
