import { useRouter } from 'next/router';
import EditMember from '../edit_member'; // ✅ relative import

export default function EditMemberPage() {
  const router = useRouter();
  const { member_ic } = router.query;

  return <EditMember member_ic={member_ic} />;
}
