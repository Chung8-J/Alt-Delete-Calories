'use client';

import { useEffect, useState } from 'react';
import CreatePost from '@/components/createpost';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const SUPABASE_IMAGE_BASE =
    'https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/communitypost/public/';

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/Fetch_post');
      const data = await res.json();
      if (res.ok) {
        // posts are already sorted in backend, but just in case:
        const sorted = data.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setPosts(sorted);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const timeAgo = (utcDateStr) => {
    const now = new Date();
    const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000); // Convert to UTC
    const createdAtUTC = new Date(utcDateStr); // already in UTC

    const secondsAgo = Math.floor((nowUTC - createdAtUTC) / 1000);

    const units = [
      { name: 'year', seconds: 31536000 },
      { name: 'month', seconds: 2592000 },
      { name: 'day', seconds: 86400 },
      { name: 'hour', seconds: 3600 },
      { name: 'minute', seconds: 60 },
      { name: 'second', seconds: 1 },
    ];

    for (let unit of units) {
      const count = Math.floor(secondsAgo / unit.seconds);
      if (count > 0) {
        return `${count} ${unit.name}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return 'just now';
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    fetchPosts();
    setShowCreate(false);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>📢 Community Posts</h2>
      <a href="/userhome">back</a> <br /><br />
      <button
        onClick={() => setShowCreate(!showCreate)}
        style={{ marginBottom: '20px' }}
      >
        {showCreate ? 'Hide Create Post' : '➕ Create New Post'}
      </button>

      {showCreate && <CreatePost onPostCreated={handlePostCreated} />}

      {posts.length === 0 && <p>No posts yet.</p>}

      {posts.map((post) => (
        <div
          key={post.postid}
          style={{
            border: post.poster_role === 'coach' ? '2px solid red' : '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <p style={{ marginBottom: '6px' }}>
            <strong>
              {post.poster_name || post.member_ic || post.coach_ic}
            </strong>{' '}
            • {timeAgo(post.created_at)}
            {post.poster_role === 'coach' && (
              <span style={{ color: 'red', marginLeft: '10px' }}>
                🎓 Coach Post
              </span>
            )}
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
