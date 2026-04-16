import { redirect } from "next/navigation";

// Redirige permanentemente a la nueva ruta
export default function NarratorRedirect() {
  redirect("/admin/analisis");
}
