'use client';

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Footer from '../components/footer';

export default function Calendar30() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [memberIC, setMemberIC] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
const [summary, setSummary] = useState({ totalCalories: 0, totalDuration: 0 });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.member_ic) {
      setMemberIC(user.member_ic);
      fetchWorkoutLogs(user.member_ic);
    }
  }, []);

  const fetchWorkoutLogs = async (ic) => {
    const res = await fetch('/api/fetch_workout_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_ic: ic }),
    });

    if (res.ok) {
      const logs = await res.json();
      setWorkoutLogs(logs);
    } else {
      console.error('❌ Failed to fetch workout logs');
    }
  };

  const handleDayClick = async (day) => {
    setSelectedDay(day);
    const matchedLogs = workoutLogs.filter((log) => log.day === day);

    if (!matchedLogs || matchedLogs.length === 0) {
      setExercises([]);
      return;
    }

    const logIds = matchedLogs.map((log) => log.log_id);

    const res = await fetch('/api/fetch_log_exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ log_ids: logIds }),
    });

   if (res.ok) {
  const data = await res.json();
  setExercises(data);

  // ⬇️ Calculate total calories and duration
  const totalCalories = data.reduce((sum, ex) => sum + (ex.calories_burned || 0), 0);
  const totalDuration = data.reduce((sum, ex) => sum + (ex.duration_seconds || 0), 0);

  setSummary({ totalCalories, totalDuration });
}else {
      console.error('❌ Failed to fetch exercises');
    }
  };

  return (
   <div style={{ padding: '30px' }}>
  <Layout>
    <h2 style={{ textAlign: 'center',marginTop:'140px',fontSize:'40px'}}>Daily Progress Calendar</h2>

    <div
      style={{
        maxWidth: '1000px', 
        display: 'flex',
        margin: '0 auto',   
        justifyContent: 'space-between',
        gap: '20px',
        borderRadius: '8px',
        background: 'linear-gradient(to right, rgba(18, 44, 111, 0.7), rgba(130, 21, 202, 0.7), rgba(18, 44, 111, 0.7))',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '3px solid rgba(147, 5, 241, 0.45)',
        padding: '20px',
        color: 'white',
        flexWrap: 'wrap',
        marginTop:'40px'
      }}
    >
      {/* Day buttons */}
      <div style={{ flex: '1 1 50%' }}>
        <h3 style={{ textAlign: 'center', marginBottom: '10px' }}>Select a Day</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '10px',
          }}
        >
          {Array.from({ length: 30 }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => handleDayClick(i + 1)}
              style={{
                padding: '12px 0',
                backgroundColor: selectedDay === i + 1 ? '#50DA00' : '#f0f0f0',
                borderRadius: '6px',
                fontWeight: 'bold',
                border: '1px solid #999',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
                color: selectedDay === i + 1 ? 'black' : '#333',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise info */}
      <div style={{ flex: '1 1 45%', marginTop: '0px'  , borderLeft:'1px solid white'}}>
        <h3 style={{ textAlign: 'center'}}>
          {selectedDay ? `Exercises for Day ${selectedDay}` : 'No Day Selected'}
        </h3>
        {selectedDay && exercises.length === 0 && (
          <p style={{ textAlign: 'center' }}>No workout recorded.</p>
        )}
       {selectedDay && exercises.length > 0 && (
  <>
    <ul style={{ marginTop: '10px', paddingLeft: '20px' }}>
      {exercises.map((ex, idx) => (
        <li key={idx} style={{ marginBottom: '8px' ,marginLeft: '25px'}}>
          {ex.exercise_name} –{' '}
          {ex.duration_seconds
            ? `${ex.duration_seconds} sec`
            : `${ex.sets_completed} sets × ${ex.reps_per_set} reps`}
        </li>
      ))}
    </ul>

    {/* ⬇️ Totals shown here */}
    <div style={{ marginTop: '20px', textAlign: 'center',padding:10 , borderTop:'1px solid white'}}>
      <p><strong>Total Calories Burned:</strong> {summary.totalCalories} kcal</p>
      <p>
        <strong style={{marginTop:10}}>Total Time:</strong> {Math.floor(summary.totalDuration / 60)} min{' '}
        {summary.totalDuration % 60} sec
      </p>
    </div>
  </>
)}

      </div>
    </div>

    <Footer />
  </Layout>
</div>

  );
}
