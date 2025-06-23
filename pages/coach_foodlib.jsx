'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FoodLibrary from '@/components/FoodLibrary';

export default function CoachFoodsPage() {
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
      router.push('/login');
    } else {
      setRole('admin');
    }
  }, []);

  if (!role) return null;

  return <FoodLibrary role={role} />;
}
