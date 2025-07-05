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
You are a certified fitness and nutrition AI coach. Create a **personalized daily workout** and **nutrition plan** to help the user safely reach their goal within 30 days.

🧑‍💼 **User Profile**
- Gender: ${gender}
- Age: ${age}
- Height: ${height} cm
- Current Weight: ${currentWeight} kg
- Goal Weight: ${goalWeight} kg
- BMR: ${bmr}
- TDEE: ${tdee}
- Target Daily Calorie Intake: ${dailyCalories} kcal
- Daily Calorie ${dailyDiff > 0 ? 'Surplus' : 'Deficit'}: ${Math.abs(dailyDiff)} kcal
- Preferred Exercise Genre: ${genre}
- Targeted Body Area: ${targetArea}

📌 **Planning Guidelines**

### 1. 🏋️ Workout Plan:
- Select **4–6 exercises** from the provided **exercise list only**.
- Match the user’s **age**, **gender**, **genre**, and **targeted body area**.
- Total workout calories burned should:
  - Offset the ${Math.abs(dailyDiff)} kcal ${dailyDiff > 0 ? 'surplus' : 'deficit'}
  - **Not exceed 1000 kcal** for safety
- ✅ For each workout item, include:
  - \`exercise_id\` (number, from the provided list)
  - \`exercise_name\` (string)
  - \`estimated_calories\` (number)
  - Use **either** of the following formats:
    - If cardio/continuous: include \`duration_seconds\` (number)
    - If strength-based: include both \`reps\` and \`set\` (numbers)
- 🚫 Do not include both formats at the same time.

### 2. 🍽️ Nutrition Plan:
- Provide **3 main meals** and **1–2 snacks**, chosen only from the provided food list.
- Total calories should be around **${dailyCalories} kcal**, within this range:
  - **Minimum**: ${gender === 'male' ? 1500 : 1200} kcal
  - **Acceptable range**: ${Math.max(gender === 'male' ? 1500 : 1200, dailyCalories - 300)} to ${dailyCalories + 200} kcal/day
- ✅ Ensure:
  - Meal variety, no duplicate food items in the same day
  - Balanced macros: proteins, healthy fats, complex carbs
  - Safe and realistic portion sizes

### 3. 🛡️ Safety and Practicality:
- Always prioritize safety — especially for users under 18 or over 60.
- Assume the user has a **moderate fitness level** by default.

📦 **Available Exercises (JSON)**:
${JSON.stringify(exerciseList)}

🍽️ **Available Foods (JSON)**:
${JSON.stringify(foodList)}

📤 **Expected Output Format (Strict JSON Only):**
\`\`\`json
{
  "workout": [
    {
      "exercise_id": 2,
      "exercise_name": "Squats",
      "duration_seconds": 300,
      "estimated_calories": 45
    },
    {
      "exercise_id": 5,
      "exercise_name": "Push-ups",
      "reps": 12,
      "set": 3,
      "estimated_calories": 55
    }
  ],
  "meals": [
    {
      "meal": "Lunch",
      "foods": [
        { "food_code": "1", "food_name": "Grilled Chicken Breast", "serving_size": 100, "calories": 220 },
        ...
      ]
    },
    ...
  ],
  "summary": "To ${goalWeight > currentWeight ? 'gain' : 'lose'} ${Math.abs(goalWeight - currentWeight)}kg in 30 days, aim for a daily ${dailyDiff > 0 ? 'caloric surplus' : 'caloric deficit'} of ${Math.abs(dailyDiff)} kcal. Burn around ${Math.min(Math.abs(dailyDiff), 1000)} kcal through exercise and consume approximately ${dailyCalories} kcal of food per day. Never go below safe minimum intake to ensure health."
}
\`\`\`

⚠️ **DO NOT:**
- Invent any exercises or foods
- Use names, IDs, or items not present in the lists
- Wrap the output in extra Markdown, explanation, or headings

✅ **JUST return pure valid JSON in the above format.**
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
