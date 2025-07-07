'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import Footer from '../components/footer';

export default function UserProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored || !stored.member_ic || !stored.role) {
      alert('⚠️ Not logged in!');
      router.push('/Login');
      return;
    }

    setUser(stored);
    fetchProfile(stored.member_ic, stored.role);
  }, []);

  async function fetchProfile(member_ic, role) {
    try {
      const res = await fetch(`/api/Db_connection?member_ic=${member_ic}&role=${role}`);
      const data = await res.json();
      if (res.ok) {
        if (data.d_birth) {
          data.d_birth = new Date(data.d_birth).toISOString().split('T')[0];
        }
        setProfile(data);
        setFormData(data); // For editing
      } else {
        console.error('❌ Failed to fetch profile', data.error);
      }
    } catch (err) {
      console.error('❌ Network error:', err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

async function handleSave() {
  const requiredFields = ['member_name', 'email', 'height', 'weight', 'goal_weight', 'age', 'gender'];

  for (const field of requiredFields) {
    if (!formData[field] || formData[field].toString().trim() === '') {
      alert(`⚠️ Please fill in the "${field.replace('_', ' ')}" field.`);
      return;
    }
  }

  // Basic format checks
  if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
    alert('⚠️ Please enter a valid email address.');
    return;
  }

  if (isNaN(formData.height) || isNaN(formData.weight) || isNaN(formData.goal_weight) || isNaN(formData.age)) {
    alert('⚠️ Height, weight, goal weight, and age must be valid numbers.');
    return;
  }

  try {
    const res = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'member',
        action: 'update_profile',
        data: {
          role: user.role,
          member_ic: user.member_ic,
          updates: formData
        }
      })
    });

    const result = await res.json();

    if (!res.ok) {
      console.error('❌ API error:', result.error || result);
      alert(`❌ Failed to update: ${result.error || 'Unknown error'}`);
      return;
    }

    alert('✅ Profile updated!');
    setEditing(false);
    setProfile(formData);
  } catch (err) {
    console.error('❌ Network error while updating profile:', err);
    alert('❌ Network error: Could not update profile.');
  }
}

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

function handleFeedbackSubmit() {
  if (!feedbackMessage.trim()) {
    alert('⚠️ Please enter your feedback message.');
    return;
  }

  fetch('/api/Feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      member_ic: user.member_ic,
      message: feedbackMessage.trim(),
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('✅ Feedback submitted!');
        setShowFeedbackModal(false);
        setFeedbackMessage('');
      } else {
        alert('❌ Failed to submit feedback.');
        console.error(data.error);
      }
    })
    .catch(err => {
      console.error('❌ Network error:', err);
      alert('❌ Failed to submit feedback.');
    });
}



  if (!profile) return <p>Loading profile...</p>;

  return (
    <div style={{margin:'180px auto', width:'86%', marginBottom:'20px',fontSize:'20px'}}>
      <Layout>
      <h2 style={{marginBottom:'50px',fontSize:'40px'}}>User Profile</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {[
            ['Name', 'member_name'],
            ['Gender', 'gender'],
            ['Age', 'age'],
            ['Email', 'email'],
            ['Date of Birth', 'd_birth'],
            ['Height (cm)', 'height'],
            ['Weight (kg)', 'weight'],
            ['Goal Weight (kg)', 'goal_weight'],
            ['BMR', 'bmr'],
            ['TDEE', 'tdee'],
            ['Active Level', 'active_level'],
          ].map(([label, key]) => (
            <tr key={key}>
              <td style={{ padding: '8px', fontWeight: 'bold' }}>{label}</td>
              <td style={{ padding: '8px' }}>
                {editing ? (
                  key === 'gender' ? (
                    <select name="gender" value={formData.gender || ''} onChange={handleChange} 
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #ccc',
                          width:'100%',
                          fontSize:'15px'
                        }}>
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : key === 'd_birth' ? (
                    <input type="date" name={key} value={formData[key] || ''} onChange={handleChange} 
                           style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #ccc',
                            width:'100%',
                            fontSize:'15px'
                          }}/>
                  ) : (
                    <input
                      type="text"
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ccc',
                      width:'100%',
                      fontSize:'15px'
                    }}
                    />
                  )
                ) : (
                  profile[key] || '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px' }}>
        {editing ? (
          <>
            <button onClick={handleSave} className='update-btn' style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px',marginRight:'10px' }}>
              Save
            </button>
            <button onClick={() => setEditing(false)} className='update-btn' style={{ fontWeight:'bold',fontSize:'20px',backgroundColor: 'rgb(255, 0, 0)',color:'white',padding: '15px 24px',borderRadius: '6px' }}>Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} 
                  style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px', marginRight:'10px' }}
                  className='update-btn'>      
                  Edit Profile</button> 
        )}<br /><br />
        <button
          style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(255, 255, 255, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px' }}
          onClick={() => setShowFeedbackModal(true)}
          className='update-btn'
        >
          Leave Feedback
        </button>
        
        <button
          style={{ fontWeight:'bold',fontSize:'20px',backgroundColor: 'rgb(255, 0, 0)',color:'white', marginLeft: 'auto',padding: '15px 24px',borderRadius: '6px',float:'right' }}
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/Login');
          }}
          className='update-btn'
          
        >
          Logout
        </button>

      </div>
      </Layout>
      <Footer />
      {showFeedbackModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            justifyContent: 'center', alignItems: 'center',
            color:'black'
          }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
              <h3 style={{textAlign:'center',marginBottom:'15px'}}>📝 Submit Feedback</h3>
              <label style={{color:'black'}}>
                Type your feedback here:<br /><br />
                <input
                  type="text"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  style={{ marginLeft: '0px',width:'520px',height:'220px',display:'flex',flexDirection:'column',verticalAlign:'text-top' }}
                />
              </label>
              <div style={{ marginTop: '10px' }}>
                <button onClick={handleFeedbackSubmit} style={{ fontWeight:'bold', fontSize:'15px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '6px 10px', borderRadius: '6px', marginRight:'10px' }}
                  className='update-btn'> Submit</button>
                <button onClick={() => setShowFeedbackModal(false)} style={{ fontWeight:'bold',fontSize:'15px',backgroundColor: 'rgb(255, 0, 0)',color:'white', marginLeft: 'auto',padding: '6px 10px',borderRadius: '6px' }}>
                        Cancel</button>
              </div>
            </div>
          </div>
        )}
    </div>
    
  );
}
