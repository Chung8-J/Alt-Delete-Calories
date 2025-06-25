import { useRouter } from 'next/router';
import EditFood from '@/pages/edit_food'; // This should be your actual component

export default function EditFoodPage() {
  const router = useRouter();
  const {code} = router.query;

  // Render your component and pass the code
  return <EditFood code={code} />;
}
