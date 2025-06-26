'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) return null; // Hide navbar if user not loaded yet

  return (
    <nav className="bg-gray-800 text-white px-6 py-3 flex justify-between items-center shadow fixed top-0 left-0 right-0 z-50">
      <div className="text-xl font-bold">🏋️ Alt+Calories</div>

      <div className="flex items-center gap-6">
        <Link href="/" className="hover:text-yellow-400">Home</Link>|

        {user.role === 'admin' && (
          <>
            <Link href="/coach_foodlib" className="hover:text-yellow-400">Manage Food Library</Link>|
            <Link href="/coach_exerciselib" className="hover:text-yellow-400">Manage Exercise Library</Link>|
            <Link href="/manage_member" className="hover:text-yellow-400">Manage Member</Link>|
            <Link href="/community" className="hover:text-yellow-400">Community</Link>|
          </>
        )}

        {user.role === 'user' && (
          <>
            <Link href="/user/foods" className="hover:text-yellow-400">Food Library</Link>|
            <Link href="/user/exercises" className="hover:text-yellow-400">Exercise Library</Link>|
          </>
        )}

        <span className="text-sm text-gray-300">
          👤 {user.name || user.member_name}
        </span>

        <button onClick={handleLogout} className="text-red-400 hover:text-red-300">
          Logout
        </button>
      </div>
    </nav>
  );
}
