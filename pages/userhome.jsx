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
      <h1>Welcome, {user.member_name || user.name} This is dashboard page!</h1>

    <a href="/community">Community</a> <br /><br />
    <a href="#">Library</a> <br /><br />
    <a href="#">Customize plan</a> <br /><br />
    <a href="#">Calories Calculator</a> <br /><br />
    <a href="#">profile</a> <br /><br />



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
