'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!name || !password) {
      window.alert('⚠️ Please enter both username and password without blank.');
      return;
    }

    try {
     const response = await fetch('/api/Db_connection', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    table: 'member', // <-- Add this line
    action: 'login',
    data: { member_name: name, password },
  }),
});
      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(result.user));

        if (result.role === 'admin') {
          router.push('/adminhome'); // Redirect to admin dashboard
        } else {
          router.push('/userhome'); // Redirect to user dashboard
        }
      } else {
        alert(result.error || 'Invalid credentials');
      }
    } catch (err) {
      window.alert('❌ Failed to connect to server.');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Login</h1>

      <label htmlFor="name">Name:</label><br />
      <input
        type="text"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your username"
      /><br /><br />

      <label htmlFor="password">Password:</label><br />
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      /><br /><br />

      <a href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>
        Login
      </a>

      <p style={{ color: 'red' }}>{message}</p>

      <br />
      <Link href="/Signup">Sign Up</Link><br />
      <a href="/forgetpassword">Forget password</a>
    </div>
  );
}
