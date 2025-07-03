'use client';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Footer from '../components/footer';

export default function CoachHome() {
  const [admin, setAdmin] = useState(null);
  const [stats, setStats] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser && storedUser.role === 'admin') {
      setAdmin(storedUser);
    } else {
      router.push('/Login');
    }
  }, [router]);

  useEffect(() => {
    if (admin) {
      fetch('/api/admin_dashboard_stats')
        .then(res => res.json())
        .then(data => setStats(data))
        .catch(err => console.error('Failed to load stats', err));
    }
  }, [admin]);

  if (!admin) return <p>Loading...</p>;

  return (
    <Layout user={admin}>
      <main className="dashboard">
        <h1 className="title">Welcome Admin, {admin?.coach_name || admin?.name}!</h1>
        <p className="content">
          This admin dashboard provides an overview of the system. As a coach in this platform, you play a vital role in:
          <ul>
            <li>Helping members achieve their health and fitness goals.</li>
            <li>Ensure latests foods and exercises information.</li>
            <li>Manage members information</li>
            <li>Share fitness tips in community.</li>
            <li>Providing dietary guidance using the exercise and food library.</li>
            <li>Collect feedback about coaching and website's member experience.</li>
          </ul>
        </p>
        <hr style={{border: '2px solid #50DA00;'}}/>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-6">
            <div className="bg-blue-100 p-4 rounded shadow">
              <p className="text-lg font-semibold text-blue-800">👤 Members: {stats.totalMembers}</p>
            </div>
            <div className="bg-green-100 p-4 rounded shadow">
              <p className="text-lg font-semibold text-green-800">🧑‍🏫 Coaches: {stats.totalCoaches}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded shadow">
              <p className="text-lg font-semibold text-yellow-800">🏋️ Exercises: {stats.totalExercises}</p>
            </div>
            <div className="bg-pink-100 p-4 rounded shadow">
              <p className="text-lg font-semibold text-pink-800">🍎 Foods: {stats.totalFoods}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Loading stats...</p>
        )}
        
      </main>
      <Footer />
    </Layout>
    
  );
}
