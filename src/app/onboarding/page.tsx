import { redirect } from "next/navigation";
import { getSessionUser } from "@/shared/lib/auth";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
	const user = await getSessionUser();

	if (!user) redirect("/login");

	// Already completed onboarding — go to admin
	if (user.organizationId) redirect("/admin");

	return (
		<div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
			<div className="w-full max-w-sm space-y-8">
				{/* Header */}
				<div className="text-center">
					<p className="text-4xl mb-3">⚽</p>
					<h1 className="text-2xl font-black text-white">Bienvenido, {user.name.split(" ")[0]}</h1>
					<p className="text-gray-400 text-sm mt-1">Cuéntanos el nombre de tu liga</p>
				</div>

				<OnboardingForm />
			</div>
		</div>
	);
}
