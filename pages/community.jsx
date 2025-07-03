'use client';

import { useEffect, useState } from 'react';
import CreatePost from '@/components/createpost';
import Layout from '../components/Layout';
import Footer from '../components/footer';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const SUPABASE_IMAGE_BASE =
    'https://shidmbowdyumxioxpabh.supabase.co/storage/v1/object/public/communitypost/public/';

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(u);
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/Fetch_post');
    const data = await res.json();
    if (res.ok) {
      setPosts(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  };

  const timeAgo = (utcDateStr) => {
    // Convert to ISO format
    const isoStr = utcDateStr.replace(' ', 'T');

    // Parse as UTC, then convert to local time
    const utcDate = new Date(isoStr);

    // Create local date from UTC parts
    const localDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000)); // +8 hours for Malaysia

    const secondsAgo = Math.floor((new Date() - localDate) / 1000);

    const units = [
      ['year', 31536000],
      ['month', 2592000],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
      ['second', 1],
    ];

    for (let [name, sec] of units) {
      const c = Math.floor(secondsAgo / sec);
      if (c > 0) return `${c} ${name}${c !== 1 ? 's' : ''} ago`;
    }

    return 'just now';
  };




  const handlePostCreated = () => {
    fetchPosts();
    setShowCreate(false);
  };

  const handleDeletePost = async (postid) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch('/api/Fetch_post', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postid })
      });

      const result = await res.json();

      if (res.ok) {
        alert('✅ Post deleted');
        fetchPosts(); // refresh
      } else {
        alert('❌ Failed to delete: ' + result.error);
      }
    } catch (err) {
      console.error('❌ Error deleting post:', err);
      alert('❌ Error deleting post');
    }
  };

  const CommentSection = ({ postId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const fetchComments = async () => {
      const res = await fetch(`/api/comments?post_id=${postId}`);
      if (res.ok) {
        setComments(await res.json());
      }
    };

    const submitComment = async () => {
      if (!newComment.trim()) return;

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          member_ic: currentUser.member_ic,
          content: newComment,
          role: currentUser.role
        }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      } else {
        alert('❌ Failed to add comment');
      }
    };

    useEffect(() => {
      fetchComments();
    }, [postId]);

    return (

      <div style={{ marginTop: '12px' }}>
        <strong>Comments:</strong>
        <div style={{ marginTop: '6px' }}>
          {comments.map((c) => (
            <div key={c.comment_id} style={{ marginBottom: '8px' }}>
              <strong>
                {c.member_name} {c.poster_role === 'coach' && <span style={{ color: 'red' }}>(coach)</span>}
              </strong>{' '}
              · <small>{timeAgo(c.created_at)}</small>
              <p style={{ margin: '4px 0' }}>{c.content}</p>
            </div>
          ))}

        </div>

        {currentUser && (
          <>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="   Write a comment..."
              style={{
                width: '100%',
                height: '30px',
                margin: '10px 0',
                borderRadius: '8px',
                border: '1px solid #ccc',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                paddingTop: '6px'
              }}
            />
            <button
              onClick={submitComment}
              style={{
                marginTop: '10px',
                backgroundColor: '#50DA00',
                color: 'black',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 'bolder',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                transition: 'background-color 0.3s ease'
              }}
            >
              Submit Comment
            </button>

          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', marginTop: '130px' }}>
      <Layout>
        <h2 style={{ marginBottom: 20, marginLeft: 10, fontSize: 32 }}>Community Posts</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            position: 'fixed',
            bottom: '50px',
            right: '50px',
            padding: '15px 23px',
            backgroundColor: '#50DA00',
            color: 'black',
            border: 'none',
            fontSize: ' 17px',
            fontWeight: ' bolder',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            zIndex: 999
          }}
        >
          {showCreate ? 'Hide Create Post' : 'Create New Post'}
        </button>


        {showCreate && <CreatePost onPostCreated={handlePostCreated} />}

        {posts.length === 0 && <p>No posts yet.</p>}

        {posts.map((post) => (
          <div key={post.postid} style={{
            border: post.poster_role === 'coach' ? '2px solid red' : '3px solid rgba(147, 5, 241, 0.45)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            background: 'linear-gradient(to right, rgba(18, 44, 111, 0.7), rgba(130, 21, 202, 0.7), rgba(18, 44, 111, 0.7))',
            color: 'white' // Optional: Ensures text is visible on dark background
          }}>
            <p style={{ marginBottom: '6px' }}>
              <strong>{post.poster_name}</strong> • {timeAgo(post.created_at)}
              {post.poster_role === 'coach' && (
                <span style={{ color: 'red', marginLeft: '10px' }}>🎓 Coach Post</span>
              )}
            </p>

            <img
              src={SUPABASE_IMAGE_BASE + post.image}
              alt="Post"
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
            <p style={{ marginTop: '10px' }}>{post.description}</p>

            <CommentSection postId={post.postid} currentUser={currentUser} />

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleDeletePost(post.postid)}
                style={{
                  backgroundColor: 'red',
                  color: 'white',
                  padding: '5px 10px',
                  border: 'none',
                  borderRadius: '5px',
                  marginTop: '10px',
                  cursor: 'pointer'
                }}
              >
                Delete Post
              </button>
            )}
          </div>
        ))}
      </Layout>
      <Footer />
    </div>
  );
}
