'use client';
import { useEffect, useState } from 'react';

export default function AddExercise({ onSave }) {
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([{
    exercise_id: '',
    mode: 'duration', // or 'reps_sets'
    duration_seconds: '',
    reps: '',
    set: ''
    }]);

  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');

  useEffect(() => {
    const fetchExercises = async () => {
      const res = await fetch('/api/Fetch_exercise');
      const data = await res.json();
      if (Array.isArray(data)) setExercises(data);
      else console.error('Unexpected response:', data);
    };
    fetchExercises();
  }, []);

    const handleAddExercise = () => {
    setSelectedExercises([...selectedExercises, {
        exercise_id: '',
        mode: 'duration',
        duration_seconds: '',
        reps: '',
        set: ''
    }]);
    };

  const handleChange = (index, field, value) => {
    const updated = [...selectedExercises];
    updated[index][field] = value;
    setSelectedExercises(updated);
  };

  const handleSubmit = () => {
    if (!planName.trim()) return alert('❌ Enter plan name');
    if (!selectedExercises.length) return alert('❌ Add at least one exercise');

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.member_ic) return alert('❌ No user found in localStorage');

    // ✅ Check that every exercise has duration_seconds OR reps + set
    for (const [i, ex] of selectedExercises.entries()) {
      const hasSeconds = ex.duration_seconds && parseInt(ex.duration_seconds) > 0;
      const hasRepsSets = ex.reps && ex.set && parseInt(ex.reps) > 0 && parseInt(ex.set) > 0;

      if (!hasSeconds && !hasRepsSets) {
        return alert(`❌ Exercise ${i + 1}: Enter either seconds OR reps and sets`);
      }
    }

    const finalPlan = {
      plan_name: planName,
      description: planDesc,
      member_ic: user.member_ic,
      exercises: selectedExercises.map(e => ({
        ...e,
        exercise_id: parseInt(e.exercise_id),
        duration_seconds: e.duration_seconds ? parseInt(e.duration_seconds) : null,
        reps: e.reps ? parseInt(e.reps) : null,
        set: e.set ? parseInt(e.set) : null
      }))
    };

    onSave?.(finalPlan);
  };

  return (
    <div style={{ padding: 20 }}>
      <h3>➕ Add New Exercise Plan</h3>

      <label>Plan Name:</label><br />
      <input value={planName} onChange={e => setPlanName(e.target.value)} /><br /><br />

      <label>Description:</label><br />
      <textarea
        style={{ resize: 'none', width: '100%', height: 80 }}
        value={planDesc}
        onChange={e => setPlanDesc(e.target.value)}
      /><br /><br />

      <h4>📋 Exercises</h4>
      {selectedExercises.map((ex, idx) => (
        <div key={idx} style={{ marginBottom: 20, padding: 10, border: '1px solid #ccc', position: 'relative', paddingTop: idx > 0 ? 30 : 10 }}>
          {idx > 0 && (
            <button
              type="button"
              onClick={() => {
                const updated = [...selectedExercises];
                updated.splice(idx, 1);
                setSelectedExercises(updated);
              }}
              style={{
                position: 'absolute',
                top: 10,
                right: 5,
                background: '#ffdddd',
                border: '1px solid red',
                color: 'red',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '0.85rem'
              }}
            >
              ✖ Remove
            </button>
          )}

          <div style={{ marginTop: 10 }}>
            <label>Exercise:</label><br />
            <select value={ex.exercise_id} onChange={e => handleChange(idx, 'exercise_id', e.target.value)}>
            <option value="">Select Exercise</option>
            {exercises.map(exercise => (
                <option key={exercise.exercise_id} value={exercise.exercise_id}>
                {exercise.exercise_name}
                </option>
            ))}
            </select><br /><br />

            {/* Toggle Button */}
            <button
            type="button"
            onClick={() => handleChange(idx, 'mode', ex.mode === 'duration' ? 'reps_sets' : 'duration')}
            style={{ marginBottom: 10 }}
            >
            {ex.mode === 'duration' ? 'Switch to Reps + Sets' : 'Switch to Duration'}
            </button><br />

            {/* Conditional Inputs */}
            {ex.mode === 'duration' ? (
            <>
                <label>Duration (seconds):</label><br />
                <input
                type="number"
                value={ex.duration_seconds}
                onChange={e => handleChange(idx, 'duration_seconds', e.target.value)}
                /><br /><br />
            </>
            ) : (
            <>
                <label>Reps:</label><br />
                <input
                type="number"
                value={ex.reps}
                onChange={e => handleChange(idx, 'reps', e.target.value)}
                /><br /><br />

                <label>Sets:</label><br />
                <input
                type="number"
                value={ex.set}
                onChange={e => handleChange(idx, 'set', e.target.value)}
                /><br /><br />
            </>
            )}

          </div>
        </div>
      ))}

      <button onClick={handleAddExercise}>➕ Add Exercise</button><br /><br />
      <button onClick={handleSubmit}>💾 Save Plan</button>

      {selectedExercises.some(ex => ex.exercise_id) && (
        <>
          <h4>👀 Plan Preview</h4>
          <ul>
            {selectedExercises.map((ex, i) => {
              if (!ex.exercise_id) return null;
              const name = exercises.find(e => e.exercise_id == ex.exercise_id)?.exercise_name || 'Unknown';
              return (
                <li key={i}>
                  <strong>{name}</strong> - {ex.duration_seconds ? `${ex.duration_seconds}s` : ''}
                  {ex.reps && `, ${ex.reps} reps`}
                  {ex.set && `, ${ex.set} sets`}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
