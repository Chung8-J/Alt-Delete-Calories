'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExerciseLibrary({ role }) {
  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/Fetch_exercise')
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        setFiltered(data);
      })
      .catch(err => console.error('Failed to fetch exercises:', err));
  }, []);

  useEffect(() => {
    const filteredData = exercises
      .filter(ex =>
        ex.exercise_name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter(ex => genreFilter ? ex.exercise_genre === genreFilter : true)
      .filter(ex => areaFilter.length > 0 ? areaFilter.includes(ex.targeted_area) : true);

    setFiltered(filteredData);
  }, [search, genreFilter, areaFilter, exercises]);

  const uniqueGenres = [...new Set(exercises.map(ex => ex.exercise_genre))];
  const uniqueAreas = [...new Set(exercises.map(ex => ex.targeted_area))];

  const toggleArea = (area) => {
    setAreaFilter(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setGenreFilter('');
    setAreaFilter([]);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this exercise?');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/Delete_exercise?id=${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setExercises(prev => prev.filter(ex => ex.exercise_id !== id));
        alert('Exercise deleted successfully.');
      } else {
        alert(result.error || 'Failed to delete.');
      }
    } catch (err) {
      alert('Server error');
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Exercise Library</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 flex-1 rounded"
        />

        <select
          value={genreFilter}
          onChange={e => setGenreFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Genres</option>
          {uniqueGenres.map((genre, i) => (
            <option key={i} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {uniqueAreas.map((area, i) => (
          <button
            key={i}
            onClick={() => toggleArea(area)}
            className={`px-3 py-1 rounded border ${
              areaFilter.includes(area) ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
          >
            {area}
          </button>
        ))}

        {(search || genreFilter || areaFilter.length > 0) && (
          <button
            onClick={clearFilters}
            className="px-4 py-1 border border-red-500 text-red-600 rounded ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p>No exercises found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(ex => (
            <div key={ex.exercise_id} className="bg-white rounded-xl shadow p-4">
              {ex.example_pic && (
                <img
                  src={ex.example_pic}
                  alt={ex.exercise_name}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}
              <h2 className="text-xl font-semibold">{ex.exercise_name}</h2>
              <p className="text-sm text-gray-600 mb-2">{ex.description}</p>
              <p className="text-sm"><strong>Calories/sec:</strong> {ex.calories_per_sec}</p>
              <p className="text-sm"><strong>Target Area:</strong> {ex.targeted_area}</p>
              <p className="text-sm"><strong>Genre:</strong> {ex.exercise_genre}</p>

              {role === 'admin' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push('/edit_exercise/' + ex.exercise_id)}

                    className="px-3 py-1 text-sm rounded bg-yellow-400 hover:bg-yellow-500 text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ex.exercise_id)}
                    className="px-3 py-1 text-sm rounded bg-red-500 hover:bg-red-600 text-white"
                  >
                    Delete
                  </button>
                  </div>
              )} <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
