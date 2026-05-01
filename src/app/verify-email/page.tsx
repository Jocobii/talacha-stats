import { Suspense } from "react";
import Link from "next/link";

interface PageProps {
	searchParams: Promise<Record<string, string>>;
}

async function VerifyEmailContent({ searchParams }: { searchParams: Record<string, string> }) {
	const { error } = searchParams;
	const isExpired = error === "token-expired";

	if (isExpired) {
		return (
			<div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
				<div className="w-full max-w-sm space-y-8 text-center">
					<div>
						<p className="text-5xl mb-4">⏱️</p>
						<h1 className="text-2xl font-black text-white">Enlace expirado</h1>
						<p className="text-gray-400 text-sm mt-2 leading-relaxed">
							El enlace de verificacion ya no es valido.
							<br />
							Los enlaces expiran despues de 24 horas.
						</p>
					</div>
					<div className="bg-gray-900 rounded-2xl p-6 space-y-4">
						<p className="text-sm text-gray-300">
							Registrate nuevamente para recibir un enlace fresco.
						</p>
						<Link
							href="/register"
							className="block w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition text-sm text-center"
						>
							Volver al registro
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-8 text-center">
				<div>
					<p className="text-5xl mb-4">📬</p>
					<h1 className="text-2xl font-black text-white">Revisa tu correo</h1>
					<p className="text-gray-400 text-sm mt-2 leading-relaxed">
						Te enviamos un enlace de verificacion.
						<br />
						Haz clic en el para activar tu cuenta.
					</p>
				</div>

				<div className="bg-gray-900 rounded-2xl p-6 space-y-4 text-left">
					<div className="flex items-start gap-3">
						<span className="text-green-500 mt-0.5">✓</span>
						<p className="text-sm text-gray-300">
							Revisa tu bandeja de entrada y tambien la carpeta de spam.
						</p>
					</div>
					<div className="flex items-start gap-3">
						<span className="text-green-500 mt-0.5">✓</span>
						<p className="text-sm text-gray-300">El enlace es valido por 24 horas.</p>
					</div>
					<div className="flex items-start gap-3">
						<span className="text-yellow-500 mt-0.5">!</span>
						<p className="text-sm text-gray-300">
							Si no llega en unos minutos,{" "}
							<Link href="/register" className="text-green-500 hover:text-green-400 underline">
								registrate de nuevo
							</Link>
							.
						</p>
					</div>
				</div>

				<p className="text-xs text-gray-600">TalachaStats · Estadisticas para ligas locales</p>
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
