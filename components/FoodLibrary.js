'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FoodLibrary({ role }) {
  const [foods, setFoods] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/Fetch_food')
      .then(res => res.json())
      .then(data => {
        setFoods(data);
        setFiltered(data);
      })
      .catch(err => console.error('Failed to fetch foods:', err));
  }, []);

  useEffect(() => {
    const result = foods
      .filter(f =>
        f.food_name.toLowerCase().includes(search.toLowerCase()) ||
        f.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter(f => (genreFilter ? f.food_genre === genreFilter : true));

    setFiltered(result);
  }, [search, genreFilter, foods]);

  const uniqueGenres = [...new Set(foods.map(f => f.food_genre))];

  const clearFilters = () => {
    setSearch('');
    setGenreFilter('');
  };

  const handleDelete = async (code) => {
    if (!confirm('Delete this food item?')) return;

    try {
      const res = await fetch(`/api/Delete_food?code=${code}`, { method: 'DELETE' });
      const result = await res.json();
      if (res.ok) {
        setFoods(prev => prev.filter(f => f.food_code !== code));
        alert('Food deleted successfully');
      } else {
        alert(result.error || 'Delete failed');
      }
    } catch (err) {
      alert('Server error');
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Food Library</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Search food..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-2 rounded flex-1"
        />

        <select
          value={genreFilter}
          onChange={e => setGenreFilter(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">All Genres</option>
          {uniqueGenres.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select>

        {(search || genreFilter) && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 border border-red-500 text-red-600 rounded"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Food Cards */}
      {filtered.length === 0 ? (
        <p>No food items found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(food => (
            <div key={food.food_code} className="bg-white p-4 rounded-xl shadow">
              {food.food_pic && (
                <img
                  src={food.food_pic}
                  alt={food.food_name}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              )}
              <h2 className="text-xl font-semibold">{food.food_name}</h2>
              <p className="text-sm text-gray-600 mb-2">{food.description}</p>
              <p className="text-sm"><strong>Genre:</strong> {food.food_genre}</p>
              <p className="text-sm"><strong>Calories:</strong> {food.calories} kcal</p>
              <p className="text-sm">
                <strong>Per 100g:</strong> {food.carbohydrate_per_100g}g carbs, {food.protein_per_100g}g protein, {food.fat_per_100g}g fat
              </p>

              {role === 'admin' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/coach/edit-food/${food.food_code}`)}
                    className="bg-yellow-400 text-white text-sm px-3 py-1 rounded hover:bg-yellow-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(food.food_code)}
                    className="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              )}<hr />
            </div>
          ))}
        </div>
      )} 
    </div>
  );
}
