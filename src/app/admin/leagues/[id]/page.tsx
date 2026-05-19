import { redirect } from "next/navigation";

/**
 * Redirect permanente a /posiciones (tab por defecto de la liga).
 * La cabecera y tab bar viven en layout.tsx.
 */
export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	redirect(`/admin/leagues/${id}/posiciones`);
}
