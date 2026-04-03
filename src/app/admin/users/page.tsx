import { getAllUsers } from "@/lib/users";
import AdminUsersTable from "@/components/admin/AdminUsersTable";

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="min-h-screen py-12 px-6 md:px-12">
      <h1 className="text-white text-2xl font-mono uppercase tracking-wider mb-8">
        User Management
      </h1>
      <AdminUsersTable initialUsers={users} />
    </div>
  );
}
