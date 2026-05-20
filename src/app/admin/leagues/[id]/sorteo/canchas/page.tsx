/**
 * /admin/leagues/[id]/sorteo/canchas → redirect permanente a /canchas
 * La sección de canchas se movió al tab propio de la liga.
 */

import { redirect } from "next/navigation";

type Params = { params: Promise<{ id: string }> };

export default async function LegacyCanchasRedirect({ params }: Params) {
	const { id } = await params;
	redirect(`/admin/leagues/${id}/canchas`);
}
