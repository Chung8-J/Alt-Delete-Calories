'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const bodyParts = [
  "Wrists", "Upper Chest", "Shoulders", "Triceps", "Upper Back", "Spine", "Chest", "Hip Flexors",
  "Lower Back", "Hamstrings", "Traps", "Core", "Glutes", "Quads", "Relaxation", "Balance"
];

const genres = [
  "Cardio", "Strength", "Flexibility", "Balance", "Endurance", "Stretch", "Yoga",
  "Dumbell Exercise", "Barbell Exercise", "With Machine", "Without Equipment"
];

export default function UserDashboard() {
  const [user, setUser] = useState(null);
  const [isNewcomer, setIsNewcomer] = useState(false);
  const [form, setForm] = useState({
    height: '',
    weight: '',
    goal_weight: '',
    targeted_area: '',
    exercise_genre: ''
  });
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if (!storedUser || storedUser.role !== 'user') {
      router.push('/Login');
      return;
    }

    setUser(storedUser);

    // Check if height or weight is missing
    fetch(`/api/Db_connection?member_ic=${storedUser.member_ic}&role=user`)
      .then(res => res.json())
      .then(data => {
        if (!data.height || !data.weight) {
          setIsNewcomer(true);
        }
      })
      .catch(err => console.error('❌ Error checking profile:', err));
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const height = parseFloat(form.height);
    const weight = parseFloat(form.weight);
    const goal = parseFloat(form.goal_weight);

    if (!height || !weight || !goal) {
      return alert('❌ Please enter all numbers correctly.');
    }

    if (goal < weight - 10 || goal > weight + 10) {
      return alert('❌ Goal weight must be within ±10kg of your current weight.');
    }

    if (!form.targeted_area || !form.exercise_genre) {
      return alert('❌ Please select targeted area and preferred genre.');
    }

    setLoading(true);

    const bmr = Math.round(10 * weight + 6.25 * height - 5 * user.age + (user.gender === 'Male' ? 5 : -161));
    const tdee = Math.round(bmr * 1.55); // Assume moderate activity level

    const updates = {
      height,
      weight,
      goal_weight: goal,
      targeted_area: form.targeted_area,
      exercise_genre: form.exercise_genre,
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
      const updatedUser = {
        ...user,
        ...updates,
        age: user.age,
        gender: user.gender
      };
      await generateGeminiPlan(updatedUser);
      setIsNewcomer(false);
    } else {
      alert('❌ Failed to save.');
      console.error(result);
    }

    setLoading(false);
  };

  const generateGeminiPlan = async (userData) => {
    try {
      const res = await fetch('/api/generateExercisePlan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentWeight: userData.weight,
          goalWeight: userData.goal_weight,
          height: userData.height,
          gender: user.gender,
          age: user.age,
          bmr: userData.bmr,
          tdee: userData.tdee,
          genre: userData.exercise_genre,
          targetArea: userData.targeted_area
        })
      });

      const result = await res.json();
      if (res.ok && result.plan) {
        setPlan(result.plan);
      } else {
        alert('❌ Failed to generate plan.');
      }
    } catch (err) {
      console.error('❌ Error generating plan:', err);
    }
  };

  if (!user) return <p>Loading...</p>;

  if (isNewcomer) {
    return (
      <div style={{ padding: 20 }}>
        <h2>👋 Welcome, Newcomer!</h2>
        <p>Before we start, please fill in your details:</p>

        <input
          type="number"
          name="height"
          placeholder="Height (cm)"
          value={form.height}
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="weight"
          placeholder="Weight (kg)"
          value={form.weight}
          onChange={handleChange}
        /><br /><br />

        <input
          type="number"
          name="goal_weight"
          placeholder="Goal Weight (kg)"
          value={form.goal_weight}
          onChange={handleChange}
        /><br /><br />

        <label>Targeted Area:</label><br />
        <select name="targeted_area" value={form.targeted_area} onChange={handleChange}>
          <option value="">-- Select --</option>
          {bodyParts.map((part, i) => (
            <option key={i} value={part}>{part}</option>
          ))}
        </select><br /><br />

        <label>Preferred Exercise Genre:</label><br />
        <select name="exercise_genre" value={form.exercise_genre} onChange={handleChange}>
          <option value="">-- Select --</option>
          {genres.map((g, i) => (
            <option key={i} value={g}>{g}</option>
          ))}
        </select><br /><br />

        <button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving & Generating Plan...' : '💾 Save Info'}
        </button>

        {plan && (
          <div style={{ marginTop: '30px', whiteSpace: 'pre-wrap' }}>
            <h3>🎯 Your Personalized Plan:</h3>
            <pre>{plan}</pre>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user.member_name || user.name}! This is your dashboard.</h1>

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

      {plan && (
        <div style={{ marginTop: '30px', whiteSpace: 'pre-wrap' }}>
          <h3>🎯 Your Personalized Plan:</h3>
          <pre>{plan}</pre>
        </div>
      )}
    </div>
  );
}
