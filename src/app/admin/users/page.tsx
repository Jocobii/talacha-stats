import { redirect }       from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import { listUsers }      from "@/entities/user";
import UsersClient        from "./UsersClient";

export default async function UsersPage() {
  const session = await getSessionUser();
  if (!session || session.role !== "owner") redirect("/admin");

  const users = await listUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
          <p className="text-sm text-gray-400 mt-0.5">Organizadores con acceso al panel</p>
        </div>
      </div>
      <UsersClient users={users} currentUserId={session.id} />
    </div>
  );
}
