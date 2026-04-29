import { getSessionUser } from "@/shared/lib/auth";
import { redirect }       from "next/navigation";
import NewOrganizationForm from "./NewOrganizationForm";

export default async function NewOrganizationPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  if (session.role !== "owner") redirect("/admin/organizations");

  return <NewOrganizationForm />;
}
