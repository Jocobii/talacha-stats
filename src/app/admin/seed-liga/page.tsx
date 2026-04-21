import { getSessionUser } from "@/shared/lib/auth";
import { listUsers } from "@/entities/user";
import SeedLigaForm from "./SeedLigaForm";

export default async function SeedLigaPage() {
  const session = await getSessionUser();

  const organizers =
    session?.role === "owner"
      ? (await listUsers())
          .filter((u) => u.role === "organizer" && u.active)
          .map((u) => ({ id: u.id, name: u.name, email: u.email }))
      : [];

  return <SeedLigaForm organizers={organizers} isOwner={session?.role === "owner"} />;
}
