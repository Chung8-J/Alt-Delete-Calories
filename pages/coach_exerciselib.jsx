'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function Exercises() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [exercises, setExercises] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genreFilter, setGenreFilter] = useState(searchParams.get('genre') || '');
  const [areaFilter, setAreaFilter] = useState(
    searchParams.getAll('area') || []
  );

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetch('/api/Fetch_exercise')
      .then(res => res.json())
      .then(data => {
        setExercises(data);
        setFiltered(data); // fallback before filtering
      })
      .catch(err => console.error('Failed to fetch exercises:', err));
  }, []);

  useEffect(() => {
    // Update the URL params
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (genreFilter) params.set('genre', genreFilter);
    areaFilter.forEach(area => params.append('area', area));
    router.replace(`/manage_exercise_library?${params.toString()}`);
  }, [search, genreFilter, areaFilter]);

  useEffect(() => {
    const filteredData = exercises
      .filter(ex =>
        ex.exercise_name.toLowerCase().includes(search.toLowerCase()) ||
        ex.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter(ex =>
        genreFilter ? ex.exercise_genre === genreFilter : true
      )
      .filter(ex =>
        areaFilter.length > 0 ? areaFilter.includes(ex.targeted_area) : true
      );
    setFiltered(filteredData);
  }, [search, genreFilter, areaFilter, exercises]);

  const uniqueGenres = [...new Set(exercises.map(ex => ex.exercise_genre))];
  const uniqueAreas = [...new Set(exercises.map(ex => ex.targeted_area))];

  const toggleArea = (area) => {
    setAreaFilter(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setGenreFilter('');
    setAreaFilter([]);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Exercise Library</h1>

      {/* Search + Filters */}
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

      {/* Target Area Filter Buttons */}
      <div className="flex gap-2 flex-wrap mb-4">
        {uniqueAreas.map((area, i) => (
          <button
            key={i}
            onClick={() => toggleArea(area)}
            className={`px-3 py-1 rounded border ${
              areaFilter.includes(area)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100'
            }`}
          >
            {area}
          </button>
        ))}
        {areaFilter.length > 0 || search || genreFilter ? (
          <button
            onClick={clearFilters}
            className="px-4 py-1 border border-red-500 text-red-600 rounded ml-auto"
          >
            Clear Filters
          </button>
        ) : null}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p>No exercises match your criteria.</p>
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
              <p className="text-sm mb-2 text-gray-600">{ex.description}</p>
              <p className="text-sm"><strong>Calories/sec:</strong> {ex.calories_per_sec}</p>
              <p className="text-sm"><strong>Target Area:</strong> {ex.targeted_area}</p>
              <p className="text-sm"><strong>Genre:</strong> {ex.exercise_genre}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
