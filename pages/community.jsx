'use client';

import { useEffect, useState } from 'react';
import CreatePost from '@/components/createpost'; // Adjust the import path as needed

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const SUPABASE_IMAGE_BASE = "https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/communitypost/public/";

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/Fetch_post');
      const data = await res.json();
      if (res.ok) {
        const sorted = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setPosts(sorted);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📢 Community Posts</h2>

      <button onClick={() => setShowCreate(!showCreate)} style={{ marginBottom: '20px' }}>
        {showCreate ? 'Hide Create Post' : '➕ Create New Post'}
      </button>

      {showCreate && <CreatePost onPostCreated={fetchPosts} />}

      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div key={post.postid} style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ marginBottom: '6px' }}>
            <strong>{post.member_name || post.member_ic}</strong> • {new Date(post.created_at).toLocaleString()}
          </p>
          <img
            src={SUPABASE_IMAGE_BASE + post.image}
            alt="Post"
            style={{
                width: '100%',
                maxHeight: '400px', // or whatever limit you want
                height: 'auto',      // let image control the height
                objectFit: 'contain',
                borderRadius: '4px'
            }}
            />

          <p style={{ marginTop: '10px' }}>{post.description}</p>
        </div>
      ))}
    </div>
  );
}
