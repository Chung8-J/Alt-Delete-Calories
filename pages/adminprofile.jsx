'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';
import Footer from '../components/footer';

export default function AdminProfile() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({});
  const [originalIc, setOriginalIc] = useState('');
  const [Editing, setEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored || stored.role !== 'admin' || !stored.member_ic) {
      alert('⚠️ Not authorized!');
      router.push('/Login');
      return;
    }

    setAdmin(stored);
    fetch(`/api/Fetch_coach_by_ic?coach_ic=${stored.member_ic}`)
      .then(res => res.json())
      .then(data => {
        setFormData(data);
        setOriginalData(data); // Save original profile data
        setOriginalIc(data.coach_ic);
        setAvatarPreview(
          data.avatar || (data.coach_gender === 'female' ? '/user_avatar/female_avt.png' : '/user_avatar/male_avt.png')
        );
      })
      .catch(() => setMessage('❌ Failed to load admin data.'));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const payload = {
      original_ic: originalIc,
      ...formData
    };

    try {
      const res = await fetch('/api/Edit_coach_profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (res.ok) {
        alert('✅ Profile updated!');
        setEditing(false);
        setAdmin({ ...formData, role: 'admin' });
        localStorage.setItem('user', JSON.stringify({ ...formData, role: 'admin' }));
      } else {
        setMessage(result.error || '❌ Update failed.');
      }
    } catch (err) {
      console.error('Server error:', err);
      setMessage('❌ Server error.');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const res = await fetch('/api/Edit_coach_password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coach_ic: originalIc, password: newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Password updated');
        setShowModal(false);
        setNewPassword('');
      } else {
        alert(result.error || '❌ Password update failed');
      }
    } catch {
      alert('Server error');
    }
  };

  if (!formData.coach_ic) return <p>Loading profile...</p>;

  return (
    <div className="adminprofile" style={{margin:'180px auto', width:'86%', marginBottom:'20px'}}>
      <Layout>
        <h1 className="" style={{marginBottom:'50px',fontSize:'40px'}}>Admin Profile</h1>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
          {/* Avatar on the left */}
          <div style={{ flex: '0 0 270px', textAlign: 'center' }}>
            <img
              src={avatarPreview}
              alt="avatar"
              className="rounded-full object-cover border-2 border-white"
              style={{
                width: '270px',
                height: '270px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid white',marginRight:'10px'
              }}
            />
          </div>

          {/* Admin info on the right */}
          <form onSubmit={handleSubmit} style={{ flex: 1 }}>
            {[
              ['IC Number', 'coach_ic'],
              ['Name', 'coach_name'],
              ['Date of Birth', 'd_birth'],
              ['Years of Experience', 'expr_coaching'],
              ['Email', 'email'],
              ['Phone Number', 'no_tel']
            ].map(([label, key]) => (
              <div key={key} style={{ display: 'flex', marginBottom: '15px',  }}>
                <label style={{ width: '50%', fontWeight: 'bold', fontSize:'20px',textAlign:'left' }}>{label}:</label>
                {Editing ? (
                  <input
                    type={key === 'd_birth' ? 'date' : 'text'}
                    name={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #ccc'
                    }}
                  />
                ) : (
                  <span style={{ color: 'white',fontSize:'22px'  }}>{formData[key] || '-'}</span>
                )}
              </div>
            ))}

            {/* Gender */}
            <div style={{ display: 'flex', marginBottom: '15px' }}>
              <label style={{ width: '50%', fontWeight: 'bold', fontSize:'20px'}}>Gender:</label>
              {Editing ? (
                <select
                  name="coach_gender"
                  value={formData.coach_gender || ''}
                  onChange={handleChange}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="">-- Select Gender --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              ) : (
                <span style={{ color: 'white',fontSize:'22px' }}>{formData.coach_gender || '-'}</span>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '30px', flexWrap: 'wrap' }}>
              {Editing ? (
                <>
                  <button type="submit" style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px' }}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData(originalData); // Revert to original data
                    }}
                    style={{ fontWeight:'bold',fontSize:'20px',backgroundColor: 'rgb(255, 0, 0)',color:'white',padding: '8px 16px',borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.86)', color: 'black', padding: '15px 24px', borderRadius: '6px' }}
                >
                  Edit Profile
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowModal(true)}
                style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.88)', color: 'black', padding: '8px 16px', borderRadius: '6px' }}
              >
                Change Password
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/Login');
                }}
                style={{ fontWeight:'bold',fontSize:'20px',backgroundColor: 'rgb(255, 0, 0)',color:'white', marginLeft: 'auto',padding: '8px 16px',borderRadius: '6px' }}
              >
                Logout
              </button>
            </div>
          </form>
          </div>


        {/* Password Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
              <br />
              <hr />
              <br />
              <h2 className="" style={{marginBottom:'20px',fontSize:'30px'}}>Change Password</h2>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full border p-2 mb-4"
                style={{ width: '50%', fontWeight: 'bold', fontSize:'16px',textAlign:'left', padding:'15px' }}
              /><br /><br />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} style={{ fontWeight:'bold',fontSize:'20px',backgroundColor: 'rgb(255, 0, 0)',color:'white', marginLeft: 'auto',padding: '8px 16px', borderRadius: '6px', marginRight:'8px' }}>
                  Cancel
                </button>
                <button onClick={handlePasswordUpdate} style={{ fontWeight:'bold', fontSize:'20px',background: 'rgba(103, 255, 15, 0.88)', color: 'black', padding: '8px 16px', borderRadius: '6px' }}>
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {message && <p className="text-red-500 mt-3">{message}</p>}
      </Layout>
      <Footer />
    </div>
  );
}