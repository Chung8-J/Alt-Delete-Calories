'use client';
import { useState } from 'react';
import { useRouter } from 'next/router';
import '../style/common.css'; 
import Footer from '../components/footer';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email || !newPassword || !confirmPassword) {
      window.alert('❌ All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      window.alert('❌ Passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/Db_connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'member',
          action: 'reset_password',
          data: { email, newPassword }
        })
      });

      const result = await res.json();

      if (res.ok) {
        window.alert(result.message);
        router.push('/Login'); // <-- Redirect to login page
      } else {
        window.alert((result.error || 'Reset failed'));
        router.push('/forgotpassword'); // <-- Stay on this page
      }
    } catch (err) {
      console.error('❌ Reset error:', err);
      window.alert('❌ Server error occurred');
      router.push('/forgotpassword');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4 text-center">🔐 Reset Password</h2>

        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">New Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            🔄 Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
