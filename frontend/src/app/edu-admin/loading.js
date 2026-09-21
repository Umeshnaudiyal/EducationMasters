import AdminLoader from '@/components/admin/AdminLoader';

export default function Loading() {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center bg-[#f0f0f1]">
      <AdminLoader text="Loading Education Masters Admin Portal..." subtext="Fetching the latest dashboard resources" />
    </div>
  );
}
