/**
 * /admin/canchas — movido al hub de organización (docs/ORG-PROFILE-HUB.md R1).
 * Redirect para no romper enlaces/bookmarks existentes. CanchasClient y sus
 * piezas siguen viviendo en esta carpeta — el tab del hub las importa
 * directamente (../../canchas/CanchasClient).
 */

import { redirect } from "next/navigation";

export default function CanchasPage() {
	redirect("/admin/organizacion/canchas");
}
