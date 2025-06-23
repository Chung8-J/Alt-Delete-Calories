import { useRouter } from 'next/router';
import EditExercise from '@/pages/edit_exercise'; // This should be your actual component

export default function EditExercisePage() {
  const router = useRouter();
  const { id } = router.query;

  // Render your component and pass the ID
  return <EditExercise id={id} />;
}
