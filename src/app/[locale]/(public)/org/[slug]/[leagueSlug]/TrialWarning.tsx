import { CircleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

async function TrialWarning({ org }: { org: { name: string } }) {
	const t = await getTranslations("org");

	return (
		<div className="w-full px-4 py-2.5 text-center">
			<p className="text-sm inline-flex items-center justify-center gap-2">
				<CircleAlertIcon className="w-4 h-4" />
				<span>
					{t.rich("trialWarning", {
						name: org.name,
						strong: (chunks) => <strong>{chunks}</strong>,
						badge: (chunks) => <span className="text-amber-700 font-semibold">{chunks}</span>,
					})}
				</span>
			</p>
		</div>
	);
}

export default TrialWarning;
