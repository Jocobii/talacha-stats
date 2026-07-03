import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
	const user = await getSessionUser();

	if (!user) redirect("/login");

	// Already completed onboarding — go to admin
	if (user.organizationId) redirect("/admin");

	return (
		<div className="flex min-h-screen items-center justify-center bg-pitch px-4 py-10">
			<div className="w-full max-w-5xl space-y-8">
				{/* Header */}
				<div className="text-center">
					<p className="mb-3 text-4xl">⚽</p>
					<h1 className="text-2xl font-black text-ink">Bienvenido, {user.name.split(" ")[0]}</h1>
					<p className="mt-1 text-sm text-ink-2">
						Crea tu organización: primero el nombre, luego cómo se ve.
					</p>
				</div>

				<OnboardingForm />
			</div>
		</div>
	);
}
