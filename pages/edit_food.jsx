'use client';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';
import '../style/common.css';
import Footer from '../components/footer';

export default function EditFood() {
  const router = useRouter();
  const { code } = router.query;

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const fileInputRef = useRef(null);

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

  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewURL = URL.createObjectURL(file);
      setUploadPreview(previewURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      let imageName = food.food_pic; // default: keep existing

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const uuid = `${uuidv4()}.${ext}`;
        const filePath = `public/${uuid}`;

        const { error: uploadError } = await supabase.storage
          .from('food')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        imageName = uuid;
      }

      const updatedFood = {
        ...food,
        food_pic: imageName,
      };

      const res = await fetch('/api/Edit_food', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFood),
      });

      const result = await res.json();

      if (res.ok) {
        alert('✅ Food updated successfully!');
        router.push('/coach_foodlib');
      } else {
        setMessage(result.error || 'Update failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload or update failed.');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!food) return <p>No food found.</p>;

  const SUPABASE_IMAGE_BASE = 'https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/food/public/';

return (
  <div className="edit_food" style={{margin:'180px auto', width:'86%'}}>
    <Layout>
      <h1 className="text-2xl font-bold mb-4" style={{marginBottom:'50px',fontSize:'40px'}}>Edit Food</h1>
      <form onSubmit={handleSubmit} className="edit-food-form" style={{fontSize:'20px'}}>
         <strong>Food Name: </strong>
            <input
                type="text"
                name="food_name"
                value={food.food_name || ''}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Food Name"
                style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}
            /> <br /><br />

        <strong>Food Description: </strong>
            <textarea
                name="description"
                value={food.description || ''}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                placeholder="Description"
                style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}
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
                    style={{
                      verticalAlign:'middle',
                      padding: '8px 10px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px'
                    }}
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
                    style={{
                      verticalAlign:'middle',
                      padding: '8px 10px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px'
                    }}
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
                    style={{
                      verticalAlign:'middle',
                      padding: '8px 10px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px'
                    }}
                /><br /><br />
            <strong>Calories: </strong>
                <input
                    type="number"
                    name="calories"
                    value={food.calories || ''}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    placeholder="Calories"
                    style={{
                      verticalAlign:'middle',
                      padding: '8px 10px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px'
                    }}
                /><br /><br />


        {/* 🔼 Image Upload Section */}
        <div>
          <label className="block font-semibold mb-1"><strong>Upload Food Picture: </strong></label><br /><br />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="mt-1"
          />
          {uploadPreview ? (
            <img
              src={uploadPreview}
              alt="Preview"
              style={{ maxWidth: '200px', height: '100%', marginTop: '0px' }}
            />
          ) : food.food_pic ? (
            <img
              src={SUPABASE_IMAGE_BASE + food.food_pic}
              alt="Current"
              style={{ maxWidth: '200px', height: '100%', marginTop: '0px' }}
            />
          ) : null}
        </div>

          <br /><br />

    {/* Dropdown for food_genre enum */}
    <strong style={{
                      verticalAlign:'middle',
                      padding: '0px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'20px',
                      border:'none'
                    }}>
    Category: </strong>
    <select
        name="food_genre"
        value={food.food_genre || ''}
        onChange={handleChange}
        className="w-full border p-2 rounded"
        style={{
                      verticalAlign:'middle',
                      padding: '8px 10px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px'
                    }}
    >
        <option value="">-- Select Genre --</option>
        <option value="Carbohydrate">Carbohydrate</option>
        <option value="Protein">Protein</option>
        <option value="Fat">Fat</option>
        <option value="Vegetable">Vegetable</option>
        <option value="Fruits">Fruits</option>
        <option value="Snacks">Snacks</option>
        <option value="Snacks">Drinks</option>
    </select><br /><br />

    <button
        type="submit"
        className="update-btn"
        style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      fontWeight:'bold',
                      width:'100%',
                      backgroundColor:'#00ff37' 
                    }}
    >
        Update Food
    </button>
      </form>

        {message && <p className="text-red-500 mt-3">{message}</p>}
      </Layout>
      <Footer />
    </div>
  );

} 