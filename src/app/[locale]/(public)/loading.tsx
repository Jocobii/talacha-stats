import { getTranslations } from "next-intl/server";

export default async function PublicLoading() {
	const t = await getTranslations("common");

	return (
		<div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] gap-3">
			<div className="relative w-16 h-16">
				{/* ARO SPINNER */}
				<div className="absolute inset-0 rounded-full border-2 border-gray-200 border-t-green-500 animate-spin" />
			</div>

			<p className="text-brand-ink text-sm font-semibold mt-1">{t("loading")}</p>
		</div>
	);
}
