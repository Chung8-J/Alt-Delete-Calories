'use client';

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import '../style/calculator.css';

export default function CaloriesCalculator() {
  const [section, setSection] = useState('tdee');
  const [tdeeInput, setTdeeInput] = useState({ gender: '', weight: '', height: '', age: '', activity: '1.2' });
  const [tdeeResult, setTdeeResult] = useState(null);

  const [foodList, setFoodList] = useState([]);
  const [foodRows, setFoodRows] = useState([{ food_code: '', grams: '' }]);
  const [calculatedFoods, setCalculatedFoods] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTdeeResultOnly, setShowTdeeResultOnly] = useState(false);
  const [foodCalculated, setFoodCalculated] = useState(false);


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

    // Check if any field is empty
    if (!gender || !weight || !height || !age || !activity) {
      alert('❗ Please fill in all the fields.');
      return;
    }

    // Check age range
    const numericAge = parseInt(age);
    if (numericAge < 18 || numericAge > 80) {
      alert('Age must be between 18 and 80.');
      return;
    }

    const numericWeight = parseFloat(weight);
    const numericHeight = parseFloat(height);
    const numericActivity = parseFloat(activity);

    const bmr = gender === 'male'
      ? 10 * numericWeight + 6.25 * numericHeight - 5 * numericAge + 5
      : 10 * numericWeight + 6.25 * numericHeight - 5 * numericAge - 161;

    const tdee = Math.round(bmr * numericActivity);
    setTdeeResult(tdee);
    setShowTdeeResultOnly(true);
  };


  const handleAddRow = () => {
    setFoodRows([...foodRows, { food_code: '', grams: '' }]);
  };

  const handleRemoveRow = (index) => {
    const updated = [...foodRows];
    updated.splice(index, 1);
    setFoodRows(updated);
  };

  const handleFoodChange = (index, key, value) => {
    const updated = [...foodRows];
    updated[index][key] = value;
    setFoodRows(updated);
  };

  const calculateFoodCalories = () => {
    let hasError = false;

    const results = foodRows.map((row, i) => {
      const foodCode = parseInt(row.food_code);
      const grams = parseFloat(row.grams);

      const food = foodList.find(f => f.food_code === foodCode);

      // Error check
      if (!food || isNaN(grams) || grams <= 0) {
        hasError = true;
        return null;
      }

      const totalCalories = Math.round((food.calories / 100) * grams);

      return {
        ...food,
        grams,
        totalCalories
      };
    }).filter(Boolean);

    if (hasError || results.length === 0) {
      alert('❗ Please make sure each food is selected and grams is a valid number greater than 0.');
      return;
    }

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
    <div className="calculator-page">
      <a href={currentUser?.role === 'admin' ? '/adminhome' : '/userhome'}>← Back</a>

      <div className="calculator-buttons">
        <button onClick={() => setSection('tdee')}>TDEE Calculator</button>
        <button onClick={() => setSection('food')}>Food Calculator</button>
      </div>

      {section === 'tdee' && (
        <div className="calculator-container calculator-section">
          <h2>TDEE Calculator</h2>

          {!showTdeeResultOnly ? (
            <>
              <div className="form-row">
                <label>Gender:</label>
                <select value={tdeeInput.gender} onChange={e => setTdeeInput({ ...tdeeInput, gender: e.target.value })}>
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div className="form-row">
                <label>Weight (kg):</label>
                <input type="number" value={tdeeInput.weight} onChange={e => setTdeeInput({ ...tdeeInput, weight: e.target.value })} />
              </div>

              <div className="form-row">
                <label>Height (cm):</label>
                <input type="number" value={tdeeInput.height} onChange={e => setTdeeInput({ ...tdeeInput, height: e.target.value })} />
              </div>

              <div className="form-row">
                <label>Age:</label>
                <input type="number" value={tdeeInput.age} onChange={e => setTdeeInput({ ...tdeeInput, age: e.target.value })} />
              </div>

              <div className="form-row">
                <label>Activity Level:</label>
                <select value={tdeeInput.activity} onChange={e => setTdeeInput({ ...tdeeInput, activity: e.target.value })}>
                  <option value="1.2">Sedentary</option>
                  <option value="1.375">Lightly active</option>
                  <option value="1.55">Moderately active</option>
                  <option value="1.725">Very active</option>
                  <option value="1.9">Super active</option>
                </select>
              </div>

              <div className="button-wrapper">
                <button className='tdee-btn' onClick={calculateTDEE}>Calculate</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '25px', fontSize: 19 }}>
              <p><strong>Result:</strong> <br />{tdeeResult} kcal/day</p>
              <button
                onClick={() => {
                  setShowTdeeResultOnly(false);
                  setTdeeResult(null);
                }}
                className="tdee-btn"
                style={{ marginTop: '20px' }}
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}


      {section === 'food' && (
        <div className="calculator-container calculator-section">
          <h2>Food Calories Calculator</h2>

          {!foodCalculated && (
            <>
              {foodRows.map((row, index) => (
                <div key={index}>
                  <div className="form-row">
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
                    </select>

                    {/* ✅ Remove Button beside the dropdown */}
                    {index !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(index)}
                        style={{
                          marginLeft: '10px',
                          padding: '2px 5px',
                          backgroundColor: '#ff4d4d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          height: '36px',         // Match select box height
                          lineHeight: '1',        // Align text
                          verticalAlign: 'middle',
                          marginTop: '-8px'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>


                  <div className="form-row">
                    <label>Grams:</label>
                    <input
                      type="number"
                      value={row.grams}
                      onChange={e => handleFoodChange(index, 'grams', e.target.value)}
                    />



                  </div>

                </div>
              ))}


              <div className="calculator-buttons">
                <button onClick={handleAddRow}>Add Food</button>
                <button onClick={calculateFoodCalories}>Calculate Calories</button>
              </div>
            </>
          )}



          {foodCalculated && (
            <div className="results food-result">
              <h4 style={{ textAlign: 'center', marginBottom: '10px', color: 'black' }}>Food Calories Result</h4>

              <ul style={{ listStyle: 'none', padding: 0, color: 'black' }}>
                {calculatedFoods.map((f, i) => (
                  <li key={i} style={{ textAlign: 'center', marginBottom: '5px' }}>
                    {f.food_name}: <strong>{f.grams}g</strong> = <strong>{f.totalCalories} kcal</strong>
                  </li>
                ))}
              </ul>

              <p style={{ textAlign: 'center', marginTop: '15px', fontWeight: 'bold', fontSize: '18px', color: 'black' }}>
                Total Calories: <span style={{ color: '#4CAF50' }}>{totalCalories}</span> kcal
              </p>

              {/* 🔙 Back Button */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={() => setFoodCalculated(false)}
                  style={{
                    padding: '8px 18px',
                    backgroundColor: '#50DA00',
                    color: 'white',
                    fontWeight: 'bold',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
