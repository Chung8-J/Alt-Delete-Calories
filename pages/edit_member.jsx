'use client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Footer from '../components/footer';
import '../style/common.css';

export default function EditMemberPage() {
  const router = useRouter();
  const { member_ic } = router.query;

  const [originalIc, setOriginalIc] = useState('');
  const [member, setMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!member_ic) return;
    fetch(`/api/Fetch_member_by_ic?member_ic=${member_ic}`)
      .then(res => res.json())
      .then(data => {
        if (data.d_birth) {
          const age = calculateAge(data.d_birth);
          const { bmr, tdee } = calculateBmrTdee(data.weight, data.height, age, data.gender, data.active_level);
          setMember({ ...data, age, bmr, tdee });
          setOriginalIc(data.member_ic); // 👈 Save original IC for WHERE clause
        } else {
          setMember(data);
        }
      })
      .catch(() => setMessage('Failed to load member data.'));
  }, [member_ic]);

  const calculateAge = (dob) => {
    const birth = new Date(dob);
    const now = new Date();
    return now.getFullYear() - birth.getFullYear();
  };

  const calculateBmrTdee = (weight, height, age, gender, active_level) => {
    const bmr = gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const levelMap = {
      Sedentary: 1.2,
      'Lightly active': 1.375,
      'Moderately active': 1.55,
      'Very active': 1.725,
      'Extra active': 1.9
    };

    const tdee = Math.round(bmr * (levelMap[active_level] || 1.2));
    return { bmr: Math.round(bmr), tdee };
  };

  const handleChange = (e) => {
    const updated = { ...member, [e.target.name]: e.target.value };

    if (['d_birth', 'weight', 'height', 'gender', 'active_level'].includes(e.target.name)) {
      const age = calculateAge(updated.d_birth);
      const { bmr, tdee } = calculateBmrTdee(updated.weight, updated.height, age, updated.gender, updated.active_level);
      updated.age = age;
      updated.bmr = bmr;
      updated.tdee = tdee;
    }

    setMember(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/Edit_member', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...member,
          original_ic: originalIc // 👈 Include original IC separately
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Member updated');
        router.push('/manage_member');
      } else {
        setMessage(result.error || 'Update failed.');
      }
    } catch (err) {
      setMessage('Server error.');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const res = await fetch('/api/Edit_member_password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_ic: originalIc, password: newPassword })
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Password updated');
        setShowModal(false);
        setNewPassword('');
      } else {
        alert(result.error || 'Password update failed');
      }
    } catch (err) {
      alert('Server error');
    }
  };

  if (!member) return <p>Loading...</p>;

  return (
    <div className="edit_food" style={{margin:'180px auto', width:'86%'}}>
      <Layout>
      <h1 className="text-2xl font-bold mb-4" style={{marginBottom:'50px',fontSize:'40px'}}>Edit Member</h1>

      <form onSubmit={handleSubmit} className="space-y-4" 
            style={{
              background: 'linear-gradient(135deg, #122C6F, #8215ca, #122C6F)',
              borderRadius: '20px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: '3px solid rgb(103, 255, 15)',
              marginTop: '20px', 
              padding:'30px',
              gap:'10px',
              lineHeight:'450%'
            }}>
        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>IC Number: </label>
          <input type="text" name="member_ic" value={member.member_ic} onChange={handleChange} className="w-full border p-2 rounded" 
          style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Name: </label>
          <input type="text" name="member_name" value={member.member_name} onChange={handleChange} className="w-full border p-2 rounded"
            style={{
                    verticalAlign:'middle',
                    padding: '8px 10px',
                    border:'1px solid ',
                    borderRadius:'5px',
                    fontSize:'18px'
                  }} />
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Date of Birth: </label>
          <input type="date" name="d_birth" value={member.d_birth} onChange={handleChange} className="w-full border p-2 rounded" 
            style={{
                    verticalAlign:'middle',
                    padding: '8px 10px',
                    border:'1px solid ',
                    borderRadius:'5px',
                    fontSize:'18px'
                  }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Email: </label>
          <input type="email" name="email" value={member.email} onChange={handleChange} className="w-full border p-2 rounded" 
            style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Height (cm): </label>
          <input type="number" name="height" value={member.height} onChange={handleChange} className="w-full border p-2 rounded" 
            style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Weight (kg): </label>
          <input type="number" name="weight" value={member.weight} onChange={handleChange} className="w-full border p-2 rounded" 
           style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Goal Weight (kg): </label>
          <input type="number" name="goal_weight" value={member.goal_weight} onChange={handleChange} className="w-full border p-2 rounded" 
            style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}/>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Gender: </label>
          <select name="gender" value={member.gender} onChange={handleChange} className="w-full border p-2 rounded"
                  style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold" style={{fontSize:'20px',fontWeight:'bold'}}>Activity Level: </label>
          <select name="active_level" value={member.active_level} onChange={handleChange} className="w-full border p-2 rounded"
                  style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px'
                }}>
            <option>Sedentary</option>
            <option>Lightly active</option>
            <option>Moderately active</option>
            <option>Very active</option>
            <option>Extra active</option>
          </select>
        </div>

        <p className="text-gray-700 mt-2"
           style={{
                  verticalAlign:'middle',
                  lineHeight:'150%',
                  fontSize:'20px'
                }}>
          <strong>Auto-calculated: </strong><br /> 
          Age: {member.age}<br /> 
          BMR: {member.bmr}<br /> 
          TDEE: {member.tdee}<br /> 
        </p>

        <div className="flex gap-4 mt-4">
          <button type="submit" class="update-btn"
          style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      marginRight:'10px',
                      fontWeight:'bold',
                      width:'20%',
                      backgroundColor:'rgb(0, 209, 0)' 
                    }}
          >Save Changes</button>

          <button
            type="button"
            onClick={() => {
              setShowModal(false);
              router.push('/manage_member');
            }}
            className="update-btn"
            style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      marginRight:'10px',
                      fontWeight:'bold',
                      width:'20%',
                      backgroundColor:'rgb(198, 2, 2)' 
                    }}
          >
            Cancel
          </button>

          <button type="button" onClick={() => setShowModal(true)} className="update-btn"
            style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      fontWeight:'bold',
                      width:'20%',
                      backgroundColor:'rgb(202, 221, 0)' 
                    }}>
            Change Password</button>
        </div>
        {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <hr />
            <h2 className="" style={{marginBottom:'0px',fontSize:'30px'}}>Change Password</h2>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="w-full border p-2 mb-4"
              style={{
                  verticalAlign:'middle',
                  padding: '8px 10px',
                  border:'1px solid ',
                  borderRadius:'5px',
                  fontSize:'18px',
                  marginTop:'-20px'
                }}
            />
            <div className="flex justify-end gap-2" style={{marginTop:'-10px'}}>
              <button onClick={() => setShowModal(false)} class="update-btn"
                      style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      fontWeight:'bold',
                      marginRight:'10px',
                      width:'30%',
                      backgroundColor:'rgb(198, 2, 2)' 
                    }}>
                    Cancel</button>
              <button onClick={handlePasswordUpdate} class="update-btn"
                      style={{
                      verticalAlign:'middle',
                      padding: '10px 15px',
                      border:'1px solid ',
                      borderRadius:'5px',
                      fontSize:'18px',
                      fontWeight:'bold',
                      width:'30%',
                      backgroundColor:'rgb(0, 209, 0)' 
                    }}>
                    Update</button>
            </div>
          </div>
        </div>
      )}

      {message && <p className="text-red-500 mt-3">{message}</p>}
      </form>
      
      </Layout>
      <Footer />
    </div>
  );
}
