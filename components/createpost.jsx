'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/pages/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function CreatePostPage({ onPostCreated }) {
  const [finalImageUrl, setFinalImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [postText, setPostText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);

  // Load user from localStorage on mount
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem('user'));
  if (storedUser && storedUser.member_ic && storedUser.role) {
    setUser({
      ic: storedUser.member_ic,
      role: storedUser.role,
    });
  } else {
    alert('⚠️ You must be logged in to create a post.');
  }
}, []);


  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);

    if (file) {
      const previewURL = URL.createObjectURL(file);
      setUploadUrl(previewURL);
    }
  };

  const handleUpload = async () => {
    if (!imageFile || !postText.trim()) {
      alert('❗ Please select an image and write some content.');
      return;
    }



    setUploading(true);

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    // Upload image to Supabase
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
    

    const response = await fetch('/api/Create_post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: postText,
        image: fileName,
        created_at: new Date().toISOString(),
        member_ic: user.ic   , 
        role: user.role            
      }),
    });

    console.log("📤 Sending post data:", {
  description: postText,
  image: fileName,
  created_at: new Date().toISOString(),
  ...(user?.role === 'admin'
    ? { admin_ic: user.member_ic }
    : { member_ic: user.member_ic })
});



let result;
try {
  result = await response.json();
} catch (e) {
  console.error('❌ Invalid JSON from backend:', e);
  alert('❌ Failed to parse server response');
  return;
}

if (!response.ok) {
  console.error('❌ Backend error:', result.error);
  alert(`❌ Failed to save post: ${result.error || 'Unknown error'}`);
  return;



      
    } else {
      alert('✅ Post created!');
      setFinalImageUrl(imageUrl);
      setPostText('');
      setImageFile(null);
      setUploadUrl('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onPostCreated) onPostCreated(); // notify parent to refresh & maybe hide form
    }

    setUploading(false);
  };

  return (
  <div style={{
    position: 'fixed',
    bottom: '130px', // so it doesn’t block the fixed button
    right: '70px',
    width: '380px',
    padding: '20px',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: 1000
  }}>
<h3 style={{
  color: 'black',
  textAlign: 'center',
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom:20

}}>
  Create Post
</h3>

    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      ref={fileInputRef}
      style={{ marginBottom: '10px' }}
    />

    {uploadUrl && (
      <div style={{ marginBottom: '10px' }}>
        <p>Preview:</p>
        <img src={uploadUrl} alt="Preview" style={{ width: '100%', borderRadius: '6px' }} />
      </div>
    )}

    <textarea
      rows="4"
      maxLength="1000"
      placeholder="Write your post content..."
      value={postText}
      onChange={(e) => setPostText(e.target.value)}
      style={{
        resize: 'none',
        width: '100%',
        height: '100px',
        marginBottom: '10px',
        borderRadius: '6px',
        padding: '8px',
        border: '1px solid #ccc'
      }}
    />

    <button
      onClick={handleUpload}
      disabled={uploading}
      style={{
        width: '100%',
        padding: '10px',
        backgroundColor: '#6200ea',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      {uploading ? 'Uploading...' : 'Upload Post'}
    </button>
  </div>
);

}
