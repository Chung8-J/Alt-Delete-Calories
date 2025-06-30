'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';

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
      router.push('/login');
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
      if (res.ok) {
        alert('✅ Profile updated!');
        setEditing(false);
        setProfile(formData);
      } else {
        console.error('❌ Update failed:', result);
        alert('❌ Update failed');
      }
    } catch (err) {
      console.error('❌ Error updating profile:', err);
    }
  }

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: 'auto' }}>
      <Layout>
      <h2>👤 User Profile</h2>
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
                    <select name="gender" value={formData.gender || ''} onChange={handleChange} style={{ width: '100%' }}>
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : key === 'd_birth' ? (
                    <input type="date" name={key} value={formData[key] || ''} onChange={handleChange} style={{ width: '100%' }} />
                  ) : (
                    <input
                      type="text"
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      style={{ width: '100%' }}
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
            <button onClick={handleSave} style={{ marginRight: '10px' }}>
              💾 Save
            </button>
            <button onClick={() => setEditing(false)}>❌ Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>✏️ Edit Profile</button>
        )}
        <button
          style={{ float: 'right', color: 'red' }}
          onClick={() => {
            localStorage.removeItem('user');
            router.push('/Login');
          }}
        >
          Logout
        </button>
      </div>
      </Layout>
    </div>
  );
}
