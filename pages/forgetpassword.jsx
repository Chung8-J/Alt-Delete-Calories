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
    <div className="reset_password" >
      <div className="" style={{
          width:'500px',
          margin: '140px auto',
          padding: '40px 40px 30px 40px',
          background: 'linear-gradient(to right, #122C6F, #8215ca,#122C6F )' ,
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
          fontSize:'20px'
         }}>
        <h2 className="" style={{textAlign:'center',marginBottom:'20px'}}>Reset Password</h2>

        <form onSubmit={handleReset} className="space-y-4">
          <div style={{marginBottom:'8px'}}>
            <label className="">Email: </label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{  
                      width: '84.5%',
                      padding: '5px',
                      marginTop: '8px',
                      color: 'black',
                      border: 'none',
                      borderRadius:'5px',
                      borderBottom: '1px solid #ccc'
                    }}
              required
            />
          </div>

          <div style={{marginBottom:'8px'}}>
            <label className="block text-sm font-medium">New Password: </label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{  
                      width: '65%',
                      padding: '5px',
                      marginTop: '8px',
                      color: 'black',
                      border: 'none',
                      borderRadius:'5px',
                      borderBottom: '1px solid #ccc'
                    }}
              required
            />
          </div>

          <div style={{marginBottom:'18px'}}>
            <label className="">Confirm Password: </label>
            <input
              type="password"
              className="w-full p-2 border rounded-lg"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{  
                      width: '58%',
                      padding: '5px',
                      marginTop: '8px',
                      color: 'black',
                      border: 'none',
                      borderRadius:'5px',
                      borderBottom: '1px solid #ccc'
                    }}
              required
            />
          </div>

          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <button
              type="submit"
              style={{
                fontWeight: 'bold',
                fontSize: '15px',
                background: 'rgba(103, 255, 15, 0.86)',
                color: 'black',
                padding: '10px 18px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Reset Password
            </button>
          </div>
        </form>
        <Footer />
      </div>
    </div>
  );
}
