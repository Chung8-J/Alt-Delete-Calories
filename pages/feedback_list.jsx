'use client';

import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Footer from '../components/footer';

export default function FeedbackList() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [sortOrder, setSortOrder] = useState('desc'); // default: newest first

  useEffect(() => {
    fetchFeedbacks();
  }, [sortOrder]);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`/api/Feedback_list?sort=${sortOrder}`);
      const data = await res.json();
      if (res.ok) {
        setFeedbacks(data.feedbacks);
      } else {
        console.error('❌ Failed to fetch feedbacks:', data.error);
      }
    } catch (err) {
      console.error('❌ Network error:', err);
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div style={{ paddingTop: '180px',width:'88%', margin: 'auto' }}>
      <Layout>
        <h2 className="" style={{ fontSize:'40px',marginBottom:'30px'}}>Member Feedback List</h2>
        <button
          onClick={toggleSortOrder}
          className='update-btn'
          style={{ fontWeight:'bold', fontSize:'15px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px',marginBottom:'20px' }}
        >
          Sort by Date ({sortOrder === 'asc' ? 'Oldest First' : 'Newest First'})
        </button>

        {feedbacks.length === 0 ? (
          <p>No feedback found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ccc' }}>
                <th style={{ padding: '8px' }}>#</th>
                <th style={{ padding: '8px' }}>Member Name</th>
                <th style={{ padding: '8px' }}>Feedback</th>
                <th style={{ padding: '8px' }}>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((fb, index) => (
                <tr key={fb.feed_id} style={{ borderBottom: '1px solid #ddd',textAlign:'center' }}>
                  <td style={{ padding: '8px' }}>{index + 1}</td>
                  <td style={{ padding: '8px' }}>{fb.member_name}</td>
                  <td style={{ padding: '8px' }}>{fb.feedback_text}</td>
                  <td style={{ padding: '8px' }}>{new Date(fb.publish_date).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Layout>
      <Footer />
    </div>
  );
}
