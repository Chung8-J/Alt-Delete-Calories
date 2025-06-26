'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function ViewProfile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }

    const parsed = JSON.parse(stored);
    setUser(parsed);

    // Fetch profile based on role
    const endpoint =
      parsed.role === 'admin'
        ? `/api/fetch_coach_by_ic?coach_ic=${parsed.coach_ic}`
        : `/api/fetch_member_by_ic?member_ic=${parsed.member_ic}`;

    fetch(endpoint)
      .then((res) => res.json())
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error('❌ Failed to fetch profile:', err);
      });
  }, [router]);

  if (!profile) return <p className="p-6">Loading profile...</p>;

  const avatarUrl = profile.avatar
    ? profile.avatar
    : profile.coach_gender === 'female' || profile.gender === 'female'
    ? '/images/female_avt.png'
    : '/images/male_avt.png';

  return (
    <div className="max-w-2xl mx-auto mt-24 p-6 bg-white rounded shadow text-gray-800">
      <h1 className="text-2xl font-bold mb-4">👤 {user.role === 'admin' ? 'Coach' : 'Member'} Profile</h1>

      <div className="flex items-center gap-4 mb-6">
        <img src={avatarUrl} alt="avatar" className="w-20 h-20 rounded-full border object-cover" />
        <div>
          <h2 className="text-xl font-semibold">
            {profile.coach_name || profile.member_name}
          </h2>
          <p className="text-gray-500">{user.role === 'admin' ? 'Admin / Coach' : 'Member'}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {user.role === 'admin' ? (
          <>
            <p><strong>IC:</strong> {profile.coach_ic}</p>
            <p><strong>Date of Birth:</strong> {new Date(profile.d_birth).toLocaleDateString()}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.no_tel}</p>
            <p><strong>Gender:</strong> {profile.coach_gender}</p>
            <p><strong>Experience:</strong> {profile.expr_coaching}</p>
          </>
        ) : (
          <>
            <p><strong>IC:</strong> {profile.member_ic}</p>
            <p><strong>Age:</strong> {profile.age}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.no_tel}</p>
            <p><strong>City:</strong> {profile.city}</p>
            <p><strong>Gender:</strong> {profile.gender}</p>
            <p><strong>Height:</strong> {profile.height} cm</p>
            <p><strong>Weight:</strong> {profile.weight} kg</p>
            <p><strong>Goal Weight:</strong> {profile.goal_weight}</p>
            <p><strong>Activity Level:</strong> {profile.activity_level}</p>
          </>
        )}
      </div>
    </div>
  );
}
