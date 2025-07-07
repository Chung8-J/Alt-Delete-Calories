'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from './footer';

const bodyParts = [
  "Wrists", "Upper Chest", "Shoulders", "Triceps", "Upper Back", "Spine", "Chest", "Hip Flexors",
  "Lower Back", "Hamstrings", "Traps", "Core", "Glutes", "Quads", "Relaxation", "Balance"
];

const genres = [
  "Cardio", "Strength", "Flexibility", "Balance", "Endurance", "Stretch", "Yoga",
  "Dumbell Exercise", "Barbell Exercise", "With Machine", "Without Equipment"
];

export default function NewcomerSetup({ user, setUser, setIsNewcomer }) {
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
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }

  const handleSave = async () => {
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);
    const goal = parseFloat(form.goal_weight);

    if (!height || !weight || !goal) return alert('❌ Please enter all numbers correctly.');
    if (goal < weight - 5 || goal > weight + 5) return alert('❌ Goal weight must be within ±5kg of your current weight to be in a safety level.');

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

    const matched = plan.workout.map(item => {
      const hasDuration = item.duration_seconds && !isNaN(item.duration_seconds);
      const hasRepsSets = item.reps && item.set && !isNaN(item.reps) && !isNaN(item.set);

      if (!item.exercise_id || !item.estimated_calories || (!hasDuration && !hasRepsSets)) return null;

      return {
        exercise_id: parseInt(item.exercise_id),
        duration_seconds: hasDuration ? Math.round(item.duration_seconds) : null,
        reps: hasRepsSets ? parseInt(item.reps) : null,
        set: hasRepsSets ? parseInt(item.set) : null,
        estimated_calories: Math.round(parseFloat(item.estimated_calories)),
        mode: hasRepsSets ? 'reps_sets' : 'duration'
      };
    }).filter(Boolean);



    const workoutRes = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'preset_workout_plan',
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

    if (plan.meals?.length > 0) {
      const totalCalories = Math.round(
        plan.meals.reduce((acc, meal) =>
          acc + meal.foods.reduce((sum, food) => sum + Number(food.calories || 0), 0), 0)
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
      }
    }

    alert(`plans saved successfully!`);
    setIsNewcomer(false);
    window.location.reload();
  };

  return (
    <div style={{
      margin: '20px auto',
      marginBottom: '150px',
      width: '100%',
      marginBottom: '20px',
      background: 'linear-gradient(to right, #122C6F, #8215ca,#122C6F )',
      padding: '50px',
      borderRadius: '10px'
    }}
    >
      {!plan ? (
        <>
          <h2 style={{ marginBottom: '-5px' }}>👋 Welcome, Newcomer!</h2>
          <h3 style={{ marginLeft: '0px', marginBottom: '25px' }}>May I ask your..........</h3>
          <label style={{ fontWeight: 'bold' }}>Height: </label>
          <input type="number"
            name="height"
            placeholder="Height (cm)"
            value={form.height}
            onChange={handleChange}
            style={{
              verticalAlign: 'middle',
              padding: '6px 10px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '12px',
              width: '81%'
            }} />
          <br /><br />

          <label style={{ fontWeight: 'bold' }}>Weight: </label>
          <input type="number"
            name="weight"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={handleChange}
            style={{
              verticalAlign: 'middle',
              padding: '6px 10px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '12px',
              width: '80%'
            }} />
          <br /><br />

          <label style={{ fontWeight: 'bold' }}>Goal Weight: </label>
          <input type="number"
            name="goal_weight"
            placeholder="Goal Weight (kg)"
            value={form.goal_weight}
            onChange={handleChange}
            style={{
              verticalAlign: 'middle',
              padding: '6px 10px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '12px',
              width: '70%'
            }} />
          <br /><br />

          <label style={{ fontWeight: 'bold' }}>Targeted Area: </label>
          <select name="targeted_area"
            value={form.targeted_area}
            onChange={handleChange}
            style={{
              verticalAlign: 'middle',
              padding: '6px 10px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '12px',
              width: '66%'
            }}>
            <option value="Any">No selected part (any type of exercise)</option>
            {bodyParts.map((part, i) => <option key={i} value={part}>{part}</option>)}
          </select><br /><br />

          <label style={{ fontWeight: 'bold' }}>Preferred Exercise Genre: </label><br /><br />
          <select name="exercise_genre"
            value={form.exercise_genre}
            onChange={handleChange}
            style={{
              verticalAlign: 'middle',
              padding: '6px 10px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '12px',
              width: '100%'
            }}>
            <option value="Any">No selected genre</option>
            {genres.map((g, i) => <option key={i} value={g}>{g}</option>)}
          </select><br /><br />

          <button onClick={handleSave} disabled={loading}
            style={{
              verticalAlign: 'middle',
              padding: '10px 15px',
              border: '1px solid ',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              width: '100%',
              backgroundColor: '#00ff37'
            }}>
            {loading ? 'Generating Plan...' : 'Save Info & Generate Plan'}
          </button>
        </>
      ) : (
        <>
          <h3  style={{
                    fontSize: '33px',
                    

                  }}>Personalized Fitness Plan</h3>
          {/* Wrapper div to center the plan */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            {/* Styled plan box */}
            <div style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              border: '3px solid rgba(147, 5, 241, 0.45)',
              padding: '20px',
              color: 'white',
              boxSizing: 'border-box',
              width: '100%',
              maxWidth: '800px',
              marginTop: '10px',
              marginBottom: '10px',
            }}>
              {/* Your existing workout and meal plan content here */}




              {plan.workout?.length > 0 && (
                <>
                  <h4 style={{
                    fontSize: '23px',
                    marginTop: '5px',
                    marginBottom: '10px',

                  }}>Workouts</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 10 }}>
                    {plan.workout.map((ex, idx) => (
                      <li key={idx} style={{ marginBottom: '10px' }}>
                        <strong>{ex.exercise_name}</strong><br />
                        {ex.reps != null && ex.set != null
                          ? `Reps: ${ex.reps}, Sets: ${ex.set}, Calories: ${Math.round(ex.estimated_calories)}`
                          : `Duration: ${formatDuration(ex.duration_seconds)}, Calories: ${Math.round(ex.estimated_calories)}`}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {plan.meals?.length > 0 && (
                <>
                  <h4 style={{
                    fontSize: '23px',
                    marginTop: '10px',
                    marginBottom: '10px',
                    borderTop: '1px solid white',
                    paddingTop: '10px'
                  }}>Meal Plan</h4>
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
                <p><strong>Summary:</strong> {plan.summary}</p>
              )}
            </div>
          </div>
          {!planAccepted ? (
            <>
              <p>Would you like to use this plan or customize it?</p>
              <button style={{
                backgroundColor: '#50DA00',
                border: 'none',
                minWidth: '260px',
                height: 'auto',
                fontSize: '17px',
                fontWeight: 'bolder',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'box-shadow 0.3s ease',
                borderRadius: '15px',
                padding: '11px 14px',
                justifyContent: 'center',
                marginTop: '25px',
                color: 'black',
                cursor: 'pointer',
                marginRight: '25px'
              }}onClick={() => setPlanAccepted(true)}>Use This Plan</button>
              <button style={{
                backgroundColor: '#50DA00',
                border: 'none',
                minWidth: '260px',
                height: 'auto',
                fontSize: '17px',
                fontWeight: 'bolder',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'box-shadow 0.3s ease',
                borderRadius: '15px',
                padding: '11px 14px',
                justifyContent: 'center',
                marginTop: '25px',
                color: 'black',
                cursor: 'pointer'
              }}onClick={() => router.push('/customizeplan')}>Customize Plan</button>
            </>
          ) : (
            <div style={{ marginTop: 20 }}>
              <label>Plan Name:</label><br />
              <input
                type="text"
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginTop: '5px'
                }}
              /><br /><br />

              <label>Description:</label><br />
              <textarea
                rows={3}
                value={planDesc}
                onChange={e => setPlanDesc(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical',
                  marginTop: '5px'
                }}
              ></textarea><br /><br />

              <button style={{
                backgroundColor: '#50DA00',
                border: 'none',
                minWidth: '260px',
                height: 'auto',
                fontSize: '17px',
                fontWeight: 'bolder',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                transition: 'box-shadow 0.3s ease',
                borderRadius: '15px',
                padding: '11px 14px',
                justifyContent: 'center',
                marginTop: '25px',
                color: 'black',
                cursor: 'pointer'
              }} onClick={handleFinalPlanSave}>Save Final Plan</button>
            </div>
          )}
        </>
      )}
      <Footer />
    </div>
  );
}
