'use client';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import Layout from '../components/Layout';

export default function EditExercise() {
  const router = useRouter();
  const { id } = router.query;

  const [exercise, setExercise] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const SUPABASE_IMAGE_BASE =
    'https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/exercise/public/';

  useEffect(() => {
    if (!id) return;

    fetch(`/api/Fetch_exercise_by_id?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        setExercise(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load exercise', err);
        setMessage('Error loading exercise');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setExercise({ ...exercise, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const previewURL = URL.createObjectURL(file);
      setUploadPreview(previewURL);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      let imageName = exercise.example_pic; // use existing

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('exercise')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        imageName = fileName; // store only filename in DB
      }

      const updatedExercise = {
        ...exercise,
        example_pic: imageName, // just the filename
      };

      const res = await fetch('/api/Edit_exercise', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedExercise),
      });

      const result = await res.json();

      if (res.ok) {
        alert('✅ Exercise updated!');
        router.push('/coach_exerciselib');
      } else {
        setMessage(result.error || 'Update failed.');
      }
    } catch (err) {
      console.error(err);
      setMessage('❌ Upload or update failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!exercise) return <p>No exercise found.</p>;

  return (
    <div className="edit_exercise">
      <Layout>
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

          <div>
            <label className="block mb-1 font-semibold">Change Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              ref={fileInputRef}
            />
            {uploadPreview ? (
              <img
                src={uploadPreview}
                alt="Preview"
                style={{ maxWidth: '300px', height: '100%', objectFit: 'contain', border: '1px solid #ccc', marginTop: '8px' }}
              />
            ) : exercise.example_pic ? (
              <img
                src={SUPABASE_IMAGE_BASE + exercise.example_pic}
                alt="Current Example"
                style={{ maxWidth: '300px', height: '100%', objectFit: 'contain', border: '1px solid #ccc', marginTop: '8px' }}
              />
            ) : null}
          </div>

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
            <option value="Dumbell Exercise">Dumbell Exercise</option>
            <option value="Barbell Exercise">Barbell Exercise</option>
            <option value="With Machine">With Machine</option>
            <option value="Without Equipment">Without Equipment</option>
            <option value="Cardio">Cardio</option>
            <option value="Stretch">Stretch</option>
            <option value="Yoga">Yoga</option>

          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            disabled={uploading}
          >
            {uploading ? 'Updating...' : 'Update Exercise'}
          </button>
        </form>

        {message && <p className="text-red-500 mt-3">{message}</p>}
      </Layout>
    </div>
  );
}
