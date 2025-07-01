'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import NewcomerSetup from '../components/NewcomerSetup';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [isNewcomer, setIsNewcomer] = useState(false);
  const [foodPlans, setFoodPlans] = useState([]);
  const [planMeals, setPlanMeals] = useState({});
  const [selectedPlans, setSelectedPlans] = useState({});
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [tdee, setTdee] = useState(null);
  const [totalFoodCalories, setTotalFoodCalories] = useState(0);
  const [totalExerciseCalories, setTotalExerciseCalories] = useState(0);
  const [dailyGoalCalories, setDailyGoalCalories] = useState(0); 
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [recentComments, setRecentComments] = useState([]);

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
        if (data.tdee) {
          setTdee(data.tdee);
            const currentWeight = parseFloat(data.weight);
            const goalWeight = parseFloat(data.goal_weight);
            const diff = currentWeight - goalWeight;
            const totalCalorieDeficit = diff * 7700; // 7700 kcal per kg
            const dailyDeficit = totalCalorieDeficit / 30;

            const goal = Math.round(data.tdee - dailyDeficit);
            setDailyGoalCalories(goal > 0 ? goal : 0); // Prevent negatives
        }
      })
      .catch(err => console.error('❌ Error checking profile:', err));
  }, [router]);



  useEffect(() => {
    if (user) {
      fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'diet_plan',
          action: 'get_user_plans',
          data: { member_ic: user.member_ic }
        })
      })
        .then(res => res.json())
        .then(async plans => {
          setFoodPlans(plans || []);

          if (plans.length === 1) {
            setSelectedPlanId(plans[0].d_plan_id);
          }

          const mealsMap = {};

          for (const plan of plans) {
            const res = await fetch('/api/Db_connection', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                table: 'diet_plan_meal',
                action: 'get_plan_meals',
                data: { plan_id: plan.d_plan_id }
              })
            });

            const meals = await res.json();
            mealsMap[plan.d_plan_id] = meals;
          }

          setPlanMeals(mealsMap);
        })
        .catch(err => console.error('❌ Failed to fetch food plans:', err));
    }
  }, [user]);

  useEffect(() => {
  if (user) {
    fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'comment',
        action: 'get_post_comments_by_user',
        data: { member_ic: user.member_ic }
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('✅ Recent comments data:', data); // 👈 Add this
        setRecentComments(data || []);
      })
      .catch(err => console.error('❌ Failed to fetch comment notifications:', err));
  }
}, [user]);


  const handleCheckboxChange = (key, calories) => {
    const newSelected = {
      ...selectedPlans,
      [key]: !selectedPlans[key],
    };
    setSelectedPlans(newSelected);

    const total = Object.entries(planMeals).reduce((acc, [pid, meals]) => {
      meals.forEach((meal) => {
        const k = `${pid}-${meal.meal_type}-${meal.food_name}`;
        if (newSelected[k]) {
          acc += meal.calories;
        }
      });
      return acc;
    }, 0);

    setTotalCalories(total);
  };

  const renderPlanDetails = (planId) => {
    const meals = planMeals[planId] || [];

    const groupedMeals = meals.reduce((acc, meal) => {
      acc[meal.meal_type] = acc[meal.meal_type] || [];
      acc[meal.meal_type].push(meal);
      return acc;
    }, {});

    return (
      <div style={{ marginBottom: '20px' }}>
        {Object.entries(groupedMeals).map(([mealType, foods]) => (
          <div key={mealType} style={{ marginTop: '8px' }}>
            <strong>{mealType}</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '5px' }}>
              {foods.map((food) => {
                const foodKey = `${selectedPlanId}-${mealType}-${food.food_name}`;
                const isChecked = !!selectedPlans[foodKey];
                return (
                  <li key={foodKey}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(foodKey, food.calories)}
                        style={{ marginRight: '8px' }}
                      />
                      {food.food_name} – {food.serving_size}g – {food.calories} kcal
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  if (!user) return <p>Loading...</p>;
  if (isNewcomer) {
    return <NewcomerSetup user={user} setUser={setUser} setIsNewcomer={setIsNewcomer} />;
  }

return (
  <Layout>
    {exerciseStarted ? (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>🏋️ Exercise Mode Started</h2>
        <p>Focus on your workout now!</p>
        <button
          onClick={() => setExerciseStarted(false)}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          ⏹️ Stop Exercise
        </button>
      </div>
    ) : (
      <div style={{ display: 'flex', gap: '20px', paddingTop: '20px' }}>
        {/* 🥗 Food Plans – Left */}
        <div style={{ flex: 1, borderRight: '1px solid #ccc', paddingRight: '20px' }}>
          <h2>🥗 Food Plans</h2>

          {foodPlans.length === 0 ? (
            <p>You haven’t had a food plan. Let’s add one now!</p>
          ) : foodPlans.length === 1 ? (
            <div>
              <h4>{foodPlans[0].plan_name}</h4>
              {renderPlanDetails(foodPlans[0].d_plan_id)}
              <button
                onClick={() => router.push('/customizeplan')}
                style={{
                  margin: '10px 0',
                  padding: '6px 12px',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Customize Plan
              </button>
            </div>
          ) : (
            <>
              <label><strong>Select a food plan:</strong></label>
              <select
                value={selectedPlanId || ''}
                onChange={(e) => setSelectedPlanId(Number(e.target.value))}
                style={{ display: 'block', margin: '10px 0', padding: '5px' }}
              >
                <option value="" disabled>Select plan</option>
                {foodPlans.map(plan => (
                  <option key={plan.d_plan_id} value={plan.d_plan_id}>
                    {plan.plan_name}
                  </option>
                ))}
              </select>

              {selectedPlanId && renderPlanDetails(selectedPlanId)}
                            <button
                onClick={() => router.push('/customizeplan')}
                style={{
                  margin: '10px 0',
                  padding: '6px 12px',
                  backgroundColor: '#0070f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                }}
              >
                Customize Plan
              </button>
            </>
          )}
        </div>

        {/* 🧩 Middle – Summary */}
        <div style={{ flex: 1, padding: '0 20px', borderRight: '1px solid #ccc' }}>
          <h2>🧩 Daily Summary</h2>
          <p>You’ve consumed: <strong>{totalCalories} kcal</strong> from food today.</p>
          <p>🔥 You’ve burned <strong>{totalExerciseCalories} kcal</strong> through exercise.</p>
          <p>🎯 Your goal is to stay within <strong>{dailyGoalCalories} kcal</strong> for today.</p>

          <hr />

          <p>
            {totalFoodCalories - totalExerciseCalories > dailyGoalCalories
              ? '🚨 You’re over your calorie goal today. Try adjusting your intake or activity.'
              : '✅ You’re on track with your calorie goal. Keep it up!'}
          </p>

          <button
            onClick={() => setExerciseStarted(true)}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#ff6f00',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            ▶️ Start Exercise
          </button>
        </div>

        {/* 🔔 Notifications – Right */}
        {/* 🔔 Notifications – Right */}
        <div style={{ flex: 1, paddingLeft: '20px' }}>
          <h2>🔔 Notifications</h2>

          {Array.isArray(recentComments) ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {recentComments.length === 0 ? (
                <li>No one has commented on your posts yet.</li>
              ) : (
                recentComments.map((comment, index) => (
                  <li key={index} style={{ marginBottom: '12px' }}>
                     💬 <strong>{comment.commenter_name}</strong> said: "{comment.content}"<br />
                    “{comment.content}”
                    <br />
                    <small style={{ color: '#888' }}>
                      {new Date(comment.created_at).toLocaleString()}
                    </small>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p style={{ color: 'red' }}>⚠️ Failed to load comments</p>
          )}

          <button
            onClick={() => router.push('/community')}
            style={{
              marginTop: '15px',
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
            }}
          >
            Explore Now
          </button>
        </div>

      </div>
    )}
  </Layout>
);

}
