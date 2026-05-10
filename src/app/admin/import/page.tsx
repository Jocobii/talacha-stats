import { redirect } from "next/navigation";

/**
 * Legacy import route — redirects to the unified imports page.
 */
export default function ImportRedirect() {
	redirect("/admin/imports");
}
