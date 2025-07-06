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

  for (const [i, ex] of selectedExercises.entries()) {
    if (!ex.exercise_id) {
      return alert(`❌ Exercise ${i + 1}: Please select an exercise`);
    }

    const hasSeconds = ex.duration_seconds && parseInt(ex.duration_seconds) > 0;
    const hasRepsSets =
      ex.reps && ex.set &&
      parseInt(ex.reps) > 0 &&
      parseInt(ex.set) > 0;

    if (!hasSeconds && !hasRepsSets) {
      return alert(`❌ Exercise ${i + 1}: Enter either duration (seconds) or reps and sets`);
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
    <h3>Add New Exercise Plan</h3>

    <label style={{ fontWeight: 'bold' }}>Plan Name:</label>
    <input
      value={planName}
      onChange={e => setPlanName(e.target.value)}
      placeholder="Enter plan name"
      style={{
        padding: '8px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        width: '100%',
        marginBottom: '15px'
      }}
    />

    <label style={{ fontWeight: 'bold' }}>Description:</label>
    <textarea
      style={{
        resize: 'none',
        width: '100%',
        height: 80,
        padding: '8px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        marginBottom: '20px'
      }}
      value={planDesc}
      onChange={e => setPlanDesc(e.target.value)}
      placeholder="Enter description"
    />

    <h4>Exercises</h4>
    {selectedExercises.map((ex, idx) => (
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
          position: 'relative'
        }}
      >
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
            <label style={{ fontWeight: 'bold', marginBottom: '4px', display: 'block', color:'black' }}>Exercise:</label>
            <select
              value={ex.exercise_id}
              onChange={e => handleChange(idx, 'exercise_id', e.target.value)}
              style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Exercise</option>
              {exercises.map(exercise => (
                <option key={exercise.exercise_id} value={exercise.exercise_id}>
                  {exercise.exercise_name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => handleChange(idx, 'mode', ex.mode === 'duration' ? 'reps_sets' : 'duration')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #bbb',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {ex.mode === 'duration' ? 'Switch to Reps + Sets' : 'Switch to Duration'}
          </button>
        </div>

        {ex.mode === 'duration' ? (
          <div style={{ marginTop: '10px', maxWidth: '500px' }}>
            <label style={{ fontSize: '13px', color:'black'}}>Duration (seconds):</label>
            <input
              type="number"
              value={ex.duration_seconds}
              onChange={e => handleChange(idx, 'duration_seconds', e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '30px', maxWidth: '500px', marginTop: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px' ,color:'black'}}>Reps:</label>
              <input
                type="number"
                value={ex.reps}
                onChange={e => handleChange(idx, 'reps', e.target.value)}
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
              <label style={{ fontSize: '13px', color:'black'}}>Sets:</label>
              <input
                type="number"
                value={ex.set}
                onChange={e => handleChange(idx, 'set', e.target.value)}
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
        )}
      </div>
    ))}

    <button
      onClick={handleAddExercise}
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
    </button><br /><br />

    <button
      onClick={handleSubmit}
      style={{
        padding: '10px 20px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
    >
      Save Plan
    </button>

    {selectedExercises.some(ex => ex.exercise_id) && (
      <>
        <h4 style={{ marginTop: '20px' }}>Plan Preview</h4>
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
