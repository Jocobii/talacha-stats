import { Suspense } from "react";
import Link from "next/link";
import { Mail, Clock, CheckCircle2 } from "lucide-react";
import { Stepper } from "@/shared/ui/Stepper";
import { ResendVerification } from "@/shared/ui/ResendVerification";

interface PageProps {
	searchParams: Promise<Record<string, string>>;
}

/** Logo de marca, idéntico al de /register para consistencia. */
function BrandLogo() {
	return (
		<div className="flex items-center gap-2">
			<svg viewBox="0 0 54 44" fill="none" className="w-9 h-[30px] shrink-0">
				<rect x="0" y="29" width="7" height="12" rx="2" fill="#00E676" fillOpacity="0.35" />
				<rect x="11" y="19" width="7" height="22" rx="2" fill="#00E676" fillOpacity="0.55" />
				<rect x="22" y="10" width="7" height="31" rx="2" fill="#00E676" fillOpacity="0.75" />
				<rect x="33" y="3" width="7" height="38" rx="2" fill="#00E676" />
				<rect x="44" y="13" width="7" height="28" rx="2" fill="#00E676" fillOpacity="0.65" />
			</svg>
			<span
				className="text-[22px] font-black text-ink tracking-tight whitespace-nowrap"
				style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
			>
				Talacha<span className="text-brand-ink">Stats</span>
			</span>
		</div>
	);
}

function EmailPill({ email }: { email: string }) {
	return (
		<div className="inline-flex items-center gap-2 bg-surface border border-line rounded-full pl-3.5 pr-4 py-1.5 text-sm text-ink">
			<span className="h-2 w-2 rounded-full bg-brand" />
			{email}
		</div>
	);
}

function VerifyEmailContent({ searchParams }: { searchParams: Record<string, string> }) {
	const { error, email } = searchParams;
	const isExpired = error === "token-expired";

	if (isExpired) {
		return (
			<div className="min-h-screen bg-pitch flex items-center justify-center px-4">
				<div className="w-full max-w-sm space-y-6 text-center">
					<div className="flex justify-center">
						<BrandLogo />
					</div>

					<Stepper steps={["Crear cuenta", "Verificar correo"]} current={1} />

					<div>
						<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20">
							<Clock size={28} strokeWidth={2} className="text-amber-500" />
						</div>
						<h1 className="text-2xl font-black text-ink">Enlace expirado</h1>
						<p className="text-ink-2 text-sm mt-2 leading-relaxed">
							El enlace de verificación ya no es válido.
							<br />
							Los enlaces expiran después de 24 horas.
						</p>
					</div>

					{email && (
						<div className="flex justify-center">
							<EmailPill email={email} />
						</div>
					)}

					<div className="bg-surface border border-line rounded-2xl p-6 space-y-4">
						{email ? (
							<ResendVerification email={email} />
						) : (
							<>
								<p className="text-sm text-ink-2">
									Regístrate nuevamente para recibir un enlace fresco.
								</p>
								<Link
									href="/register"
									className="block w-full bg-brand hover:bg-brand-dim text-pitch font-bold py-3 rounded-xl transition text-sm text-center"
								>
									Volver al registro
								</Link>
							</>
						)}
					</div>

					<p className="text-xs text-ink-3">TalachaStats · Estadísticas para ligas locales</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-pitch flex items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-6 text-center">
				<div className="flex justify-center">
					<BrandLogo />
				</div>

				<Stepper steps={["Crear cuenta", "Verificar correo"]} current={1} />

				<div>
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 border border-brand/20">
						<Mail size={28} strokeWidth={2} className="text-brand-ink" />
					</div>
					<h1 className="text-2xl font-black text-ink">Revisa tu correo</h1>
					<p className="text-ink-2 text-sm mt-2 leading-relaxed">
						Te enviamos un enlace de verificación.
						<br />
						Haz clic en él para activar tu cuenta.
					</p>
				</div>

				{email && (
					<div className="flex justify-center">
						<EmailPill email={email} />
					</div>
				)}

				<div className="bg-surface border border-line rounded-2xl p-6 space-y-4 text-left">
					<div className="flex items-start gap-3">
						<CheckCircle2 size={20} strokeWidth={2} className="text-brand-ink shrink-0 mt-0.5" />
						<p className="text-sm text-ink-2">
							Revisa tu bandeja de entrada y también la carpeta de spam.
						</p>
					</div>
					<div className="flex items-start gap-3">
						<CheckCircle2 size={20} strokeWidth={2} className="text-brand-ink shrink-0 mt-0.5" />
						<p className="text-sm text-ink-2">El enlace es válido por 24 horas.</p>
					</div>
				</div>

				<div className="flex justify-center">
					{email ? (
						<ResendVerification email={email} />
					) : (
						<p className="text-sm text-ink-2">
							Si no llega en unos minutos,{" "}
							<Link
								href="/register"
								className="text-brand-ink hover:text-brand font-medium underline"
							>
								regístrate de nuevo
							</Link>
							.
						</p>
					)}
				</div>

				<p className="text-xs text-ink-3">TalachaStats · Estadísticas para ligas locales</p>
			</div>
		</div>
	);
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
	const params = await searchParams;
	return (
		<Suspense>
			<VerifyEmailContent searchParams={params} />
		</Suspense>
	);
}
