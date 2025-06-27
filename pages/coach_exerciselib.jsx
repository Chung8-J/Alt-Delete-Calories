'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ExerciseLibrary from '@/components/ExerciseLibrary';
import Layout from '../components/Layout';


export default function CoachExercisesPage() {
  const router = useRouter();
  const [role, setRole] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      router.push('/login');
    } else {
      setRole('admin');
    }
  }, []);

  if (!role) return null;

  return <ExerciseLibrary role={role} />;
}
