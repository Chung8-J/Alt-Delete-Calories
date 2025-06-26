'use client';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import 'bootstrap/dist/css/bootstrap.min.css';


export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/Login');
  };

  if (!user) return null;

  const avatarUrl = user.avatar
  ? user.avatar
  : (() => {
      const gender = user.gender || user.coach_gender;
      return (gender && gender.toLowerCase() === 'female')
        ? '/images/female_avt.png'
        : '/images/male_avt.png';
    })();


  const userIc = user.coach_ic || user.member_ic;

  return (
    <nav className="navbar">
      <div className="">
        {user.role === 'admin' && (
          <>
            <Link href="/adminhome" className="nav-item">🏋️ Alt+Calories</Link>|
            <Link href="/coach_foodlib" className="nav-item">Manage Food Library</Link>|
            <Link href="/coach_exerciselib" className="nav-item">Manage Exercise Library</Link>|
            <Link href="/manage_member" className="nav-item">Manage Member</Link>|
            <Link href="/community" className="nav-item">Community</Link>|
          </>
        )}

        {user.role === 'user' && (
          <>
            <Link href="/userhome" className="nav-item">🏋️ Alt+Calories</Link>|
            <Link href="/user/foods" className="nav-item">Food Library</Link>|
            <Link href="/user/exercises" className="nav-item">Exercise Library</Link>|
            <Link href="/community" className="nav-item">Community</Link>|
          </>
        )}

        {/* Avatar Dropdown */}
        <div className="" ref={dropdownRef} style={{float:'right'}}>
          <button
            onClick={() => setShowDropdown(p => !p)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                objectFit: 'cover',
                verticalAlign: 'middle',
                border: '2px solid white'
              }}
            />
            <span style={{ fontSize: '14px', verticalAlign: 'middle', marginLeft: '8px' }}>
              {user.name || user.member_name}
            </span>
          </button>


          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-50">
              <ul style={{ listStyleType: 'none' }}>
                <li>
                  <Link
                    href={`/adminprofile/${userIc}`}
                    className="block px-4 py-2 hover:bg-gray-100"
                  >
                    View/Edit Profile
                  </Link>
                </li>
                <li>
                  <a
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    style={{ border: 'none',background_colour:'none' }}
                  >
                    Logout
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}