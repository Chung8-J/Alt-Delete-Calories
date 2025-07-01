'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';


export default function FoodLibrary({ role }) {
  const [foods, setFoods] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const foodsPerPage = 18;

  const indexOfLastFood = currentPage * foodsPerPage;
  const indexOfFirstFood = indexOfLastFood - foodsPerPage;
  const currentFoods = filtered.slice(indexOfFirstFood, indexOfLastFood);
  const totalPages = Math.ceil(filtered.length / foodsPerPage);

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
    setCurrentPage(1); // Reset to first page when filters/search change
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

const handleNext = () => {
  if (currentPage < totalPages) {
    setCurrentPage(prev => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 🔼 Scroll to top
  }
};

const handlePrev = () => {
  if (currentPage > 1) {
    setCurrentPage(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 🔼 Scroll to top
  }
};


  return (
    <div className="library">
      <Layout>
      <h1 className="text-3xl font-bold mb-6">Food Library</h1>

      {/* Filters */}
      <div className="filters">
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
      {currentFoods.length === 0 ? (
        <p>No food items found.</p>
      ) : (
        <div className="food_card">
          {currentFoods.map(food => (
            <div key={food.food_code} className="food_pic">
              {food.food_pic && (
                <img
                  src={`https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/food/public/${food.food_pic}`}
                  alt={food.food_name}
                  className="w-full object-contain max-h-40 rounded mb-3"
                  style={{ maxWidth: '300px', height: '100%' }}
                />
              )}

              <h2 className="food_name">{food.food_name}</h2>

              {/* Role-Based Content */}
              {role === 'admin' ? (
                <>
                  <p className="text-sm text-gray-600 mb-2">{food.description}</p>
                  <p className="text-sm"><strong>Genre:</strong> {food.food_genre}</p>
                  <p className="text-sm"><strong>Calories:</strong> {food.calories} kcal</p>
                  <p className="text-sm">
                    <strong>Per 100g:</strong><br />
                    {food.carbohydrate_per_100g}g carbs<br />
                    {food.protein_per_100g}g protein<br />
                    {food.fat_per_100g}g fat
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => router.push(`edit_food/${food.food_code}`)}
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
                </>
              ) : (
                <>
                  {expanded === food.food_code ? (
                    <>
                      <p className="text-sm text-gray-600 mb-2">{food.description}</p>
                      <p className="text-sm"><strong>Genre:</strong> {food.food_genre}</p>
                      <p className="text-sm"><strong>Calories:</strong> {food.calories} kcal</p>
                      <p className="text-sm">
                        <strong>Per 100g:</strong><br />
                        {food.carbohydrate_per_100g}g carbs<br />
                        {food.protein_per_100g}g protein<br />
                        {food.fat_per_100g}g fat
                      </p>
                      <button
                        onClick={() => setExpanded(null)}
                        className="mt-2 px-3 py-1 bg-gray-300 rounded hover:bg-gray-400 text-sm"
                      >
                        Hide Details
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setExpanded(food.food_code)}
                      className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      View More Details
                    </button>
                    
                  )}<hr />
                </>
              )}
            </div>
            
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
        >
          ◀ Previous
        </button>

        <span className="px-4 py-2 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
        >
          Next ▶
        </button>
      </div>
      </Layout>
    </div>
  );
}
