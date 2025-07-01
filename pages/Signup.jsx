'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../style/common.css'; 
import Footer from '../components/footer';

export default function SignupPage() {
  const [ic, setIc] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [repassword, setRepassword] = useState('');
  const [birth, setBirth] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    const trimmedIc = ic.trim();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedIc || !trimmedName || !password || !repassword || !birth || !trimmedEmail || !age || !gender) {
      window.alert('⚠️ Please fill in all fields.');
      return;
    }

    if (!/^\d{12}$/.test(trimmedIc)) {
      window.alert('❌ IC must be exactly 12 digits.');
      return;
    }

    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      window.alert('❌ Please enter a valid email address.');
      return;
    }

    if (password !== repassword) {
      window.alert('❌ Passwords do not match.');
      return;
    }

    if (!/^\d+$/.test(age) || parseInt(age) <= 0) {
      window.alert('❌ Age must be a positive number.');
      return;
    }

    try {
      const response = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'member',
          action: 'create',
          data: {
            member_ic: trimmedIc,
            member_name: trimmedName,
            password,
            d_birth: birth,
            email: trimmedEmail,
            age: parseInt(age),
            gender
          },
        }),
      });

      const result = await response.json();

      if (response.ok) {
        window.alert('✅ Signup successful!');
        router.push('/Login');
      } else {
        window.alert('❌ ' + result.error);
      }
    } catch (err) {
      window.alert('❌ Failed to connect to server.');
      console.error(err);
    }
  };

  return (
    <div className='signup'>
      <h1>Sign Up</h1>

      <label htmlFor="ic">IC Number (12 digits):</label><br />
      <input type="text" id="ic" value={ic} onChange={(e) => setIc(e.target.value)} placeholder="e.g. 050203021224" maxLength={12} /><br /><br />

      <label htmlFor="name">Username:</label><br />
      <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your username" /><br /><br />

      <label htmlFor="password">Password:</label><br />
      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" /><br /><br />

      <label htmlFor="repassword">Re-enter Password:</label><br />
      <input type="password" id="repassword" value={repassword} onChange={(e) => setRepassword(e.target.value)} placeholder="Re-enter your password" /><br /><br />

      <label htmlFor="birth">Date of Birth:</label><br />
      <input type="date" id="birth" value={birth} onChange={(e) => setBirth(e.target.value)} /><br /><br />

      <label htmlFor="age">Age:</label><br />
      <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Enter your age" /><br /><br />

      <label htmlFor="gender">Gender:</label><br />
      <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">-- Select Gender --</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select><br /><br />

      <label htmlFor="email">Email:</label><br />
      <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" /><br /><br />

      <button onClick={handleSignup}>Sign Up</button><br /><br />
      <Link href="/Login">Back to Login</Link>
      <Footer />
    </div>
  );
}
