'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';

export default function EditMemberPage() {
  const router = useRouter();
  const { member_ic } = router.query;

  const [originalIc, setOriginalIc] = useState('');
  const [member, setMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!member_ic) return;
    fetch(`/api/Fetch_member_by_ic?member_ic=${member_ic}`)
      .then(res => res.json())
      .then(data => {
        if (data.d_birth) {
          const age = calculateAge(data.d_birth);
          const { bmr, tdee } = calculateBmrTdee(data.weight, data.height, age, data.gender, data.active_level);
          setMember({ ...data, age, bmr, tdee });
          setOriginalIc(data.member_ic); // 👈 Save original IC for WHERE clause
        } else {
          setMember(data);
        }
      })
      .catch(() => setMessage('Failed to load member data.'));
  }, [member_ic]);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  const calculateBmrTdee = (weight, height, age, gender, active_level) => {
    const bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const levelMap = {
      Sedentary: 1.2,
      'Lightly active': 1.375,
      'Moderately active': 1.55,
      'Very active': 1.725,
      'Extra active': 1.9
    };

    const tdee = Math.round(bmr * (levelMap[active_level] || 1.2));
    return { bmr: Math.round(bmr), tdee };
  };

  const handleChange = (e) => {
    const updated = { ...member, [e.target.name]: e.target.value };

    if (['d_birth', 'weight', 'height', 'gender', 'active_level'].includes(e.target.name)) {
      const age = calculateAge(updated.d_birth);
      const { bmr, tdee } = calculateBmrTdee(updated.weight, updated.height, age, updated.gender, updated.active_level);
      updated.age = age;
      updated.bmr = bmr;
      updated.tdee = tdee;
    }

    setMember(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/Edit_member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...member,
          original_ic: originalIc // 👈 Include original IC separately
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Member updated');
        router.push('/manage_member');
      } else {
        setMessage(result.error || 'Update failed.');
      }
    } catch (err) {
      setMessage('Server error.');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const res = await fetch('/api/Edit_member_password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ic: originalIc, password: newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Password updated');
        setShowModal(false);
        setNewPassword('');
      } else {
        alert(result.error || 'Password update failed');
      }
    } catch (err) {
      alert('Server error');
    }
  };

  if (!member) return <p>Loading...</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white shadow p-6 rounded">
      <Layout>
      <h1 className="text-2xl font-bold mb-4">Edit Member</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">IC Number:</label>
          <input type="text" name="member_ic" value={member.member_ic} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Name:</label>
          <input type="text" name="member_name" value={member.member_name} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Date of Birth:</label>
          <input type="date" name="d_birth" value={member.d_birth} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Email:</label>
          <input type="email" name="email" value={member.email} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Height (cm):</label>
          <input type="number" name="height" value={member.height} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Weight (kg):</label>
          <input type="number" name="weight" value={member.weight} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Goal Weight (kg):</label>
          <input type="number" name="goal_weight" value={member.goal_weight} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Gender:</label>
          <select name="gender" value={member.gender} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold">Activity Level:</label>
          <select name="active_level" value={member.active_level} onChange={handleChange} className="w-full border p-2 rounded">
            <option>Sedentary</option>
            <option>Lightly active</option>
            <option>Moderately active</option>
            <option>Very active</option>
            <option>Extra active</option>
          </select>
        </div>

        <p className="text-gray-700 mt-2">
          <strong>Auto-calculated:</strong> Age: {member.age}, BMR: {member.bmr}, TDEE: {member.tdee}
        </p>

        <div className="flex gap-4 mt-4">
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              router.push('/manage_member');
            }}
            className="px-4 py-2 border border-gray-400 rounded"
          >
            Cancel
          </button>

          <button type="button" onClick={() => setShowModal(true)} className="bg-yellow-500 text-white px-4 py-2 rounded">Change Password</button>
        </div>
      </form>

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
      </Layout>
    </div>
  );
}
