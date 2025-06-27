'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../components/Layout';

export default function ManageMembers() {
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 12;

  const router = useRouter();

  useEffect(() => {
    fetch('/api/Fetch_member')
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error('Failed to fetch members:', err));
  }, []);

  const handleDelete = async (ic) => {
  if (!confirm('Are you sure you want to delete this member?')) return;

  try {
    const res = await fetch(`/api/Delete_member?member_ic=${ic}`, {
      method: 'DELETE',
    });

    const result = await res.json();

    if (res.ok) {
      alert('✅ Member deleted.');
      setMembers(prev => prev.filter(m => m.member_ic !== ic));
    } else {
      alert(result.error || 'Failed to delete member.');
    }
  } catch (err) {
    console.error(err);
    alert('Server error.');
  }
};


  // Pagination logic
  const indexOfLast = currentPage * membersPerPage;
  const indexOfFirst = indexOfLast - membersPerPage;
  const currentMembers = members.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(members.length / membersPerPage);

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Layout>
      <h1 className="text-3xl font-bold mb-6">Manage Members</h1>

      {currentMembers.length === 0 ? (
        <p>No members found.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentMembers.map((member) => (
              <div key={member.member_ic} className="bg-white shadow p-4 rounded-xl">
                <h2 className="text-xl font-semibold">{member.member_name}</h2>
                <p><strong>IC:</strong> {member.member_ic}</p>
                <p><strong>Email:</strong> {member.email}</p>
                <p><strong>Gender:</strong> {member.gender}</p>
                <p><strong>Active Level:</strong> {member.active_level}</p>
                <button
                  onClick={() => router.push(`/edit_member/${member.member_ic}`)}
                  className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                    onClick={() => router.push(`/edit_member?member_ic=${member.member_ic}`)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                    Delete
                    
                  </button><hr />
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center mt-6 gap-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
            >
              ◀ Previous
            </button>
            <span className="px-4 py-2 font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 text-black rounded disabled:opacity-50"
            >
              Next ▶
            </button>
          </div>
        </>
      )}
      </Layout>
    </div>
  );
}
