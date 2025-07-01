import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function getCaloriesPerSecond(exercise_id) {
  const result = await pool.query(
    `SELECT calories_per_sec FROM exercise WHERE exercise_id = $1`,
    [exercise_id]
  );

  if (result.rows.length === 0) return 0;

  const caloriesPerMinute = result.rows[0].calories_per_minute;
  return caloriesPerMinute / 60;
}


export default async function handler(req, res) {
  const { table, action, data } = req.body || {}; // prevent destructuring error for GET

  try {
    // ✅ 1. GET Profile
    if (req.method === 'GET') {
      const { member_ic, role } = req.query;

      if (!member_ic || !role) {
        return res.status(400).json({ error: 'Missing NoIC or role' });
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
                member_ic: coach.coach_ic,
                gender: coach.coach_gender
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
        
     if (table === 'preset_workout_plan' && action === 'save_plan') {
          const { plan_name, description, member_ic, exercises } = data;

          const planRes = await pool.query(
            `INSERT INTO preset_workout_plan (plan_name, description, member_ic)
            VALUES ($1, $2, $3) RETURNING p_workoutplan_id`,
            [plan_name, description, member_ic]
          );
          const planId = planRes.rows[0].p_workoutplan_id;

          const stmt = `
            INSERT INTO preset_workout_exercise
              (p_workoutplan_id, exercise_id, duration_seconds, estimated_calories, reps, set)
            VALUES ($1, $2, $3, $4, $5, $6)
          `;

          for (const ex of exercises) {
            const exercise_id = parseInt(ex.exercise_id);
            const duration_seconds = ex.duration_seconds ? parseInt(ex.duration_seconds) : null;
            const reps = ex.reps ? parseInt(ex.reps) : null;
            const set = ex.set ? parseInt(ex.set) : null;

            // ⛏️ 1. Get calories_per_sec from exercise table
            const calRes = await pool.query(
              'SELECT calories_per_sec FROM exercise WHERE exercise_id = $1 LIMIT 1',
              [exercise_id]
            );
            const calPerSec = calRes.rows[0]?.calories_per_sec;

            if (!calPerSec) {
              return res.status(400).json({ error: `Calories info not found for exercise_id ${exercise_id}` });
            }

            // 🧠 2. Decide duration and estimate calories
            let duration = null;
            let estimatedCalories = null;

            if (duration_seconds) {
              duration = duration_seconds;
              estimatedCalories = Math.round(duration * calPerSec);
            } else if (reps && set) {
              duration = reps * set * 5;
              estimatedCalories = Math.round(duration * calPerSec);
            } else {
              return res.status(400).json({
                error: `⛔ Please enter either duration_seconds or reps and set for exercise_id ${exercise_id}`
              });
            }

            await pool.query(stmt, [
              planId,
              exercise_id,
              duration,
              estimatedCalories,
              reps ?? null,
              set ?? null
            ]);
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
                [d_plan_id, meal_type, food.food_code, food.serving_size,Math.round(food.calories)]
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

      if (table === 'diet_plan' && action === 'save_diet_plan_custom') {
  const { member_ic, plan_name, meals } = data;

  if (!member_ic || !plan_name || !Array.isArray(meals)) {
    return res.status(400).json({ error: 'Missing diet plan data or meals' });
  }

  const insertDiet = await pool.query(
    `INSERT INTO diet_plan (member_ic, plan_name, total_calories)
     VALUES ($1, $2, $3) RETURNING d_plan_id`,
    [member_ic, plan_name, 0]
  );

  const d_plan_id = insertDiet.rows[0].d_plan_id;

  const mealInsert = `
    INSERT INTO diet_plan_meal (d_plan_id, meal_type, food_code, serving_size, calories)
    VALUES ($1, $2, $3, $4, $5)
  `;

  let totalCalories = 0;

  for (const meal of meals) {
    const mealType = meal.meal;

    for (const food of meal.foods) {
      const foodInfo = await pool.query(
        `SELECT food_code, calories FROM food WHERE food_code = $1 LIMIT 1`,
        [food.food_code]
      );

      if (foodInfo.rows.length === 0) {
        console.warn(`⚠️ Food not found for code: ${food.food_code}`);
        continue;
      }

      const { food_code, calories } = foodInfo.rows[0];
      const calcCalories = (food.serving_size / 100) * calories;
      totalCalories += calcCalories;

      await pool.query(mealInsert, [
        d_plan_id,
        mealType,
        food_code,
        food.serving_size,
        Math.round(calcCalories)
      ]);
    }
  }

  await pool.query(
    `UPDATE diet_plan SET total_calories = $1 WHERE d_plan_id = $2`,
    [Math.round(totalCalories), d_plan_id]
  );

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
            `SELECT p_workoutplan_id, plan_name, description FROM preset_workout_plan WHERE member_ic = $1 ORDER BY p_workoutplan_id`,
            [member_ic]
          );
          return res.status(200).json(plans.rows);
        }

        // ✅ Fetch exercises in one workout plan
       if (table === 'preset_workout_exercise' && action === 'get_plan_exercises') {
          const { plan_id } = data;
          const exercises = await pool.query(`
            SELECT pe.exercise_id, e.exercise_name, pe.duration_seconds, pe.estimated_calories, pe.reps, pe.set
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

        // ✅ DELETE plan
        if (action === 'delete_plan') {
          const { plan_id } = data;
          if (table === 'p_workoutplan') {
            await pool.query('DELETE FROM preset_workout_exercise WHERE p_workoutplan_id = $1', [plan_id]);
            await pool.query('DELETE FROM preset_workout_plan WHERE p_workoutplan_id = $1', [plan_id]);
          } else if (table === 'diet_plan') {
            await pool.query('DELETE FROM diet_plan_meal WHERE d_plan_id = $1', [plan_id]);
            await pool.query('DELETE FROM diet_plan WHERE d_plan_id = $1', [plan_id]);
          }
          return res.status(200).json({ success: true });
        }

if (table === 'p_workoutplan' && action === 'update_plan') {
  const { plan_id, plan_name, description, exercises } = data;

  try {
    await pool.query(
      `UPDATE preset_workout_plan SET plan_name = $3, description = $2 WHERE p_workoutplan_id = $1`,
      [plan_id, description, plan_name]
    );

    // Delete old exercises
    await pool.query(
      `DELETE FROM preset_workout_exercise WHERE p_workoutplan_id = $1`,
      [plan_id]
    );

    for (const ex of exercises) {
      const exercise_id = parseInt(ex.exercise_id);

      // Validate exercise_id
      if (isNaN(exercise_id)) {
        return res.status(400).json({ error: `⛔ Invalid exercise_id: ${ex.exercise_id}` });
      }

      const reps = ex.reps ? parseInt(ex.reps) : null;
      const set = ex.set ? parseInt(ex.set) : null;
      const duration_seconds = ex.duration_seconds ? parseInt(ex.duration_seconds) : null;

      // Fetch calories_per_sec
      const calRes = await pool.query(
        `SELECT calories_per_sec FROM exercise WHERE exercise_id = $1 LIMIT 1`,
        [exercise_id]
      );
      const calPerSec = calRes.rows[0]?.calories_per_sec;

      if (!calPerSec) {
        return res.status(400).json({ error: `❌ Calories info not found for exercise_id ${exercise_id}` });
      }

      let duration = null;
      let estimatedCalories = null;

      if (duration_seconds) {
        duration = duration_seconds;
        estimatedCalories = Math.round(duration * calPerSec);
      } else if (reps && set) {
        duration = reps * set * 5;
        estimatedCalories = Math.round(duration * calPerSec);
      } else {
        return res.status(400).json({
          error: `❌ Please provide either duration_seconds or reps & set for exercise_id ${exercise_id}`
        });
      }

      await pool.query(
        `INSERT INTO preset_workout_exercise (p_workoutplan_id, exercise_id, duration_seconds, estimated_calories, reps, set)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [plan_id, exercise_id, duration, estimatedCalories, reps, set]
      );
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('❌ Update Plan Error:', err);
    return res.status(500).json({ error: 'Server error during update.' });
  }
}

if (table === 'diet_plan' && action === 'update_diet_plan') {
  const { d_plan_id, plan_name, meals } = data;

  if (!d_plan_id || !plan_name || !Array.isArray(meals)) {
    return res.status(400).json({ error: 'Missing diet plan ID, name or meals' });
  }

  try {
    // 1. Update plan name only
    await pool.query(
      `UPDATE diet_plan SET plan_name = $1 WHERE d_plan_id = $2`,
      [plan_name, d_plan_id]
    );

    // 2. Delete old meals
    await pool.query(`DELETE FROM diet_plan_meal WHERE d_plan_id = $1`, [d_plan_id]);

    // 3. Insert new meals and calculate total calories
    const mealInsert = `
      INSERT INTO diet_plan_meal (d_plan_id, meal_type, food_code, serving_size, calories)
      VALUES ($1, $2, $3, $4, $5)
    `;

    let totalCalories = 0;

    for (const meal of meals) {
      const mealType = meal.meal;

      for (const food of meal.foods) {
        // Fetch calories per 100g for this food_code
        const foodRes = await pool.query(
          `SELECT calories FROM food WHERE food_code = $1 LIMIT 1`,
          [food.food_code]
        );

        if (foodRes.rows.length === 0) {
          console.warn(`⚠️ Skipping unknown food code: ${food.food_code}`);
          continue;
        }

        const calPer100g = foodRes.rows[0].calories;
        const calcCalories = (food.serving_size / 100) * calPer100g;

        totalCalories += calcCalories;

        await pool.query(mealInsert, [
          d_plan_id,
          mealType,
          food.food_code,
          food.serving_size,
          Math.round(calcCalories)
        ]);
      }
    }

    // 4. Update total_calories
    await pool.query(
      `UPDATE diet_plan SET total_calories = $1 WHERE d_plan_id = $2`,
      [Math.round(totalCalories), d_plan_id]
    );

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('❌ Update Diet Plan Error:', err);
    return res.status(500).json({ error: 'Failed to update diet plan', details: err.message });
  }
}
if (table === 'workout_log' && action === 'update_or_extend_log') {
  const { member_ic, p_workoutplan_id, new_duration, new_calories, exercises } = data;

  const today = new Date();
  const todayDate = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Fetch latest log
  const existingLogQuery = await pool.query(`
    SELECT * FROM workout_log
    WHERE member_ic = $1 AND p_workoutplan_id = $2
    ORDER BY log_id DESC
    LIMIT 1
  `, [member_ic, p_workoutplan_id]);

  let logIdToUse;
  let dayToUse = 1;

  if (existingLogQuery.rowCount === 0) {
    // 🆕 No log exists → insert new
    const insertLog = await pool.query(`
      INSERT INTO workout_log (
        member_ic, p_workoutplan_id, completion_date,
        total_duration_seconds, total_calories_burned, day
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING log_id
    `, [
      member_ic,
      p_workoutplan_id,
      todayDate,
      new_duration,
      new_calories,
      dayToUse
    ]);
    logIdToUse = insertLog.rows[0].log_id;
  } else {
    // ✅ Log exists
    const log = existingLogQuery.rows[0];
    const lastLogDate = new Date(log.completion_date);
    const sameDay = lastLogDate.toDateString() === today.toDateString();

    if (sameDay) {
      // 🔁 Same day → extend existing log
      await pool.query(`
        UPDATE workout_log
        SET 
          total_duration_seconds = total_duration_seconds + $1,
          total_calories_burned = total_calories_burned + $2
        WHERE log_id = $3
      `, [new_duration, new_calories, log.log_id]);

      logIdToUse = log.log_id;
      dayToUse = log.day;
    } else {
      // 📅 New day → insert new log
      const newDay = log.day + 1;

      const insertLog = await pool.query(`
        INSERT INTO workout_log (
          member_ic, p_workoutplan_id, completion_date,
          total_duration_seconds, total_calories_burned, day
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING log_id
      `, [
        member_ic,
        p_workoutplan_id,
        todayDate,
        new_duration,
        new_calories,
        newDay
      ]);

      logIdToUse = insertLog.rows[0].log_id;
      dayToUse = newDay;
    }
  }

  // 🏋️ Add exercises
  for (const ex of exercises) {
    await pool.query(`
      INSERT INTO workout_log_exercise (
        log_id, exercise_id, sets_completed, reps_per_set,
        weight_per_set, duration_seconds, calories_burned, day
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      logIdToUse,
      ex.exercise_id,
      ex.sets_completed,
      ex.reps_per_set,
      ex.weight_per_set || '',
      ex.duration_seconds,
      ex.calories_burned,
      dayToUse
    ]);
  }

  return res.status(200).json({
    
  });
}



  // ➕ Add exercise details to workout_log_exercise
if (table === 'workout_log_exercise' && action === 'insert_exercises') {
  const { log_id, exercises, day } = data;

  for (const ex of exercises) {
    await pool.query(`
      INSERT INTO workout_log_exercise (
        log_id,
        exercise_id,
        sets_completed,
        reps_per_set,
        weight_per_set,
        duration_seconds,
        calories_burned,
        day
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      log_id,
      ex.exercise_id,
      ex.sets_completed || 0,
      ex.reps_per_set || '',
      ex.weight_per_set || '',
      ex.duration_seconds || 0,
      ex.calories_burned || 0,
      day
    ]);
  }

  return res.status(200).json({ message: 'Exercises logged successfully' });
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
