'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser && storedUser.role === 'admin') {
      setAdmin(storedUser);
    } else {
      router.push('/Login'); 
    }
  }, [router]);

  if (!admin) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome Admin, {admin.coach_name || admin.name}!</h1>
      <button
        onClick={() => {
          localStorage.removeItem('user');
          router.push('/Login');
        }}
      >
        Logout
      </button>
    </div>
  );
}
