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
// ➕ Member Registration
if (table === 'member' && action === 'create') {
  // 1️⃣ Basic validation
  if (
    !data.password ||
    !data.member_name ||
    !data.member_ic ||
    !data.d_birth ||
    !data.email ||
    !data.age ||
    !data.gender
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 2️⃣ Check if username already exists
  const checkResult = await pool.query(
    'SELECT 1 FROM member WHERE member_name = $1',
    [data.member_name]
  );
  if (checkResult.rows.length > 0) {
    return res.status(400).json({ error: '❌ Username already taken' });
  }

  // 3️⃣ Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // 4️⃣ Insert new member (INCLUDING age & gender)
  await pool.query(
    `
      INSERT INTO member
        (member_ic, member_name, password, d_birth, email, age, gender)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      data.member_ic,
      data.member_name,
      hashedPassword,
      data.d_birth,
      data.email,
      parseInt(data.age, 10),
      data.gender
    ]
  );

  return res.status(200).json({ message: '✅ Member added' });
}


      // 🔐 Login (member or coach)
      if (action === 'login') {
        // Try user login first
        const userResult = await pool.query(
          'SELECT * FROM member WHERE member_name = $1',
          [data.member_name]
        );

        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          const match = await bcrypt.compare(data.password, user.password);

          if (match) {
            // Only return necessary user info
            return res.status(200).json({
              user: {
                member_name: user.member_name,
                member_ic: user.member_ic,
                age: user.age,
                gender: user.gender,
                email: user.email // optional, helpful for profile
              },
              role: 'user'
            });
          }
        }

        // Try coach login if user not found or password mismatch
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

        // If no valid user or coach match
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

            const validColumns = ['height', 'weight', 'goal_weight', 'bmr', 'tdee', 'email', 'gender', 'age'];

            const keys = Object.keys(updates).filter(key => validColumns.includes(key));
            const values = keys.map(key => updates[key]);

            if (keys.length === 0) {
              console.log('❌ No valid fields to update');
              return res.status(400).json({ error: 'No valid fields to update' });
            }

            const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
            const query = `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = $${keys.length + 1}`;

            console.log('🛠️ Fields to update:', keys);
            console.log('📦 Values:', [...values, member_ic]);
            console.log('🧾 Final SQL:', query);

            await pool.query(query, [...values, member_ic]);

            return res.status(200).json({ message: '✅ Profile updated' });
          } catch (err) {
            console.error('❌ Update query failed:', err);
            return res.status(500).json({ error: 'Failed to update profile', details: err.message });
          }
        }
        
       if (action === 'save_plan') {
          const { plan_name, description, member_ic, exercises } = data;

          const planRes = await pool.query(
            `INSERT INTO preset_workout_plan (plan_name, description, member_ic)
            VALUES ($1, $2, $3) RETURNING p_workoutplan_id`,
            [plan_name, description, member_ic]
          );
          const planId = planRes.rows[0].p_workoutplan_id;

          const stmt = `INSERT INTO preset_workout_exercise
            (p_workoutplan_id, exercise_id, duration_seconds, estimated_calories)
            VALUES ($1, $2, $3, $4)`;
          for (const ex of exercises) {
            await pool.query(stmt, [planId, ex.exercise_id, ex.duration_seconds, ex.estimated_calories]);
          }

          return res.status(200).json({ success: true, planId });
        }

        if (table === 'diet_plan' && action === 'save_plan') {
          const { member_ic, plan_name, total_calories, meals } = data;

          if (!member_ic || !plan_name || !Array.isArray(meals)) {
            return res.status(400).json({ error: 'Missing required data for diet plan' });
          }

          const planResult = await pool.query(
            `INSERT INTO diet_plan (member_ic, plan_name, total_calories)
            VALUES ($1, $2, $3) RETURNING d_plan_id`,
            [member_ic, plan_name, total_calories]
          );

          const d_plan_id = planResult.rows[0].d_plan_id;

          for (const meal of meals) {
            const meal_type = meal.meal;
            for (const food of meal.foods) {
              await pool.query(
                `INSERT INTO diet_plan_meal (d_plan_id, meal_type, food_code, serving_size, calories)
                VALUES ($1, $2, $3, $4, $5)`,
                [d_plan_id, meal_type, food.food_code, food.serving_size, food.calories]
              );
            }
          }

          return res.status(200).json({ success: true, planId: d_plan_id });
        }

      // ✅ Save diet plan with meals
      if (table === 'diet_plan' && action === 'save_diet_plan') {
        const { member_ic, plan_name, total_calories, meals } = data;

        if (!member_ic || !plan_name || !Array.isArray(meals)) {
          return res.status(400).json({ error: 'Missing diet plan data or meals' });
        }

        // Insert into diet_plan
        const insertDiet = await pool.query(
          `INSERT INTO diet_plan (member_ic, plan_name, total_calories)
          VALUES ($1, $2, $3) RETURNING d_plan_id`,
          [member_ic, plan_name, total_calories]
        );

        const d_plan_id = insertDiet.rows[0].d_plan_id;

        // Insert each meal
        const mealInsert = `
          INSERT INTO diet_plan_meal (d_plan_id, meal_type, food_code, serving_size, calories)
          VALUES ($1, $2, $3, $4, $5)
        `;

        for (const meal of meals) {
          const mealType = meal.meal;

          for (const food of meal.foods) {
            // Look up food_code by food_name
            const foodRes = await pool.query(
              'SELECT food_code FROM food WHERE LOWER(food_name) = LOWER($1) LIMIT 1',
              [food.food_name]
            );

            if (foodRes.rows.length === 0) {
              console.warn(`⚠️ Skipping unknown food name: ${food.food_name}`);
              continue; // Skip if food not found
            }

            const food_code = foodRes.rows[0].food_code;

            await pool.query(mealInsert, [
              d_plan_id,
              mealType,
              food_code,
              food.serving_size,
              Math.round(food.calories)
            ]);
          }
        }

        return res.status(200).json({ success: true, d_plan_id });
      }


      // 🛒 Create Product (extra case)
      if (table === 'product' && action === 'create') {
        await pool.query('INSERT INTO product (name, price) VALUES ($1, $2)', [
          data.name,
          data.price,
        ]);
        return res.status(200).json({ message: 'Product added' });
      }


        if (table === 'preset_workout_plan' && action === 'get_user_plans') {
          const { member_ic } = data;
          const plans = await pool.query(
            `SELECT p_workoutplan_id, plan_name FROM preset_workout_plan WHERE member_ic = $1 ORDER BY p_workoutplan_id`,
            [member_ic]
          );
          return res.status(200).json(plans.rows);
        }

        // ✅ Fetch exercises in one workout plan
        if (table === 'preset_workout_exercise' && action === 'get_plan_exercises') {
          const { plan_id } = data;
          const exercises = await pool.query(`
            SELECT e.exercise_name, pe.duration_seconds, pe.estimated_calories
            FROM preset_workout_exercise pe
            JOIN exercise e ON pe.exercise_id = e.exercise_id
            WHERE p_workoutplan_id = $1
          `, [plan_id]);
          return res.status(200).json(exercises.rows);
        }

        // ✅ Fetch all food plans for user
        if (table === 'diet_plan' && action === 'get_user_plans') {
          const { member_ic } = data;
          const plans = await pool.query(
            `SELECT d_plan_id, plan_name, total_calories FROM diet_plan WHERE member_ic = $1 ORDER BY d_plan_id`,
            [member_ic]
          );
          return res.status(200).json(plans.rows);
        }

        // ✅ Fetch meals in a diet plan
        if (table === 'diet_plan_meal' && action === 'get_plan_meals') {
          const { plan_id } = data;
          const meals = await pool.query(`
            SELECT d.meal_type, f.food_name, d.serving_size, d.calories
            FROM diet_plan_meal d
            JOIN food f ON d.food_code = f.food_code
            WHERE d_plan_id = $1
          `, [plan_id]);
          return res.status(200).json(meals.rows);
        }


        //This is end

      return res.status(400).json({ error: 'Invalid POST request' });
    }
    res.status(405).end(); 
  } catch (err) {
    console.error('❌ API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
