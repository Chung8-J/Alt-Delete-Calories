//../components/Addlibraryfood/

'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function AddLibraryFood({ onFoodAdded, onClose }) {
    const [newFood, setNewFood] = useState({
        food_name: '',
        description: '',
        calories: '',
        carbohydrate_per_100g: '',
        protein_per_100g: '',
        fat_per_100g: '',
        food_genre: '',
    });

    const [uploadPreview, setUploadPreview] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const [mediaFile, setMediaFile] = useState(null);
    const router = useRouter();
    const handleChange = (e) => {
        setNewFood({ ...newFood, [e.target.name]: e.target.value });
    };

    const handleMediaChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMediaFile(file); // 🔹 Store the file
            const preview = URL.createObjectURL(file);
            setUploadPreview(preview); // Assuming this is already in your code
        }
    };

    const handleAddFood = async () => {
        if (!newFood.food_name || !newFood.description || !mediaFile) {
            alert('Please fill in all required fields and upload an image.');
            return;
        }

        setUploading(true);

        try {
            const ext = mediaFile.name.split('.').pop();
            const fileName = `${uuidv4()}.${ext}`;
            const filePath = `public/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('food')
                .upload(filePath, mediaFile);

            if (uploadError) throw uploadError;

            const res = await fetch('/api/Add_food', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newFood,
                    food_pic: fileName
                }),
            });

            const result = await res.json();

            if (res.ok) {
                alert('✅ Food added successfully!');
                setTimeout(() => {
                    onClose();       // 🔹 closes the form
                    ; // 🔹 refreshes the page softly
                }, 1500);
            } else {
                alert(result.error || 'Failed to add food');
            }
        } catch (err) {
            console.error('❌ Error:', err);
            alert('Server error. Could not upload food.');
        } finally {
            setUploading(false);
        }
    };


    return (
        <div style={{
            position: 'fixed',
            bottom: '220px',
            right: '50px',
            width: '500px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        }}>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'black' }}>
                <h3 className="text-xl font-bold mb-4">Add New Food</h3>

                {/* Label + Input Row */}
                {[
                    { label: 'Food Name', name: 'food_name', type: 'text' },
                    { label: 'Description', name: 'description', type: 'textarea' },
                    { label: 'Calories', name: 'calories', type: 'number' },
                    { label: 'Carbohydrate/100g', name: 'carbohydrate_per_100g', type: 'number' },
                    { label: 'Protein/100g', name: 'protein_per_100g', type: 'number' },
                    { label: 'Fat/100g', name: 'fat_per_100g', type: 'number' },
                ].map((field, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ color: 'black', width: '150px' }}>{field.label}:</label>
                        {field.type === 'textarea' ? (
                            <textarea
                                name={field.name}
                                value={newFood[field.name]}
                                onChange={handleChange}
                                className="flex-1 p-2 border rounded"
                                placeholder={field.label}
                            />
                        ) : (
                            <input
                                type={field.type}
                                name={field.name}
                                value={newFood[field.name]}
                                onChange={handleChange}
                                className="flex-1 p-2 border rounded"
                                placeholder={field.label}
                            />
                        )}
                    </div>
                ))}

                {/* Genre Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: 'black', width: '150px' }}>Food Genre:</label>
                    <select
                        name="food_genre"
                        value={newFood.food_genre}
                        onChange={handleChange}
                        className="flex-1 p-2 border rounded"
                    >
                        <option value="">-- Select Genre --</option>
                        <option value="Protein">Protein</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Carbohydrates">Carbohydrates</option>
                        <option value="Snacks">Snacks</option>
                        <option value="Drinks">Drinks</option>
                    </select>
                </div>

                {/* Media Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ color: 'black', width: '150px' }}>Upload Image:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleMediaChange}
                        ref={fileInputRef}
                        className="flex-1 p-2 border rounded"
                    />
                </div>

                {/* Preview */}
                {uploadPreview && (
                    <img
                        src={uploadPreview}
                        alt="Preview"
                        style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '10px' }}
                    />
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAddFood}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={uploading}
                    >
                        {uploading ? 'Uploading...' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );

}