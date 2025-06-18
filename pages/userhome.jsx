import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.member_name) {
      setUser(storedUser);
    } else {
      // Redirect if not logged in or not a user
      router.push('/login');
    }
  }, [router]);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome, {user.member_name}!</h1>
      <p>You are logged in as a regular user.</p>
      {/* Add your user-specific features here */}
      <button onClick={() => {
        localStorage.removeItem('user');
        router.push('/login');
      }}>Logout</button>
    </div>
  );
}
