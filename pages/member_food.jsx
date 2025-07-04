'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import FoodLibrary from '@/components/FoodLibrary';

export default function UserFoodsPage() {
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'user') {
      router.push('/Login');
    } else {
      setRole('user');
    }
  }, []);

  if (!role) return null;

  return <FoodLibrary role={role} />;
}
