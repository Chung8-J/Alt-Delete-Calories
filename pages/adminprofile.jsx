// app/(your-folder)/admin/profile.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
  const router = useRouter();
  const [coach, setCoach] = useState(null);
  const [formData, setFormData] = useState({});
  const [editing, setEditing] = useState(false);
  const [originalIc, setOriginalIc] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (!stored || stored.role !== 'admin' || !stored.coach_ic) {
      alert('⚠️ Not authorized');
      router.push('/login');
      return;
    }
    fetch(`/api/Fetch_coach_by_ic?coach_ic=${stored.coach_ic}`)
      .then(res => res.json())
      .then(data => {
        setCoach(data);
        setFormData(data);
        setOriginalIc(data.coach_ic);
        setAvatarPreview(data.avatar || (data.coach_gender === 'female' ? '/images/female_avt.png' : '/images/male_avt.png'));
      })
      .catch(() => alert('❌ Load profile failed'));
  }, []);

  const handleChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAvatarChange = e => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    const payload = new FormData();
    payload.append('original_ic', originalIc);
    Object.entries(formData).forEach(([k, v]) => payload.append(k, v));
    if (avatarFile) payload.append('avatar', avatarFile);

    const res = await fetch('/api/Edit_coach_profile', {
      method: 'PUT',
      body: payload,
    });
    const result = await res.json();
    if (res.ok) {
      alert('✅ Profile updated!');
      setEditing(false);
      setCoach(formData);
      localStorage.setItem('user', JSON.stringify({ ...formData, role: 'admin', coach_ic: formData.coach_ic }));
    } else {
      alert(result.error || '❌ Update failed');
    }
  };

  const handlePasswordUpdate = async () => {
    const res = await fetch('/api/Edit_coach_password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_ic: originalIc, password: newPassword }),
    });
    const result = await res.json();
    if (res.ok) {
      alert('✅ Password updated');
      setShowPwdModal(false);
      setNewPassword('');
    } else {
      alert(result.error || 'Password update failed');
    }
  };

  if (!coach) return <p className="text-center mt-10">Loading...</p>;

  const fields = [
    ['IC Number', 'coach_ic'],
    ['Name', 'coach_name'],
    ['Date of Birth', 'd_birth'],
    ['Years Experience', 'expr_coaching'],
    ['Email', 'email'],
    ['Phone', 'no_tel'],
    ['Gender', 'coach_gender'],
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">👤 Admin Profile</h2>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <label className={`relative ${editing ? 'cursor-pointer' : ''}`}>
          <img
            src={avatarPreview}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
          />
          {editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="absolute inset-0 opacity-0"
            />
          )}
        </label>
      </div>

      {/* Profile fields */}
      <div className="space-y-4">
        {fields.map(([label, key]) => (
          <div key={key}>
            <label className="block font-semibold mb-1">{label}:</label>
            {editing ? (
              key === 'coach_gender' ? (
                <select name={key} value={formData[key] || ''} onChange={handleChange} className="w-full border p-2 rounded">
                  <option value="">-- Select --</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              ) : key === 'd_birth' ? (
                <input type="date" name={key} value={formData[key]||''} onChange={handleChange} className="w-full border p-2 rounded" />
              ) : (
                <input type="text" name={key} value={formData[key]||''} onChange={handleChange} className="w-full border p-2 rounded" />
              )
            ) : (
              <p className="text-gray-700">{coach[key] || '-'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex justify-between">
        {editing ? (
          <>
            <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">💾 Save</button>
            <button onClick={() => { setEditing(false); setFormData(coach); }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">❌ Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">✏️ Edit Profile</button>
            <button onClick={() => setShowPwdModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">🔐 Change Password</button>
          </>
        )}

        <button onClick={() => { localStorage.removeItem('user'); router.push('/login'); }} className="text-red-600 hover:text-red-800">Logout</button>
      </div>

      {/* Password Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-bold mb-3">Change Password</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border p-2 rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button onClick={handlePasswordUpdate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Update</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
