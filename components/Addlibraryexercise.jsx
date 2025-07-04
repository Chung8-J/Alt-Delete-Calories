'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function AddLibraryExercise({ onExerciseAdded }) {
  const [showForm, setShowForm] = useState(false);
  const [newExercise, setNewExercise] = useState({
    exercise_name: '',
    description: '',
    calories_per_sec: '',
    targeted_area: '',
    exercise_genre: '',
  });
  const [uploading, setUploading] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadPreview, setUploadPreview] = useState('');

  const fileInputRef = useRef();

  const resetForm = () => {
  setNewExercise({
    exercise_name: '',
    description: '',
    calories_per_sec: '',
    targeted_area: '',
    exercise_genre: '',
    example_pic: '',
  });
  setUploadPreview('');
  setUploading(false);
  if (fileInputRef.current) fileInputRef.current.value = null;
  setShowForm(false); // hide the form
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewExercise(prev => ({ ...prev, [name]: value }));
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    setMediaFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  };
const handleAddExercise = async () => {
  if (
    !newExercise.exercise_name ||
    !newExercise.description ||
    !newExercise.calories_per_sec ||
    !newExercise.targeted_area ||
    !newExercise.exercise_genre
  ) {
    alert('❌ Please fill in all fields');
    return;
  }

  setUploading(true);

  try {
    let uploadedFilename = null;

    // Upload media if available
    if (mediaFile) {
      const fileExt = mediaFile.name.split('.').pop();
      const uuid = uuidv4();
      const fileName = `${uuid}.${fileExt}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('exercise')
        .upload(filePath, mediaFile);

      if (uploadError) throw uploadError;

      uploadedFilename = fileName; // ✅ Save this to `example_pic`
    }

    // Payload to send to Neon
    const payload = {
      ...newExercise,
      example_pic: uploadedFilename || null // video or image goes here
    };

    const res = await fetch('/api/Add_exercise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      alert('✅ Exercise added!');
      resetForm(); // Clear form fields
      onExerciseAdded(result); // Inform parent to update list
    } else {
      alert(result.error || '❌ Failed to add exercise');
    }
  } catch (err) {
    console.error('❌ Upload error:', err);
    alert('❌ Upload or save failed');
  } finally {
    setUploading(false);
  }
};



  const isVideo = (file) => {
    if (!file) return false;
    const ext = file.split('.').pop().toLowerCase();
    return ['mp4', 'mov', 'webm'].includes(ext);
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setShowForm(prev => !prev)}
        style={{
          position: 'fixed',
          bottom: '140px',
          right: '70px',
          padding: '15px 20px',
          backgroundColor: '#28a745',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '16px',
          borderRadius: '50px',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          cursor: 'pointer',
          zIndex: 1000,
        }}
      >
        {showForm ? '× Close' : '＋ Add Exercise'}
      </button>

      {/* Form */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            bottom: '220px',
            right: '50px',
            width: '400px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          }}
        >

         <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' ,color:'black' }}>
          <h3 className="text-xl font-bold mb-3">Add New Exercise</h3>

  {/* Exercise Name */}

  
  <div style={{ display: 'flex', alignItems: 'center', color:'black' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Name:</label>
    <input
      name="exercise_name"
      value={newExercise.exercise_name}
      onChange={handleChange}
      placeholder="Exercise Name"
      className="w-full p-2 border rounded"
    />
  </div>

  {/* Description */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Description:</label>
    <textarea
      name="description"
      value={newExercise.description}
      onChange={handleChange}
      placeholder="Description"
      className="w-full p-2 border rounded"
    />
  </div>

  {/* Calories per sec */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Calories/sec:</label>
    <input
      type="number"
      step="0.01"
      name="calories_per_sec"
      value={newExercise.calories_per_sec}
      onChange={handleChange}
      placeholder="e.g. 0.15"
      className="w-full p-2 border rounded"
    />
  </div>

  {/* Targeted Area */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Target Area:</label>
    <input
      name="targeted_area"
      value={newExercise.targeted_area}
      onChange={handleChange}
      placeholder="e.g. Arms, Core"
      className="w-full p-2 border rounded"
    />
  </div>

  {/* Genre */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Genre:</label>
    <select
      name="exercise_genre"
      value={newExercise.exercise_genre}
      onChange={handleChange}
      className="w-full p-2 border rounded"
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
  </div>

  {/* Media Upload */}
  <div style={{ display: 'flex', alignItems: 'center' }}>
    <label style={{ width: '120px', fontWeight: 'bold' }}>Media:</label>
    <input
      type="file"
      accept="image/*,video/*"
      onChange={handleMediaChange}
      ref={fileInputRef}
      className="w-full p-2 border rounded"
    />
  </div>

</div>


          {preview && (
            isVideo(preview) ? (
              <video src={preview} controls style={{ maxWidth: '100%', borderRadius: '8px' }} />
            ) : (
              <img src={preview} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />
            )
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExercise}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Add'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
