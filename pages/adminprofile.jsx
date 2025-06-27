'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [formData, setFormData] = useState({});
  const [originalIc, setOriginalIc] = useState('');
  const [Editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored || stored.role !== 'admin' || !stored.coach_ic) {
      alert('⚠️ Not authorized!');
      router.push('/login');
      return;
    }

    setAdmin(stored);
    fetch(`/api/fetch_coach_by_ic?coach_ic=${stored.coach_ic}`)
      .then(res => res.json())
      .then(data => {
        setFormData(data);
        setOriginalIc(data.coach_ic);
        setAvatarPreview(data.avatar || (data.coach_gender === 'female' ? '/images/female_avt.png' : '/images/male_avt.png'));
      })
      .catch(() => setMessage('❌ Failed to load admin data.'));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const payload = new FormData();
    payload.append('original_ic', originalIc);
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    if (avatarFile) payload.append('avatar', avatarFile);

    try {
      const res = await fetch('/api/Edit_coach_profile', {
        method: 'PUT',
        body: payload,
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
    } catch {
      setMessage('Server error.');
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
    <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">👤 Admin Profile</h1>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <label className={`relative ${Editing ? 'cursor-pointer' : ''}`}>
          <img
            src={avatarPreview}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
          />
          {Editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="absolute inset-0 opacity-0"
            />
          )}
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          ['IC Number', 'coach_ic'],
          ['Name', 'coach_name'],
          ['Date of Birth', 'd_birth'],
          ['Years of Experience', 'expr_coaching'],
          ['Email', 'email'],
          ['Phone Number', 'no_tel'],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block font-semibold mb-1">{label}:</label>
            {Editing ? (
              <input
                type={key === 'd_birth' ? 'date' : 'text'}
                name={key}
                value={formData[key] || ''}
                onChange={handleChange}
                className="w-full border p-2 rounded"
              />
            ) : (
              <p className="text-gray-700">{formData[key] || '-'}</p>
            )}
          </div>
        ))}

        <div>
          <label className="block font-semibold mb-1">Gender:</label>
          {Editing ? (
            <select
              name="coach_gender"
              value={formData.coach_gender || ''}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="">-- Select Gender --</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          ) : (
            <p className="text-gray-700">{formData.coach_gender || '-'}</p>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          {Editing ? (
            <>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">💾 Save</button>
              <button type="button" onClick={() => { setEditing(false); setFormData(admin); }} className="border px-4 py-2 rounded">❌ Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded">✏️ Edit Profile</button>
          )}

          <button type="button" onClick={() => setShowModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">🔐 Change Password</button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('user');
              router.push('/login');
            }}
            className="text-red-600 ml-auto"
          >
            Logout
          </button>
        </div>
      </form>

      {/* Password Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-2">Change Password</h2>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border p-2 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
              <button onClick={handlePasswordUpdate} className="px-3 py-1 bg-green-600 text-white rounded">Update</button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="text-red-500 mt-3">{message}</p>}
    </div>
  );
}
