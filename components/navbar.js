'use client';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import '../style/common.css';

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
    : (user.gender == 'female' || user.coach_gender == 'female')
    ? '/user_avatar/female_avt.png'
    : '/user_avatar/male_avt.png';

  const userIc = user.coach_ic || user.member_ic;

  return (
    <nav className="loginnavbar">
      <div className="loginnavbar-components">
        <div className="nav-links flex gap-3 items-center">
          {user.role === 'admin' && (
            <>
              <Link href="/adminhome" className="hover:text-yellow-400">
               <img src="/images/logo.png" alt="Alt+Calories Logo" className="Logo" />
              </Link>
              <Link href="/coach_foodlib" className="hover:text-yellow-400">Manage Food Library</Link>
              <Link href="/coach_exerciselib" className="hover:text-yellow-400">Manage Exercise Library</Link>
              <Link href="/manage_member" className="hover:text-yellow-400">Manage Member</Link>
              <Link href="/caloriescalculator" className="hover:text-yellow-400">Calories Calculator</Link>
              <Link href="/community" className="hover:text-yellow-400">Community</Link>
              <Link href="/feedback_list" className="hover:text-yellow-400">Feeback List</Link>
            </>
          )}
          {user.role === 'user' && (
            <>
              <Link href="/userhome" className="hover:text-yellow-400">
                <img src="/images/logo.png" alt="Alt+Calories Logo" className="Logo" />
              </Link>
              <Link href="/member_food" className="hover:text-yellow-400">Food Library</Link>
              <Link href="/member_exercise" className="hover:text-yellow-400">Exercise Library</Link>
              <Link href="/caloriescalculator" className="hover:text-yellow-400">Calories Calculator</Link>
              <Link href="/customizeplan" className="hover:text-yellow-400">Workout/Diet Plan</Link>
              <Link href="/community" className="hover:text-yellow-400">Community</Link>
            </>
          )}
        </div>

        {/* Avatar Dropdown */}
        <div className="usertab" ref={dropdownRef}
          style={{
                borderRadius: '5px',
                objectFit: 'cover',
                verticalAlign: 'middle',
                border: '2px solid',
                color: 'green',
                width:'120px',
                backgroundColor:'blue'
              }}
          >
          <button
            onClick={() => setShowDropdown(p => !p)}
            className="flex items-center gap-2 focus:outline-none"
          >
            <img
              src={avatarUrl}
              alt="avatar"
              className="usertab-avatar"
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                objectFit: 'cover',
                verticalAlign: 'middle',
                marginLeft:'5px'
              }}
            />
            <span className="usertab-name" style={{padding:'0.894rem'}}>{user.name || user.member_name}</span>
          </button>

          {showDropdown && (
            <div className="dropdown" style={{ minWidth: '160px', float:'right' }}>
              <ul style={{ listStyleType: 'none', }}>
                <li>
                  <Link
                    href={
                      user.role === 'admin'
                        ? '/adminprofile'
                        : userIc
                        ? `/userprofile`
                        : '#'
                    }
                  >
                    View/Edit Profile
                  </Link>
                </li>
                <li>
                  <a
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
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

