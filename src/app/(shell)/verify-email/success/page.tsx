import { redirect } from "next/navigation";
import Link from "next/link";
import { Check, Circle } from "lucide-react";
import { getSessionUser, redirectToLogin } from "@/shared/lib/auth";
import { Stepper } from "@/shared/ui/Stepper";

/**
 * Paso intermedio de celebración tras verificar el correo (redirigido desde
 * GET /api/auth/verify-email). Requiere sesión activa — si no hay usuario o
 * ya tiene organización, no hay nada que celebrar aquí.
 */
export default async function VerifyEmailSuccessPage() {
	const user = await getSessionUser();
	if (!user) redirectToLogin();
	if (user.organizationId) redirect("/admin");

	const firstName = user.name.split(" ")[0] || "organizador";

	return (
		<div className="min-h-screen bg-pitch flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-sm space-y-6 text-center">
				<Stepper steps={["Crear cuenta", "Verificar correo"]} current={2} />

				<div>
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/15 border border-brand/30">
						<Check size={30} strokeWidth={2.5} className="text-brand-ink" />
					</div>
					<h1 className="text-2xl font-black text-ink">¡Todo listo, {firstName}!</h1>
					<p className="text-ink-2 text-sm mt-2 leading-relaxed">
						Tu cuenta quedó verificada. Ya puedes empezar a armar tu liga.
					</p>
				</div>

				<div className="bg-surface border border-line rounded-2xl p-4 text-left divide-y divide-line">
					<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
						<Check size={15} strokeWidth={2.5} className="text-brand-ink shrink-0" />
						Cuenta de organizador <b className="text-ink">creada</b>
					</div>
					<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
						<Check size={15} strokeWidth={2.5} className="text-brand-ink shrink-0" />
						Correo <b className="text-ink">verificado</b>
					</div>
					<div className="flex items-center gap-2.5 py-2 text-sm text-ink-2">
						<Circle size={15} strokeWidth={2} className="text-ink-3 shrink-0" />
						Siguiente: <b className="text-ink">crea tu primera liga</b>
					</div>
				</div>

				<div className="flex flex-col gap-2.5">
					<Link
						href="/onboarding"
						className="w-full bg-brand hover:bg-brand-dim text-pitch font-bold py-3 rounded-xl transition text-sm text-center"
					>
						Crear mi primera liga →
					</Link>
					<Link
						href="/"
						className="w-full bg-surface-2 hover:bg-surface-3 border border-line text-ink-2 hover:text-ink font-semibold py-3 rounded-xl transition text-sm text-center"
					>
						Volver a la página principal
					</Link>
				</div>
			</div>
		</div>
	);
}
