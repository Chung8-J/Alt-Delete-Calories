'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AddExercise from '@/components/Addexercise';
import AddFood from '@/components/Addfood';
import Layout from '../components/Layout';
import '../style/customizeplan.css';

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
  const [exercises, setExercises] = useState([]);
  const [showAddFoodPlan, setShowAddFoodPlan] = useState(false);
  const [addFoodMode, setAddFoodMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editPlanData, setEditPlanData] = useState(null); // contains meals, name, etc.
  const [allFoods, setAllFoods] = useState([]); // for dropdowns
  const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];


  const getCaloriesPerFood = (foodName) => {
    const food = allFoods.find(f => f.food_name === foodName);
    return food ? food.calories_per_100g : 0;
  };

  const calculateTotalCalories = () => {
    let total = 0;
    editPlanData.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        const caloriesPer100g = getCaloriesPerFood(food.food_name);
        const servingSize = parseFloat(food.serving_size);
        if (!isNaN(servingSize)) {
          total += (servingSize / 100) * caloriesPer100g;
        }
      });
    });
    return Math.round(total);
  };


  function groupMeals(flatMeals) {
    const mealMap = {};
    flatMeals.forEach(item => {
      const { meal_type, food_name, serving_size, calories } = item;
      if (!mealMap[meal_type]) mealMap[meal_type] = [];
      mealMap[meal_type].push({ food_name, serving_size, calories });
    });
    return Object.entries(mealMap).map(([meal, foods]) => ({ meal, foods }));
  }

  useEffect(() => {
    const fetchFoods = async () => {
      const res = await fetch('/api/Fetch_food');
      const data = await res.json();
      if (Array.isArray(data)) setAllFoods(data);
    };
    fetchFoods();
  }, []);


  useEffect(() => {
    const fetchExercises = async () => {
      const res = await fetch('/api/Fetch_exercise');
      const data = await res.json();
      if (Array.isArray(data)) setExercises(data);
      else console.error('Unexpected exercise data:', data);
    };
    fetchExercises();
  }, []);

  const fetchFoodPlans = async () => {
    try {
      const res = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'diet_plan',
          action: 'get_plans',
          data: { member_ic: JSON.parse(localStorage.getItem('user')).member_ic }
        }),
      });
      const data = await res.json();
      if (res.ok) setFoodPlans(data.plans || []);
      else console.error('Failed to fetch food plans');
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (section === 'food') fetchFoodPlans();
  }, [section]);

  useEffect(() => {
    if (user) fetchPlans();
  }, [user, showAddFoodPlan]); // rerun when form visibility changes


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
        mode: (ex.reps && ex.set) ? 'reps_sets' : 'duration'

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

  const groupedMeals = section === 'food' ? groupMeals(selectedPlanItems) : null;

  const groupedMealsSorted = groupedMeals?.sort(
    (a, b) => mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal)
  );


  const sortedMeals = editPlanData?.meals?.slice().sort(
    (a, b) => mealOrder.indexOf(a.meal) - mealOrder.indexOf(b.meal)
  );
  return (
    <Layout>
      <div
        style={{
          display: 'flex',
          padding: 20,
          justifyContent: showAddPlan ? 'center' : 'flex-start',

        }}
        className="customize-plan-container"
      >
        {/* Sidebar */}
        <div style={{ flex: 1 }} className="scrollable-section-sidebar ustomize-sidebar">
          <h2>Customize Plan</h2>
          <button
            className={`exercisefood-btn ${section === 'exercise' ? 'selected' : ''}`}
            onClick={() => {
              setSection('exercise');
              setSelectedPlanId(null);
              setShowAddPlan(false);
              setIsEditing(false);
              setShowAddFoodPlan(false);
              setEditMode(false);
            }}
          >
            Exercise Plan
          </button>

          <button
            className={`exercisefood-btn ${section === 'food' ? 'selected' : ''}`}
            onClick={() => {
              setSection('food');
              setSelectedPlanId(null);
              setShowAddPlan(false);
              setIsEditing(false);
              setShowAddFoodPlan(false);
              setEditMode(false);
            }}
          >
            Food Plan
          </button>


          <div style={{ marginTop: 20, maxWidth: 200 }} className="plan-list">

            <h4 >{section === 'exercise' ? 'Your Exercise Plans' : 'Your Food Plans'}</h4>
            <ul style={{ listStyle: 'none', padding: 0 }} className="plan-list-ul">
              {(section === 'exercise' ? exercisePlans : foodPlans).map(plan => {
                const key = section === 'exercise' ? 'p_workoutplan_id' : 'd_plan_id';
                return (
                  <li key={plan[key]}>
                    <button
                      className={`plan-select-button ${plan[key] === selectedPlanId ? 'selected' : ''}`}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: plan[key] === selectedPlanId ? '#e0eaff' : 'transparent',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        color: plan[key] === selectedPlanId ? 'black' : 'white'
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
                className="toggle-add-plan-btn"
                style={{
                  marginTop: 10,
                  padding: '8px',
                  width: '100%',
                  backgroundColor: '50DA00',
                  border: '1px solid #99cfff',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setShowAddPlan(prev => !prev);
                  setShowAddFoodPlan(false);   // hide food add form if open
                  setIsEditing(false);
                  setSelectedPlanId(null);
                }}
              >
                {showAddPlan ? '➖ Hide Add Exercise Plan' : '➕ Add Exercise Plan'}
              </button>
            )}

            {section === 'food' && (
              <button
                className="toggle-add-plan-btn"
                style={{
                  marginTop: 10,
                  padding: '8px',
                  width: '100%',
                  backgroundColor: '#d4f0d4',
                  border: '1px solid #8fce8f',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setShowAddFoodPlan(prev => !prev);
                  setShowAddPlan(false);  // hide exercise add form if open
                  setIsEditing(false);
                  setSelectedPlanId(null);
                  setSelectedPlan(null);
                  setSelectedPlanItems([]);
                }}
              >
                {showAddFoodPlan ? '➖ Hide Add Food Plan' : '➕ Add Food Plan'}
              </button>
            )}
          </div>

        </div>

        {/* Main Content */}

        <div style={{ flex: 2, marginLeft: 20 }} className="customize-main-content">
          <h3>Details</h3>

          {showAddPlan ? (
            <div style={{ width: '100%', maxWidth: '600px' }} className="scrollable-section add-plan-form">
              <AddExercise
                onSave={async (planData) => {
                  try {
                    const res = await fetch('/api/Db_connection', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        table: 'preset_workout_plan',
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


          ) : showAddFoodPlan ? (
            // AddFood form, similar to AddExercise
            <div style={{ width: '100%', maxWidth: '600px' }} className="scrollable-section add-plan-form">
              <AddFood
                onPlanSaved={() => {
                  fetchFoodPlans();        // 🔄 refresh sidebar list
                  setShowAddFoodPlan(false); // ✅ hide the form
                  setSelectedPlanId(null);   // optional resets
                  setSelectedPlan(null);
                  setSelectedPlanItems([]);
                }}
              />



            </div>
          ) : !selectedPlanId && !isEditing ? (
            <p> Please choose a plan to view its contents.</p>
          ) : isEditing ? (
            <div className="scrollable-section edit-plan-form">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '545px' }}>
                <label style={{ fontWeight: 'bold' }}>Plan Name:</label>
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

                <label style={{ fontWeight: 'bold' }}>Description:</label>
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
              <h4 style={{ marginTop: '10px' }}>Exercises:</h4>
              {editData.exercises.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '16px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#f9f9f9',
                    maxWidth: '520px',
                    width: '100%',
                    position: 'relative' // 
                  }}
                >
                  {/* Remove button */}
                  {editData.exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...editData.exercises];
                        updated.splice(idx, 1);
                        setEditData(prev => ({ ...prev, exercises: updated }));
                      }}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: '#ffdddd',
                        border: '1px solid red',
                        color: 'red',
                        borderRadius: '4px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✖
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontWeight: 'bold', marginBottom: '4px', display: 'block' }}>Exercise:</label>
                      <select
                        value={ex.exercise_id || ''}
                        onChange={e => updateExerciseField(idx, 'exercise_id', e.target.value)}
                        style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="">-- Select Exercise --</option>
                        {exercises.map((e) => (
                          <option key={e.exercise_id} value={e.exercise_id}>
                            {e.exercise_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newMode = ex.mode === 'reps_sets' ? 'duration' : 'reps_sets';
                        setEditData(prev => {
                          const updated = [...prev.exercises];
                          updated[idx] = {
                            ...updated[idx],
                            mode: newMode,
                            ...(newMode === 'duration' ? { reps: '', set: '' } : { duration_seconds: '' })
                          };
                          return { ...prev, exercises: updated };
                        });
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #bbb',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {ex.mode === 'reps_sets' ? 'Switch to Duration' : 'Switch to Reps+Sets'}
                    </button>
                  </div>



                  {ex.mode === 'reps_sets' ? (
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
                            borderRadius: '4px'
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

              <button
                type="button"
                onClick={() => {
                  const newExercise = {
                    exercise_id: '',
                    exercise_name: 'New Exercise',
                    mode: 'duration',
                    duration_seconds: '',
                    reps: '',
                    set: ''
                  };
                  setEditData(prev => ({
                    ...prev,
                    exercises: [...prev.exercises, newExercise]
                  }));
                }}
                style={{
                  marginTop: '10px',
                  backgroundColor: '#d9fadd',
                  border: '1px solid #73d28d',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Add Exercise
              </button>

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
                  Save
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
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : section === 'food' && editMode ? (
            <div style={{ flex: 1 }} className="scrollable-section edit-food-plan-form">
              <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 20, marginTop: 20, backgroundColor: '#f9f9f9' }}>
                <h3 style={{ marginBottom: 20, color: 'black' }}>Edit Food Plan</h3>

                <label style={{ fontWeight: 'bold', color: 'black' }}>Plan Name:</label>
                <input
                  value={editPlanData.plan_name}
                  onChange={(e) => setEditPlanData({ ...editPlanData, plan_name: e.target.value })}
                  style={{
                    width: '100%',
                    marginBottom: 20,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px'
                  }}
                />

                {sortedMeals.map((meal, mealIdx) => (
                  <div key={meal.meal} style={{
                    marginBottom: 24,
                    padding: 16,
                    backgroundColor: '#ffffff',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                    , color: 'black'
                  }}>
                    <h4 style={{ marginBottom: 12 }}>{meal.meal}</h4>

                    {meal.foods.map((food, foodIdx) => (
                      <div key={foodIdx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: 12,
                        position: 'relative'
                      }}>
                        <select
                          value={food.food_name}
                          onChange={(e) => {
                            const newMeals = [...editPlanData.meals];
                            newMeals[mealIdx].foods[foodIdx].food_name = e.target.value;
                            setEditPlanData({ ...editPlanData, meals: newMeals });
                          }}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                          }}
                        >
                          <option value="">Select Food</option>
                          {allFoods.map((f) => (
                            <option key={f.food_code} value={f.food_name}>
                              {f.food_name}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          placeholder="Serving size"
                          value={food.serving_size}
                          onChange={(e) => {
                            const newMeals = [...editPlanData.meals];
                            newMeals[mealIdx].foods[foodIdx].serving_size = e.target.value;
                            setEditPlanData({ ...editPlanData, meals: newMeals });
                          }}
                          style={{
                            width: '120px',
                            padding: '6px',
                            borderRadius: '4px',
                            border: '1px solid #ccc'
                          }}
                        />

                        <button
                          onClick={() => {
                            const newMeals = [...editPlanData.meals];
                            const originalMealIdx = newMeals.findIndex(m => m.meal === meal.meal);
                            if (originalMealIdx !== -1) {
                              newMeals[originalMealIdx].foods.splice(foodIdx, 1);
                              setEditPlanData({ ...editPlanData, meals: newMeals });
                            }
                          }}
                          style={{
                            backgroundColor: '#ffdddd',
                            border: '1px solid red',
                            color: 'red',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    <button
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        background: '#e8fce9',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}

                      onClick={() => {
                        const newMeals = [...editPlanData.meals];
                        const originalMealIdx = newMeals.findIndex(m => m.meal === meal.meal);
                        if (originalMealIdx !== -1) {
                          newMeals[originalMealIdx].foods.push({
                            food_name: '',
                            serving_size: '',
                            calories: 0,
                          });
                          setEditPlanData({ ...editPlanData, meals: newMeals });
                        }
                      }}
                    >
                      Add Food
                    </button>

                  </div>
                ))}

                <button
                  onClick={async () => {
                    const user = JSON.parse(localStorage.getItem('user'));

                    const meals = editPlanData.meals.map((meal) => ({
                      meal: meal.meal,
                      foods: meal.foods
                        .map((f) => {
                          const matched = allFoods.find(food => food.food_name === f.food_name);
                          if (!matched) return null;
                          return {
                            food_code: matched.food_code,
                            serving_size: parseInt(f.serving_size, 10),
                            calories: 0
                          };
                        })
                        .filter(f => f !== null)
                    }));

                    const res = await fetch('/api/Db_connection', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        table: 'diet_plan',
                        action: 'update_diet_plan',
                        data: {
                          d_plan_id: selectedPlanId,
                          plan_name: editPlanData.plan_name,
                          meals
                        }
                      })
                    });

                    const result = await res.json();
                    if (res.ok && result.success) {
                      alert('Plan updated successfully!');
                      setEditMode(false);
                      fetchFoodPlans();
                      window.location.reload();
                    } else {
                      alert('Failed to update plan.');
                      console.error(result);
                    }
                  }}
                  style={{
                    marginTop: 20,
                    padding: '10px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Update Plan
                </button>

                <button
                  onClick={() => {
                    setEditMode(false);
                    setEditPlanData(null);
                  }}
                  style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginLeft: '10px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="plan-details">
              <h4 className='Planname'>
                Plan Name: {selectedPlan?.plan_name || (section === 'food' ? 'Unnamed Food Plan' : 'Unnamed Plan')}
              </h4>

              {/* Show description only for exercise plans */}
              {section === 'exercise' && selectedPlan?.description && (
                <p>Description: {selectedPlan.description}</p>
              )}
              {selectedPlanItems.length > 0 ? (
                section === 'exercise' ? (
                  <div className="scrollable-section">
                    {selectedPlanItems.map((ex, idx) => (
                      <div key={idx} style={{ marginBottom: '16px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '19px', paddingBottom: '8px', marginTop: '5px' }}>{ex.exercise_name}</div>
                        <div style={{ fontWeight: 'normal', fontSize: '19px', marginLeft: '8px', paddingBottom: '8px' }}>
                          {ex.reps != null && ex.set != null ? (
                            <>
                              Reps: {ex.reps}, Sets: {ex.set} <br />
                              Calories: {Math.round(ex.estimated_calories)} kcal
                            </>
                          ) : (
                            <>
                              Duration: {formatDuration(ex.duration_seconds)} <br />
                              Calories: {Math.round(ex.estimated_calories)} kcal
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (
                  <div>
                    {groupedMeals.map((mealGroup, idx) => (
                      <div key={idx} style={{ marginBottom: '20px' }}>
                        <h4>{mealGroup.meal}</h4>
                        <ul style={{ marginTop: '6px', paddingLeft: '16px' }}>
                          {mealGroup.foods.map((food, i) => (
                            <li key={i}>
                              {food.food_name} — {food.serving_size}g — {food.calories} kcal
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p>⚠️ {section === 'exercise' ? 'This plan has no exercises yet.' : 'This food plan has no meals yet.'}</p>
              )}


              <div style={{ marginTop: 10 }} className='editdelete-btn'>
                {section === 'exercise' && (
                  <button onClick={startEditing} style={{ marginRight: 10 }} className="editdelete-btn confirm">
                    Edit Plan
                  </button>
                )}

                {section === 'food' && (
                  <button
                    className="editdelete-btn confirm"
                    onClick={() => {
                      setEditMode(true); // make sure this state exists
                      setEditPlanData({
                        plan_id: selectedPlan.d_plan_id,
                        plan_name: selectedPlan.plan_name,
                        meals: groupMeals(selectedPlanItems), // you should define groupMeals as earlier
                      });
                    }}
                    style={{ marginRight: 10 }}
                  >
                    Edit Plan
                  </button>
                )}

                <button
                  className="editdelete-btn cancel"
                  onClick={async () => {
                    if (!confirm('Are you sure you want to delete this plan?')) return;

                    const tableName = section === 'exercise' ? 'p_workoutplan' : 'diet_plan';

                    const res = await fetch('/api/Db_connection', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        table: tableName,
                        action: 'delete_plan',
                        data: { plan_id: selectedPlanId },
                      }),
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
                  Delete Plan
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
    </Layout>
  );
}


