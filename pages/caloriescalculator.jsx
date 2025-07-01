'use client';

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function CaloriesCalculator() {
  const [section, setSection] = useState('tdee');
  const [tdeeInput, setTdeeInput] = useState({ gender: '', weight: '', height: '', age: '', activity: '1.2' });
  const [tdeeResult, setTdeeResult] = useState(null);

  const [foodList, setFoodList] = useState([]);
  const [foodRows, setFoodRows] = useState([{ food_code: '', grams: '' }]);
  const [calculatedFoods, setCalculatedFoods] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);


  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(u);
  }, []);

  useEffect(() => {
    fetch('/api/Fetch_food')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFoodList(data);
        } else {
          console.error('Food API did not return an array:', data);
        }
      })
      .catch(err => console.error('Failed to fetch food list:', err));
  }, []);

  const calculateTDEE = () => {
    const { gender, weight, height, age, activity } = tdeeInput;
    if (!gender || !weight || !height || !age) return alert('Please fill in all fields.');

    const bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;
    const tdee = Math.round(bmr * parseFloat(activity));
    setTdeeResult(tdee);
  };

  const handleAddRow = () => {
    setFoodRows([...foodRows, { food_code: '', grams: '' }]);
  };

  const handleFoodChange = (index, key, value) => {
    const updated = [...foodRows];
    updated[index][key] = value;
    setFoodRows(updated);
  };

  const calculateFoodCalories = () => {
    const results = foodRows.map(row => {
      const food = foodList.find(f => f.food_code === parseInt(row.food_code));
      if (!food || !row.grams) return null;

      const grams = parseFloat(row.grams);
      const totalCalories = Math.round((food.calories / 100) * grams);

      return {
        ...food,
        grams,
        totalCalories
      };
    }).filter(Boolean);

    setCalculatedFoods(results);
  };

  const totalCalories = calculatedFoods.reduce((sum, f) => sum + f.totalCalories, 0);

  const container = {
    maxWidth: '600px',
    margin: 'auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginTop: '20px'
  };

  return (
    <div style={{ padding: 20 }}>

        <h1>Calories Calculator</h1>

        <a href={currentUser?.role === 'admin' ? '/adminhome' : '/userhome'}>Back</a><br /><br />

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <button onClick={() => setSection('tdee')}>TDEE Calculator</button>
        <button onClick={() => setSection('food')} style={{ marginLeft: '10px' }}>Food Calculator</button>
      </div>

      {section === 'tdee' && (
        <div style={container}>
          <h2>TDEE Calculator</h2>
          <label>Gender:</label>
          <select value={tdeeInput.gender} onChange={e => setTdeeInput({ ...tdeeInput, gender: e.target.value })}>
            <option value="">-- Select --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select><br /><br />

          <label>Weight (kg):</label>
          <input type="number" value={tdeeInput.weight} onChange={e => setTdeeInput({ ...tdeeInput, weight: e.target.value })} /><br /><br />

          <label>Height (cm):</label>
          <input type="number" value={tdeeInput.height} onChange={e => setTdeeInput({ ...tdeeInput, height: e.target.value })} /><br /><br />

          <label>Age:</label>
          <input type="number" value={tdeeInput.age} onChange={e => setTdeeInput({ ...tdeeInput, age: e.target.value })} /><br /><br />

          <label>Activity Level:</label>
          <select value={tdeeInput.activity} onChange={e => setTdeeInput({ ...tdeeInput, activity: e.target.value })}>
            <option value="1.2">Sedentary</option>
            <option value="1.375">Lightly active</option>
            <option value="1.55">Moderately active</option>
            <option value="1.725">Very active</option>
            <option value="1.9">Super active</option>
          </select><br /><br />

          <button onClick={calculateTDEE}>Calculate</button>
          {tdeeResult && <p style={{ marginTop: '15px' }}>🔥 Your TDEE: <strong>{tdeeResult}</strong> kcal/day</p>}
        </div>
      )}

      {section === 'food' && (
        <div style={container}>
          <h2>Food Calories Calculator</h2>

          {foodRows.map((row, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <label>Food:</label>
              <select
                value={row.food_code}
                onChange={e => handleFoodChange(index, 'food_code', e.target.value)}
              >
                <option value="">-- Select Food --</option>
                {foodList.map(f => (
                  <option key={f.food_code} value={f.food_code}>
                    {f.food_name} — {f.calories} kcal/100g
                  </option>
                ))}
              </select><br /><br />

              <label>Grams:</label>
              <input
                type="number"
                value={row.grams}
                onChange={e => handleFoodChange(index, 'grams', e.target.value)}
              />
            </div>
          ))}

          <button onClick={handleAddRow}>➕ Add Food</button>
          <button onClick={calculateFoodCalories} style={{ marginLeft: '10px' }}>Calculate Calories</button>

          {calculatedFoods.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Results:</h4>
              <ul>
                {calculatedFoods.map((f, i) => (
                  <li key={i}>
                    {f.food_name}: {f.grams}g = {f.totalCalories} kcal
                  </li>
                ))}
              </ul>
              <p><strong>Total Calories:</strong> {totalCalories} kcal</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
