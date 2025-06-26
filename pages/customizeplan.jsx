'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddExercise from '@/components/Addexercise';

export default function CustomizePlan() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('exercise');
  const [exercisePlans, setExercisePlans] = useState([]);
  const [foodPlans, setFoodPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedPlanItems, setSelectedPlanItems] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored?.member_ic) {
      router.push('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const fetchPlans = async () => {
    try {
      const exRes = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'preset_workout_plan',
          action: 'get_user_plans',
          data: { member_ic: user.member_ic },
        }),
      });

      const fdRes = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'diet_plan',
          action: 'get_user_plans',
          data: { member_ic: user.member_ic },
        }),
      });

      if (exRes.ok) {
        const exData = await exRes.json();
        setExercisePlans(Array.isArray(exData) ? exData : []);
      }

      if (fdRes.ok) {
        const fdData = await fdRes.json();
        setFoodPlans(Array.isArray(fdData) ? fdData : []);
      }
    } catch (err) {
      console.error('❌ Fetch failed:', err);
    }
  };

  useEffect(() => {
    if (user) fetchPlans();
  }, [user]);

  const selectPlan = async (planId) => {
    const planList = section === 'exercise' ? exercisePlans : foodPlans;
    const key = section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id';
    const planObj = planList.find(plan => plan[key] === planId);

    setSelectedPlanId(planId);
    setSelectedPlan(planObj);
    setIsEditing(false);

    const table = section === 'exercise' ? 'preset_workout_exercise' : 'diet_plan_meal';
    const action = section === 'exercise' ? 'get_plan_exercises' : 'get_plan_meals';

    try {
      const res = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, action, data: { plan_id: planId } }),
      });

      const text = await res.text();
      if (!res.ok) return console.error('❌ Error:', text);

      const data = JSON.parse(text);
      setSelectedPlanItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Fetch failed:', err);
    }
  };

  const startEditing = () => {
  setEditData({
    plan_name: selectedPlan.plan_name,
    description: selectedPlan.description,
    exercises: selectedPlanItems.map(ex => ({
      exercise_id: ex.exercise_id, // ✅ Must be passed
      exercise_name: ex.exercise_name,
      duration_seconds: ex.duration_seconds || '',
      reps: ex.reps || '',
      set: ex.set || '',
      mode: ex.duration_seconds ? 'duration' : 'reps_sets'
    }))
  });
  setIsEditing(true);
};


  const saveEdit = async () => {
    try {
      const res = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'p_workoutplan',
          action: 'update_plan',
          data: {
            plan_id: selectedPlanId,
            plan_name: editData.plan_name,
            description: editData.description,
            exercises: editData.exercises
          }
        })
      });

      const result = await res.json();

      console.log('🔍 update_plan response:', result);  //
      if (res.ok && result.success) {
        alert('✅ Plan updated!');
        setIsEditing(false);
        setSelectedPlanId(null);
        await fetchPlans();
      } else {
        alert('❌ Update failed.');
      }
    } catch (err) {
      console.error('❌ Update error:', err);
    }
  };

  const updateExerciseField = (idx, key, value) => {
    setEditData(prev => {
      const updated = [...prev.exercises];
      updated[idx] = { ...updated[idx], [key]: value };
      return { ...prev, exercises: updated };
    });
  };

  return (
    <div style={{ display: 'flex', padding: 20 }}>
      {/* Sidebar */}
      <div style={{ flex: 1 }}>
        <h2>📋 Customize Plan</h2>
        <button onClick={() => { setSection('exercise'); setSelectedPlanId(null); }}>Exercise Plan</button>
        <button onClick={() => { setSection('food'); setSelectedPlanId(null); }} style={{ marginLeft: 10 }}>Food Plan</button>

        <div style={{ marginTop: 20, maxWidth: 200 }}>
          <h4>{section === 'exercise' ? 'Your Exercise Plans' : 'Your Food Plans'}</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {(section === 'exercise' ? exercisePlans : foodPlans).map(plan => {
              const key = section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id';
              return (
                <li key={plan[key]}>
                  <button
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: plan[key] === selectedPlanId ? '#e0eaff' : 'transparent',
                      border: 'none',
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                    onClick={() => selectPlan(plan[key])}
                  >
                    {plan.plan_name}
                  </button>
                </li>
              );
            })}
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
              onClick={() => {
                setShowAddPlan(true);
                setIsEditing(false);
                setSelectedPlanId(null);
              }}
            >
              {showAddPlan ? '➖ Hide Add Plan' : '➕ Add Plan'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 2, marginLeft: 20 }}>
        <h3>Details</h3>
        {!selectedPlanId ? (
          <p>📌 Please choose a plan to view its contents.</p>
        ) : isEditing ? (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '545px' }}>
              <label style={{ fontWeight: 'bold' }}>📝 Plan Name:</label>
              <input
                type="text"
                value={editData.plan_name}
                onChange={(e) => setEditData(prev => ({ ...prev, plan_name: e.target.value }))}
                placeholder="Enter plan name"
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />

              <label style={{ fontWeight: 'bold' }}>📄 Description:</label>
              <textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
                rows={4}
                style={{
                  padding: '8px',
                  fontSize: '14px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  resize: 'none'
                }}
              />
            </div>
            <h4 style={{ marginTop: '10px' }}>🏋️‍♀️ Exercises:</h4>
            {editData.exercises.map((ex, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '16px',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: '#f9f9f9',

                  maxWidth: '520px',      // ✅ limit width
                width: '100%'
                
                }}
              >
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                  {ex.exercise_name}
                </label>

                {ex.reps && ex.set ? (
                  <div style={{ display: 'flex', gap: '30px', maxWidth: '500px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px' }}>Reps:</label>
                      <input
                        type="number"
                        value={ex.reps}
                        onChange={e => updateExerciseField(idx, 'reps', e.target.value)}
                        placeholder="Reps"
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          length:'80px'
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '13px' }}>Sets:</label>
                      <input
                        type="number"
                        value={ex.set}
                        onChange={e => updateExerciseField(idx, 'set', e.target.value)}
                        placeholder="Sets"
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '14px',
                          border: '1px solid #ccc',
                          borderRadius: '4px'
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ maxWidth: '500px' }}>
                    <label style={{ fontSize: '13px' }}>Duration (seconds):</label>
                    <input
                      type="number"
                      value={ex.duration_seconds}
                      onChange={e => updateExerciseField(idx, 'duration_seconds', e.target.value)}
                      placeholder="Duration (seconds)"
                      style={{
                        width: '100%',
                        padding: '8px',
                        fontSize: '14px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={saveEdit}
              style={{
                padding: '8px 12px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              💾 Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              style={{
                padding: '8px 12px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
          </div>
        ) : (
          <div>
            <h4>📝 Plan Name: {selectedPlan?.plan_name || 'Unnamed Plan'}</h4>
            {selectedPlan?.description && <p>📄 Description: {selectedPlan.description}</p>}
            {selectedPlanItems.length > 0 ? (
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
              <p>⚠️ This plan has no items yet.</p>
            )}
            <div style={{ marginTop: 10 }}>
              <button onClick={startEditing} style={{ marginRight: 10 }}>✏️ Edit Plan</button>
              <button
                style={{ backgroundColor: '#ffcccc', border: '1px solid #cc0000', borderRadius: 4, padding: '5px 10px' }}
                onClick={async () => {
                  if (!confirm('Are you sure you want to delete this plan?')) return;

                  const res = await fetch('/api/Db_connection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      table: 'p_workoutplan',
                      action: 'delete_plan',
                      data: { plan_id: selectedPlanId }
                    })
                  });

                  const result = await res.json();
                  if (res.ok && result.success) {
                    alert('🗑️ Deleted!');
                    setSelectedPlanId(null);
                    setSelectedPlan(null);
                    setSelectedPlanItems([]);
                    await fetchPlans();
                  } else {
                    alert('❌ Delete failed.');
                  }
                }}
              >
                🗑️ Delete Plan
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Plan */}
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
                  setShowAddPlan(false);
                  setSelectedPlanId(null);
                  await fetchPlans();
                } else {
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
