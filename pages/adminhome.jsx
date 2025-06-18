'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHome() {
  const [admin, setAdmin] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (!storedUser || !storedUser.coach_name) {
      router.push('/login'); // redirect to login if not an admin
    } else {
      setAdmin(storedUser);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!admin) return <p>Loading...</p>;

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>Welcome, Coach {admin.coach_name} 👋</h1>
      <p>You have successfully logged in as an administrator.</p>

      <button
        onClick={handleLogout}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#d9534f',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Logout
      </button>
    </div>
  );
}
