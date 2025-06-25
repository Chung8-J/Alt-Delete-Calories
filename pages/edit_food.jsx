'use client';
import { useRouter } from 'next/router'; // ✅ Pages Router!
import { useEffect, useState } from 'react';

export default function EditFood() {
const router = useRouter();
const { code } = router.query; // ✅ Get code from URL

const [food, setFood] = useState(null);
const [loading, setLoading] = useState(true);
const [message, setMessage] = useState('');

// ✅ Only fetch when code is defined
useEffect(() => {
    if (!code) return;

    fetch(`/api/Fetch_food_by_code?code=${code}`)
    .then(res => res.json())
    .then(data => {
        setFood(data);
        setLoading(false);
    })
    .catch(err => {
        console.error('Failed to load food', err);
        setMessage('Error loading food');
        setLoading(false);
    });
}, [code]);

const handleChange = (f) => {
    setFood({ ...food, [f.target.name]: f.target.value });
};

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
    const res = await fetch('/api/Edit_food', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(food),
    });

    const result = await res.json();

    if (res.ok) {
        alert('✅ food updated successfully!');
        router.push('/coach_foodlib');
    } else {
        setMessage(result.error || 'Update failed.');
    }
    } catch (err) {
    console.error(err);
    setMessage('Server error');
    }
};

if (loading) return <p>Loading...</p>;
if (!food) return <p>No food found.</p>;

return (
<div className="max-w-3xl mx-auto p-6">
    <h1 className="text-2xl font-bold mb-4">Edit Food</h1>
    <form onSubmit={handleSubmit} className="space-y-4">
    <strong>Food Name: </strong>
    <input
        type="text"
        name="food_name"
        value={food.food_name || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Food Name"
    /> <br /><br />
    <strong>Food Description: </strong>
    <textarea
        name="description"
        value={food.description || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Description"
    /><br /><br />
    <strong>Carb per 100g: </strong>
    <input
        type="number"
        step="0.01"
        name="carbohydrate_per_100g"
        value={food.carbohydrate_per_100g || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Carbohydrates per 100g"
    /><br /><br />
    <strong>Protein per 100g: </strong>
    <input
        type="number"
        step="0.01"
        name="protein_per_100g"
        value={food.protein_per_100g || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Protein per 100g"
    /><br /><br />
    <strong>Fat per 100g: </strong>
    <input
        type="number"
        step="0.01"
        name="fat_per_100g"
        value={food.fat_per_100g || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Fat per 100g"
    /><br /><br />
    <strong>Calories: </strong>
    <input
        type="number"
        name="calories"
        value={food.calories || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Calories"
    /><br /><br />
    <strong>Upload Food Picture: </strong>
    <input
        type="text"
        name="food_pic"
        value={food.food_pic || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        placeholder="Picture URL"
    /><br /><br />

    {/* Dropdown for food_genre enum */}
    <strong>Category: </strong>
    <select
        name="food_genre"
        value={food.food_genre || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
    >
        <option value="">-- Select Genre --</option>
        <option value="Carbohydrate">Carbohydrate</option>
        <option value="Protein">Protein</option>
        <option value="Fat">Fat</option>
        <option value="Vegetable">Vegetable</option>
        <option value="Fruits">Fruits</option>
        <option value="Snacks">Snacks</option>
    </select><br /><br />

    <button
        type="submit"
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
        Update Food
    </button>
    </form>
    {message && <p className="text-red-500 mt-3">{message}</p>}
</div>
);
}
