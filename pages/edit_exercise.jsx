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
  const [selectedVideo, setSelectedVideo] = useState(null);

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

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setUploadPreview(previewUrl);
      setSelectedVideo(file); // Use this to upload to Supabase
    }
  };

  const imageStyle = {
    maxWidth: '300px',
    height: 'auto',
    objectFit: 'contain',
    border: '1px solid #ccc',
    marginTop: '8px',
  };

  const videoStyle = {
    maxWidth: '300px',
    height: 'auto',
    objectFit: 'contain',
    border: '1px solid #ccc',
    marginTop: '8px',
  };


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const previewURL = URL.createObjectURL(file);
      setUploadPreview(previewURL);
    }
  };

  const isVideo = (file) => {
    const ext = file?.split('.').pop()?.toLowerCase();
    return ['mp4', 'mov', 'webm'].includes(ext);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    try {
      let imageName = exercise.example_pic; // keep existing image if not changed
      let videoName = exercise.example_video; // keep existing video if not changed

      // 🔼 Upload Image to Supabase
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('exercise') // ✅ Your bucket name
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        imageName = fileName;
      }

      // 🎥 Upload Video to Supabase
      if (selectedVideo) {
        const fileExt = selectedVideo.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `videos/${fileName}`; // Can use 'videos/' folder inside same bucket

        const { error: videoError } = await supabase.storage
          .from('exercise') // ✅ Same bucket
          .upload(filePath, selectedVideo);

        if (videoError) throw videoError;

        videoName = fileName;
      }

      // 📦 Prepare updated exercise data
      const updatedExercise = {
        ...exercise,
        example_pic: imageName,
        example_video: videoName,
      };

      // 📝 Save to Neon (PostgreSQL)
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
      console.error('❌ Error:', err);
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
          <strong>Exercise Name: </strong>
          <input
            type="text"
            name="exercise_name"
            value={exercise.exercise_name}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Exercise Name"
          /><br />

          <strong>Description: </strong>
          <textarea
            name="description"
            value={exercise.description}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Description"
          /><br />

          <strong>Calories Per Sec: </strong>
          <input
            type="number"
            step="0.01"
            name="calories_per_sec"
            value={exercise.calories_per_sec}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Calories/sec"
          /><br />


          <div>
            <label className="block mb-1 font-semibold"><strong>Media (Image OR Video) </strong></label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const previewURL = URL.createObjectURL(file);
                  setUploadPreview(previewURL);
                  setImageFile(file); // you can rename to setMediaFile if preferred
                }
              }}
              ref={fileInputRef}
            /><br />

            {/* Show preview based on file type */}
            {uploadPreview ? (
              isVideo(uploadPreview) ? (
                <video src={uploadPreview} controls style={videoStyle} />
              ) : (
                <img src={uploadPreview} alt="Preview" style={imageStyle} />
              )
            ) : exercise.example_pic ? (
              isVideo(exercise.example_pic) ? (
                <video src={SUPABASE_IMAGE_BASE + exercise.example_pic} controls style={videoStyle} />
              ) : (
                <img src={SUPABASE_IMAGE_BASE + exercise.example_pic} alt="Current Example" style={imageStyle} />
              )
            ) : null}
          </div>

          <strong>Targeted Area: </strong>
          <input
            type="text"
            name="targeted_area"
            value={exercise.targeted_area}
            onChange={handleChange}
            className="w-full border p-2 rounded"
            placeholder="Targeted Area"
          /><br />

          <strong>Exercise Genre: </strong>
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

          </select><br /><br />

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
