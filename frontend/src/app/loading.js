import AdminLoader from '@/components/admin/AdminLoader';

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white">
      <AdminLoader text="Loading Education Masters..." subtext="Connecting to live education data" />
    </div>
  );
}
