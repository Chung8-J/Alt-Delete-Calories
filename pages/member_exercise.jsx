'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExerciseLibrary from '@/components/ExerciseLibrary';

export default function UserExercisesPage() {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'user') {
      router.push('/Login');
    } else {
      setRole('user');
    }
  }, []);

  if (!role) return null;

  return <ExerciseLibrary role={role} />;
}
