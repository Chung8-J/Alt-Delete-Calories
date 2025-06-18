'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (storedUser && storedUser.role === 'user') {
      setUser(storedUser);
    } else {
      router.push('/Login');
    }
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome, {user.member_name || user.name}!</h1>
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
