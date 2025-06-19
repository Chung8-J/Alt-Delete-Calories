'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function CreatePostPage() {
  const [finalImageUrl, setFinalImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [postText, setPostText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [user, setUser] = useState(null); // to hold logged-in user

  // ✅ Load user on mount
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.member_ic) {
      setUser(storedUser);
    } else {
      alert('⚠️ You must be logged in to create a post.');
    }
  }, []);

  const handleImageChange = (e) => {
  const file = e.target.files[0];
  setImageFile(file);

  if (file) {
    const previewURL = URL.createObjectURL(file);
    setUploadUrl(previewURL); // Use this for preview
  }
};
  const handleUpload = async () => {
    if (!imageFile || !postText.trim()) {
      alert('❗ Please select an image and write some content.');
      return;
    }

    if (!user?.member_ic) {
      alert('⚠️ Member IC not found. Please login again.');
      return;
    }

    setUploading(true);

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('communitypost')
      .upload(filePath, imageFile);

    if (uploadError) {
      console.error(uploadError);
      alert('❌ Upload failed');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('communitypost')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Submit post data to Neon DB
    const response = await fetch('/api/Create_post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: postText,
        image: fileName,
        member_ic: user.member_ic,
        created_at: new Date().toISOString()
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result.error);
      alert('❌ Failed to save post in database.');
    } else {
      alert('✅ Post created!');
      setUploadUrl(imageUrl);
      setPostText('');
      setImageFile(null);
    }

    setUploading(false);
  };

  return (
    <div style={{ padding: '20px' }}>
    <h2>🖼️ Create Community Post</h2>

    <input type="file" accept="image/*" onChange={handleImageChange} /><br /><br />

    {/* Image Preview */}
    {uploadUrl && (
        <div style={{ marginTop: '10px' }}>
        <p>🖼️ Image Preview:</p>
        <img src={uploadUrl} alt="Preview" width="300" />
        </div>
    )}
    <br />

   <textarea
        rows="5"
        cols="50"
        maxLength="1000"
        placeholder="Write your post content here..."
        value={postText}
        onChange={(e) => setPostText(e.target.value)}
        style={{ resize: 'none', width: '40%', height: '120px' }}
    /><br /><br />

    <button onClick={handleUpload} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload Post'}
    </button>

    {/* Confirmation after uploading */}
    {finalImageUrl && (
        <div style={{ marginTop: '20px' }}>
        <p>✅ Uploaded Image:</p>
        <img src={finalImageUrl} alt="Uploaded" width="300" />
        <p>{postText}</p>
        </div>
    )}
    </div>

  );
}
