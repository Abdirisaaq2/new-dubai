import AdminSkeleton from "@/components/admin-skeleton";

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#f4f5f7] p-4 text-black sm:p-6">
      <div className="mx-auto max-w-7xl">
        <AdminSkeleton />
      </div>
    </main>
  );
}
