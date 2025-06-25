'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const bodyParts = [
  "Wrists", "Upper Chest", "Shoulders", "Triceps", "Upper Back", "Spine", "Chest", "Hip Flexors",
  "Lower Back", "Hamstrings", "Traps", "Core", "Glutes", "Quads", "Relaxation", "Balance"
];

const genres = [
  "Cardio", "Strength", "Flexibility", "Balance", "Endurance", "Stretch", "Yoga",
  "Dumbell Exercise", "Barbell Exercise", "With Machine", "Without Equipment"
];

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [isNewcomer, setIsNewcomer] = useState(false);
  const [form, setForm] = useState({
    height: '',
    weight: '',
    goal_weight: '',
    targeted_area: 'Any',
    exercise_genre: 'Any'
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [planAccepted, setPlanAccepted] = useState(false);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [dbExercises, setDbExercises] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || storedUser.role !== 'user') {
      router.push('/Login');
      return;
    }

    setUser(storedUser);

    fetch(`/api/Db_connection?member_ic=${storedUser.member_ic}&role=user`)
      .then(res => res.json())
      .then(data => {
        if (!data.height || !data.weight) {
          setIsNewcomer(true);
        }
      })
      .catch(err => console.error('❌ Error checking profile:', err));
  }, [router]);

  useEffect(() => {
    if (user) {
      fetch('/api/Db_connection?table=exercise')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setDbExercises(data);
        })
        .catch(err => console.error('❌ Failed to fetch exercises:', err));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);
    const goal = parseFloat(form.goal_weight);

    if (!height || !weight || !goal) return alert('❌ Please enter all numbers correctly.');
    if (goal < weight - 10 || goal > weight + 10) return alert('❌ Goal weight must be within ±10kg of your current weight.');

    setLoading(true);
    const gender = user.gender?.toLowerCase();
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * user.age + (gender === 'male' ? 5 : -161));
    const tdee = Math.round(bmr * 1.55);

    const updates = { height, weight, goal_weight: goal, bmr, tdee };
    const res = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'member',
        action: 'update_profile',
        data: {
          member_ic: user.member_ic,
          role: 'user',
          updates
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      await generateGeminiPlan({ ...updatedUser, ...form });
    } else {
      alert('❌ Failed to save to DB.');
      console.error(result);
    }
    setLoading(false);
  };

  const generateGeminiPlan = async (userData) => {
    try {
      const res = await fetch('/api/generateExercisePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWeight: userData.weight,
          goalWeight: userData.goal_weight,
          height: userData.height,
          gender: userData.gender,
          age: userData.age,
          bmr: userData.bmr,
          tdee: userData.tdee,
          genre: userData.exercise_genre === 'Any' ? '' : userData.exercise_genre,
          targetArea: userData.targeted_area === 'Any' ? '' : userData.targeted_area
        })
      });

      const result = await res.json();
      if (res.ok && result.plan) {
        const cleaned = result.plan.replace(/```json|```/g, '').trim();
        try {
          const parsed = JSON.parse(cleaned);
          setPlan(parsed);
        } catch (err) {
          console.error('❌ JSON parse failed:', err);
          alert('❌ Invalid plan format.');
        }
      } else {
        alert('❌ Failed to generate plan.');
      }
    } catch (err) {
      console.error('❌ Error generating plan:', err);
    }
  };

  const handleFinalPlanSave = async () => {
  if (!planName.trim()) return alert('❌ Please enter a plan name');
  if (!plan?.workout?.length) return alert('❌ No workout exercises found.');

  // === 1. Save Workout Plan ===
  const matched = plan.workout.map(item => {
    if (!item.exercise_id || !item.duration_seconds || !item.estimated_calories) return null;
    return {
      exercise_id: parseInt(item.exercise_id),
      duration_seconds: Math.round(item.duration_seconds),
      estimated_calories: Math.round(parseFloat(item.estimated_calories))
    };
  }).filter(Boolean);

  const workoutRes = await fetch('/api/Db_connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      table: 'p_workoutplan',
      action: 'save_plan',
      data: {
        member_ic: user.member_ic,
        plan_name: planName,
        description: planDesc,
        exercises: matched
      }
    })
  });

  const workoutResult = await workoutRes.json();
  if (!workoutRes.ok || !workoutResult.success) {
    alert('❌ Failed to save workout plan.');
    console.error(workoutResult);
    return;
  }

  // === 2. Save Diet Plan if exists ===
  if (plan.meals?.length > 0) {
  const totalCalories = Math.round(
  plan.meals.reduce((acc, meal) => {
    return acc + meal.foods.reduce((sum, food) => sum + Number(food.calories || 0), 0);
  }, 0)
);


    const dietRes = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'diet_plan',
        action: 'save_diet_plan',
        data: {
          member_ic: user.member_ic,
          plan_name: planName + ' Diet',
          total_calories: totalCalories,
          meals: plan.meals
        }
      })
    });

    const dietResult = await dietRes.json();
    if (!dietRes.ok || !dietResult.success) {
      console.error('❌ Diet plan save failed:', dietResult);
      alert('❌ Failed to save diet plan.');
    } else {
      console.log('✅ Diet plan saved:', dietResult);
    }
  }

  // ✅ Final message
  alert(`✅ Both plans saved successfully!`);
  setIsNewcomer(false);
};


  if (!user) return <p>Loading...</p>;

  if (isNewcomer && !plan) {
    return (
      <div style={{ padding: 20 }}>
        <h2>👋 Welcome, Newcomer!</h2>
        <input type="number" name="height" placeholder="Height (cm)" value={form.height} onChange={handleChange} /><br /><br />
        <input type="number" name="weight" placeholder="Weight (kg)" value={form.weight} onChange={handleChange} /><br /><br />
        <input type="number" name="goal_weight" placeholder="Goal Weight (kg)" value={form.goal_weight} onChange={handleChange} /><br /><br />

        <label>Targeted Area:</label><br />
        <select name="targeted_area" value={form.targeted_area} onChange={handleChange}>
          <option value="Any">No selected part (any type of exercise)</option>
          {bodyParts.map((part, i) => <option key={i} value={part}>{part}</option>)}
        </select><br /><br />

        <label>Preferred Exercise Genre:</label><br />
        <select name="exercise_genre" value={form.exercise_genre} onChange={handleChange}>
          <option value="Any">No selected part (any type of exercise)</option>
          {genres.map((g, i) => <option key={i} value={g}>{g}</option>)}
        </select><br /><br />

        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Generating Plan...' : '💾 Save Info & Generate Plan'}
        </button>
      </div>
    );
  }

  if (plan && isNewcomer) {
    return (
      <div style={{ padding: 20 }}>
        <h3>🎯 Personalized Fitness Plan</h3>
        <div style={{ background: '#f0f8ff', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          {plan.workout?.length > 0 && (
            <>
              <h4>🏋️ Workouts</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {plan.workout.map((ex, idx) => (
                  <li key={idx} style={{ marginBottom: '10px' }}>
                    <strong>{ex.exercise_name}</strong><br />
                    Duration: {ex.duration_seconds}s, Calories: {Math.round(ex.estimated_calories)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {plan.meals?.length > 0 && (
            <>
              <h4>🍽️ Meal Plan</h4>
              {plan.meals.map((meal, idx) => (
                <div key={idx} style={{ marginBottom: '10px' }}>
                  <strong>{meal.meal}</strong>
                  <ul>
                    {meal.foods.map((f, i) => (
                      <li key={i}>{f.food_name} - {f.serving_size}g, {f.calories} kcal</li>
                    ))}
                  </ul>
                </div>
              ))}
            </>
          )}

          {plan.summary && (
            <p><strong>📌 Summary:</strong> {plan.summary}</p>
          )}
        </div>

        {!planAccepted ? (
          <>
            <p>Would you like to use this plan or customize it?</p>
            <button onClick={() => setPlanAccepted(true)}>✅ Use This Plan</button>
            <button onClick={() => alert('🛠️ Customize plan not available yet.')}>✏️ Customize Plan</button>
          </>
        ) : (
          <div style={{ marginTop: 20 }}>
            <label>Plan Name:</label><br />
            <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} /><br /><br />
            <label>Description:</label><br />
            <textarea rows={3} value={planDesc} onChange={e => setPlanDesc(e.target.value)} style={{ width: '100%' }}></textarea><br /><br />
            <button onClick={handleFinalPlanSave}>💾 Save Final Plan</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user.member_name || user.name}!, This is DashBoard page!!</h1>
      <a href="/community">Community</a><br /><br />
      <a href="/member_exercise">Exercise Library</a><br /><br />
      <a href="/member_food">Food Library</a><br /><br />
      <a href="#">Customize Plan</a><br /><br />
      <a href="/caloriescalculator">Calories Calculator</a><br /><br />
      <a href="/userprofile">Profile</a><br /><br />
      <button onClick={() => {
        localStorage.removeItem('user');
        router.push('/Login');
      }}>Logout</button>
    </div>
  );
}
