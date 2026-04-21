import { getSessionUser } from "@/shared/lib/auth";
import { listUsers } from "@/entities/user";
import NewLeagueForm from "./NewLeagueForm";

export default async function NewLeaguePage() {
  const session = await getSessionUser();

  const organizers =
    session?.role === "owner"
      ? (await listUsers()).filter((u) => u.role === "organizer" && u.active)
      : [];

  return <NewLeagueForm organizers={organizers} />;
}
