"use client";

import { useRouter } from "next/navigation";
import { useState }  from "react";

export default function LogoutButton() {
  const router     = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      disabled={busy}
      className="text-xs text-white/60 hover:text-white transition disabled:opacity-50"
      title="Cerrar sesión"
    >
      {busy ? "…" : "Salir"}
    </button>
  );
}
