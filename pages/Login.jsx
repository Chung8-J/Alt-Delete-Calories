'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../style/common.css'; 
import Footer from '../components/footer';


export default function LoginPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
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
          table: 'member',
          action: 'login',
          data: { member_name: name, password },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify({
          name: result.user.member_name,
          role: result.role,
          member_ic: result.user.member_ic,
          age: result.user.age,
          gender: result.user.gender
        }));

        if (result.role === 'admin') {
          router.push('/adminhome');
        } else {
          router.push('/userhome');
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
    
   
    <div className='login'>

        <Link href="/intro" >
          <img src="/images/logo.png" alt="Alt+Calories Logo" className="login-logo" />
        </Link>
      <h1>Login</h1>

      <label htmlFor="name"></label><br />
      <input
        type="text"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Username"
        className='login-name'
      /><br />

      <label htmlFor="password"></label><br />
      <input
        type="password"
        id="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className='login-password'
      /><br /><br />

      <button href="#" onClick={(e) => { e.preventDefault(); handleLogin(); }}>
        Login
      </button>
     

      <p>{message}</p>

      <br />
      <Link href="/Signup">Sign Up</Link><br />
      <a href="/forgetpassword">Forget password</a>
      <Footer />
    </div>
    
  );
}
