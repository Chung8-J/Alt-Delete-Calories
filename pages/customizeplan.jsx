'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddExercise from '@/components/Addexercise'; // adjust path if needed

export default function CustomizePlan() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('exercise');
  const [exercisePlans, setExercisePlans] = useState([]);
  const [foodPlans, setFoodPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);


  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored?.member_ic) {
      router.push('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  }



  useEffect(() => {
    if (!user) return;

    const fetchPlans = async () => {
      try {
        // 🔁 Exercise plans
        const exRes = await fetch('/api/Db_connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'preset_workout_plan',
            action: 'get_user_plans',
            data: { member_ic: user.member_ic },
          }),
        });

        if (exRes.ok) {
          const exData = await exRes.json();
          setExercisePlans(Array.isArray(exData) ? exData : []);
        } else {
          const text = await exRes.text();
          console.error('Exercise plan fetch error:', text);
        }

        // 🍽️ Food plans
        const fdRes = await fetch('/api/Db_connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'diet_plan',
            action: 'get_user_plans',
            data: { member_ic: user.member_ic },
          }),
        });

        if (fdRes.ok) {
          const fdData = await fdRes.json();
          setFoodPlans(Array.isArray(fdData) ? fdData : []);
        } else {
          const text = await fdRes.text();
          console.error('Food plan fetch error:', text);
        }
      } catch (err) {
        console.error('❌ Fetch failed:', err);
      }
    };

    fetchPlans();
  }, [user]);

const selectPlan = async (planId) => {
  setSelectedPlanId(planId);

  const table = section === 'exercise' ? 'preset_workout_exercise' : 'diet_plan_meal';
  const action = section === 'exercise' ? 'get_plan_exercises' : 'get_plan_meals';

  try {
    const res = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table,
        action,
        data: { plan_id: planId }
      })
    });

    const text = await res.text(); // Read body safely once
    if (!res.ok) {
      console.error('❌ Error response from server:', text);
      return;
    }

    if (!text) {
      console.warn('⚠️ Empty response body.');
      return;
    }

    const data = JSON.parse(text); // Parse manually now
    setSelectedPlanItems(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error('❌ Fetch failed:', err);
  }
};



  return (
    <div style={{ display: 'flex', padding: 20 }}>
      <div style={{ flex: 1 }}>
        <h2>📋 Customize Plan</h2>
        <button onClick={() => { setSection('exercise'); setSelectedPlanId(null); }}>Exercise Plan</button>
        <button onClick={() => { setSection('food'); setSelectedPlanId(null); }} style={{ marginLeft: 10 }}>Food Plan</button>

        <div style={{ marginTop: 20, maxWidth: 200 }}>
          <h4>{section === 'exercise' ? 'Your Exercise Plans' : 'Your Food Plans'}</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {(section === 'exercise' ? exercisePlans : foodPlans).map(plan => (
              <li key={plan[section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id']}>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background:
                      plan[section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id'] === selectedPlanId
                        ? '#e0eaff'
                        : 'transparent',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => selectPlan(plan[section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id'])}
                >
                  {plan.plan_name}
                </button>
              </li>
            ))}
          </ul>

          {section === 'exercise' && (
            <button
              style={{
                marginTop: 10,
                padding: '8px',
                width: '100%',
                backgroundColor: '#cce5ff',
                border: '1px solid #99cfff',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setShowAddPlan(prev => !prev)}
            >
              {showAddPlan ? '➖ Hide Add Plan' : '➕ Add Plan'}
            </button>
          )}

        </div>
      </div>

      <div style={{ flex: 2, marginLeft: 20 }}>
        <h3>Details</h3>
        {!selectedPlanId ? (
          <p>📌 Please choose a plan to view its contents.</p>
        ) : selectedPlanItems.length > 0 ? (
          <div>
            {section === 'exercise' ? (
              <ul>
                {selectedPlanItems.map((ex, idx) => (
                  <li key={idx}>
                    <strong>{ex.exercise_name}</strong><br />
                    {ex.reps != null && ex.set != null ? (
                      <>Reps: {ex.reps}, Sets: {ex.set}, Calories: {Math.round(ex.estimated_calories)} kcal</>
                    ) : (
                      <>Duration: {formatDuration(ex.duration_seconds)}, Calories: {Math.round(ex.estimated_calories)} kcal</>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <ul>
                {selectedPlanItems.map((meal, idx) => (
                  <li key={idx}>
                    <strong>{meal.meal_type}</strong>: {meal.food_name} – {meal.serving_size}g, {meal.calories} kcal
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p>⚠️ This plan has no items yet.</p>
        )}

      </div>

      {showAddPlan && section === 'exercise' && (
        <div style={{ marginTop: 30 }}>
          <AddExercise
            onSave={async (planData) => {
              try {
                const res = await fetch('/api/Db_connection', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    table: 'p_workoutplan',
                    action: 'save_plan',
                    data: {
                      member_ic: user.member_ic,
                      plan_name: planData.plan_name,
                      description: planData.description,
                      exercises: planData.exercises
                    }
                  })
                });

                const result = await res.json();
                if (res.ok && result.success) {
                  alert('✅ Plan saved!');
                  setShowAddPlan(false); // auto-hide
                  setSelectedPlanId(null); // reset selection
                  // refresh plan list
                  const updatedPlans = await fetch('/api/Db_connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      table: 'preset_workout_plan',
                      action: 'get_user_plans',
                      data: { member_ic: user.member_ic }
                    })
                  });
                  const newData = await updatedPlans.json();
                  if (Array.isArray(newData)) setExercisePlans(newData);
                } else {
                  console.error('❌ Save failed:', result);
                  alert('❌ Failed to save plan.');
                }
              } catch (err) {
                console.error('❌ Error saving:', err);
              }
            }}
          />
        </div>
      )}

    </div>

    
  );
}
