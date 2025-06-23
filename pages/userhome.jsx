'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [isNewcomer, setIsNewcomer] = useState(false);
  const [form, setForm] = useState({ height: '', weight: '', goal_weight: '' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || storedUser.role !== 'user') {
      router.push('/Login');
      return;
    }

    setUser(storedUser);

    // Check if newcomer
    fetch(`/api/Db_connection?member_ic=${storedUser.member_ic}&role=user`)
      .then(res => res.json())
      .then(data => {
        if (!data.height || !data.weight) {
          setIsNewcomer(true);
        }
      })
      .catch(err => console.error('Error checking user info:', err));
  }, [router]);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);
    const goal = parseFloat(form.goal_weight);

    if (isNaN(height) || isNaN(weight) || isNaN(goal)) {
      return alert('❌ Please enter valid numbers.');
    }

    const diff = goal - weight;
    if (diff < -10 || diff > 10) {
      return alert('❌ Goal weight should be within ±10kg of current weight.');
    }

    // BMR (Mifflin-St Jeor)
    const bmr = Math.round(10 * weight + 6.25 * height - 5 * 20 + 5); // assume age 20, male
    const tdee = Math.round(bmr * 1.55); // moderate active

    const updates = {
      height,
      weight,
      goal_weight: goal,
      bmr,
      tdee
    };

    const res = await fetch('/api/Db_connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'member',
        action: 'update_profile',
        data: {
          member_ic: user.member_ic,
          role: 'user',
          updates
        }
      })
    });

    const result = await res.json();
    if (res.ok) {
      alert('✅ Info saved!');
      setIsNewcomer(false);
    } else {
      alert('❌ Failed to save');
      console.error(result);
    }
  };

  if (!user) return <p>Loading...</p>;

  if (isNewcomer) {
    return (
      <div style={{ padding: 20 }}>
        <h2>👋 Welcome Newcomer!</h2>
        <p>Please enter your info:</p>

        <input
          type="number"
          name="height"
          placeholder="Height (cm)"
          value={form.height}
          onChange={handleInput}
        /><br /><br />

        <input
          type="number"
          name="weight"
          placeholder="Current Weight (kg)"
          value={form.weight}
          onChange={handleInput}
        /><br /><br />

        <input
          type="number"
          name="goal_weight"
          placeholder="Goal Weight (kg)"
          value={form.goal_weight}
          onChange={handleInput}
        /><br /><br />

        <button onClick={handleSave}>💾 Save Info</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.member_name|| user.name}! This is your dashboard.</h1>

      <a href="/community">Community</a> <br /><br />
      <a href="/member_exercise">Exercise Library</a> <br /><br />
      <a href="/member_food">Food Library</a> <br /><br />
      <a href="#">Customize plan</a> <br /><br />
      <a href="#">Calories Calculator</a> <br /><br />
      <a href="/userprofile">Profile</a> <br /><br />

      <button
        onClick={() => {
          localStorage.removeItem('user');
          router.push('/Login');
        }}
      >
        Logout
      </button>
    </div>
  );
}
