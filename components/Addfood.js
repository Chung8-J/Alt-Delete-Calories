'use client';
import { useEffect, useState } from 'react';

export default function AddFood({ initialData, onPlanSaved }) {

  // Initialize meals with default 3 brackets or from initialData
  
  const [planName, setPlanName] = useState(initialData?.plan_name || '');
  const [planDesc, setPlanDesc] = useState(initialData?.description || '');
  const [meals, setMeals] = useState(initialData?.meals || [
    { meal: 'Breakfast', foods: [{ food_code: '', serving_size: '' }] },
    { meal: 'Lunch', foods: [{ food_code: '', serving_size: '' }] },
    { meal: 'Dinner', foods: [{ food_code: '', serving_size: '' }] },
  ]);

  const [snackVisible, setSnackVisible] = useState(
    initialData?.meals?.some(m => m.meal === 'Snack') || false
  );


  

  // Add Snack meal bracket when snackVisible is true but not already in meals
  useEffect(() => {
    if (snackVisible && !meals.some(m => m.meal === 'Snack')) {
      setMeals(prev => [...prev, { meal: 'Snack', foods: [{ food_code: '', serving_size: '' }] }]);
    }
    // If snackVisible is false and Snack exists in meals, remove it
    if (!snackVisible && meals.some(m => m.meal === 'Snack')) {
      setMeals(prev => prev.filter(m => m.meal !== 'Snack'));
    }
  }, [snackVisible, meals]);

  const [foods, setFoods] = useState([]);

  useEffect(() => {
    const fetchFoods = async () => {
      const res = await fetch('/api/Fetch_food');
      const data = await res.json();
      if (Array.isArray(data)) setFoods(data);
      else console.error('Unexpected food data:', data);
    };
    fetchFoods();
  }, []);

  const handleAddFood = (mealIndex) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].foods.push({ food_code: '', serving_size: '' });
    setMeals(updatedMeals);
  };

  const handleFoodChange = (mealIndex, foodIndex, field, value) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].foods[foodIndex][field] = value;
    setMeals(updatedMeals);
  };

  const handleRemoveFood = (mealIndex, foodIndex) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].foods.splice(foodIndex, 1);
    setMeals(updatedMeals);
  };

   const handleSubmit = async () => {
  if (!planName.trim()) return alert('❌ Enter plan name');

  const totalFoods = meals.reduce((sum, meal) => sum + meal.foods.length, 0);
  if (totalFoods === 0) return alert('❌ Add at least one food item');

  for (const meal of meals) {
    for (const food of meal.foods) {
      if (!food.food_code) return alert(`❌ Select food for ${meal.meal}`);
      if (!food.serving_size || isNaN(food.serving_size) || food.serving_size <= 0)
        return alert(`❌ Enter valid serving size for ${meal.meal}`);
    }
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user?.member_ic) return alert('❌ No user found in localStorage');

    let totalCalories = 0;

    const mealsWithDetails = meals.map(meal => {
    const foodsWithDetails = meal.foods.map(f => {
        const foodData = foods.find(fd => fd.food_code === parseInt(f.food_code));
        const caloriesPerGram = foodData ? (foodData.calories / 100) : 0;
        const totalCal = parseFloat(f.serving_size) * caloriesPerGram;

        totalCalories += totalCal; // ✅ ADD IT HERE

        return {
        food_code: parseInt(f.food_code),
        serving_size: parseInt(f.serving_size),
        calories: Math.round(totalCal),
        };
    });

    return {
        meal: meal.meal,
        foods: foodsWithDetails
    };
    });



  try {
        const res = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            table: 'diet_plan',
            action: 'save_diet_plan_custom', // ← ✅ use this
            data: {
            member_ic: user.member_ic,
            plan_name: planName,
            total_calories: Math.round(totalCalories),
            meals: mealsWithDetails
            }
        })
        });


    const result = await res.json();
    if (res.ok) {
      alert('✅ Plan saved successfully!');
      // Optional: clear form
      setPlanName('');
      setPlanDesc('');
      setMeals([
        { meal: 'Breakfast', foods: [{ food_code: '', serving_size: '' }] },
        { meal: 'Lunch', foods: [{ food_code: '', serving_size: '' }] },
        { meal: 'Dinner', foods: [{ food_code: '', serving_size: '' }] },
      ]);
        setSnackVisible(false);

    if (typeof onPlanSaved === 'function') {
        onPlanSaved(); // ✅ Notify parent to refresh
    }

    } else {
      console.error(result);
      alert('❌ Failed to save plan');
    }
  } catch (err) {
    console.error('❌ Server error:', err);
    alert('❌ Server error');
  }
};



   return (
  <div style={{ padding: 20 }}>
    <h3>Add Food Plan</h3>

    <label style={{ fontWeight: 'bold' }}>Plan Name:</label>
    <input
      value={planName}
      onChange={e => setPlanName(e.target.value)}
      placeholder="Enter plan name"
      style={{
        width: '100%',
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginBottom: 15,
        marginTop: 10,
        fontSize: '14px'
      }}
    />

    <label style={{ fontWeight: 'bold' }}>Description:</label>
    <textarea
      value={planDesc}
      onChange={e => setPlanDesc(e.target.value)}
      placeholder="Enter plan description"
      style={{
        resize: 'none',
        width: '100%',
        height: 80,
        padding: '8px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginBottom: 20,
        marginTop: 10,
        fontSize: '14px'
      }}
    />

    {meals.map((meal, mealIdx) => (
      <div
        key={meal.meal}
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: 24,
          backgroundColor: '#f9f9f9'
          ,  color:'black'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0 }}>{meal.meal}</h4>
          {meal.meal === 'Snack' && (
            <button
              type="button"
              onClick={() => setSnackVisible(false)}
              style={{
                background: '#ffdddd',
                border: '1px solid red',
                color: 'red',
                cursor: 'pointer',
                padding: '4px 10px',
                fontSize: '0.85rem',
                borderRadius: '4px'
              }}
            >
              ✖ Remove Bracket
            </button>
          )}
        </div>

        {meal.foods.length === 0 && (
          <p style={{ fontStyle: 'italic', color: '#999' }}>No foods added yet</p>
        )}

        {meal.foods.map((food, foodIdx) => (
          <div
            key={foodIdx}
            style={{
              position: 'relative',
              marginBottom: 15,
              marginTop: foodIdx > 0 ? 20 : 10,
              paddingTop: foodIdx > 0 ? 10 : 0,
              borderTop: foodIdx > 0 ? '1px dashed #ccc' : 'none'
            }}
          >
            {foodIdx > 0 && (
              <button
                type="button"
                onClick={() => handleRemoveFood(mealIdx, foodIdx)}
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 0,
                  background: '#ffdddd',
                  border: '1px solid red',
                  color: 'red',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  fontSize: '0.85rem',
                  borderRadius: '4px',

                }}
              >
                ✖ Remove
              </button>
            )}

            <label style={{ fontWeight: 'bold',  color:'black'}}>Food:</label>
            <select
              value={food.food_code}
              onChange={e => handleFoodChange(mealIdx, foodIdx, 'food_code', e.target.value)}
              style={{
                width: '100%',
                marginBottom: 10,
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                marginTop:10
              }}
            >
              <option value="">Select Food</option>
              {foods.map(f => (
                <option key={f.food_code} value={f.food_code}>
                  {f.food_name}
                </option>
              ))}
            </select>

            <label style={{ fontWeight: 'bold',  color:'black' }}>Serving Size (grams):</label>
            <input
              type="number"
              value={food.serving_size}
              onChange={e => handleFoodChange(mealIdx, foodIdx, 'serving_size', e.target.value)}
              style={{
                width: '100%',
                padding: '6px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                marginTop:10
              }}
            />
          </div>
        ))}

        <button
          type="button"
          onClick={() => handleAddFood(mealIdx)}
          style={{
            padding: '6px 12px',
            cursor: 'pointer',
            border: '1px solid #73d28d',
            background: '#e8fce9',
            borderRadius: '4px',
            fontWeight: 'bold',
            marginTop: 10
          }}
        >
          Add Food
        </button>
      </div>
    ))}

    {!snackVisible && (
      <button
        type="button"
        onClick={() => setSnackVisible(true)}
        style={{
          padding: '8px 14px',
          cursor: 'pointer',
          fontWeight: 'bold',
          border: '1px solid #ccc',
          background: '#f4f4f4',
          borderRadius: '4px',
          marginBottom: 20
        }}
      >
        ➕ Add Snack
      </button>
    )}
<br />


    <button
      type="button"
      onClick={handleSubmit}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        fontWeight: 'bold',
        border: 'none',
        background: '#4CAF50',
        color: 'white',
        borderRadius: '6px'
      }}
    >
      Save Food Plan
    </button>
  </div>
);

}
