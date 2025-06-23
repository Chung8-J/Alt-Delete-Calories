'use client';
import { useRouter } from 'next/router'; // ✅ Pages Router!
import { useEffect, useState } from 'react';

export default function EditExercise() {
  const router = useRouter();
  const { id } = router.query; // ✅ Get ID from URL

  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // ✅ Only fetch when id is defined
  useEffect(() => {
    if (!id) return;

    fetch(`/api/Fetch_exercise_by_id?id=${id}`)
      .then(res => res.json())
      .then(data => {
        setExercise(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load exercise', err);
        setMessage('Error loading exercise');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setExercise({ ...exercise, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/Edit_exercise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exercise),
      });

      const result = await res.json();

      if (res.ok) {
        alert('✅ Exercise updated successfully!');
        router.push('/coach/exercises');
      } else {
        setMessage(result.error || 'Update failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Server error');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!exercise) return <p>No exercise found.</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Edit Exercise</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="exercise_name"
          value={exercise.exercise_name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Exercise Name"
        />

        <textarea
          name="description"
          value={exercise.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Description"
        />

        <input
          type="number"
          step="0.01"
          name="calories_per_sec"
          value={exercise.calories_per_sec}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Calories/sec"
        />

        <input
          type="text"
          name="example_pic"
          value={exercise.example_pic}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Image URL"
        />

        <input
          type="text"
          name="targeted_area"
          value={exercise.targeted_area}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          placeholder="Targeted Area"
        />

        <select
          name="exercise_genre"
          value={exercise.exercise_genre}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">-- Select Genre --</option>
          <option value="Cardio">Dumbell Exercise</option>
          <option value="Strength">Barbell Exercise</option>
          <option value="Flexibility">With Machine</option>
          <option value="Balance">Without Equipment</option>
          <option value="Endurance">Cardio</option>
          <option value="Endurance">Stretch</option>
          <option value="Endurance">Yoga</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Update Exercise
        </button>
      </form>

      {message && <p className="text-red-500 mt-3">{message}</p>}
    </div>
  );
}
