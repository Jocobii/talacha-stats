import { CircleAlertIcon } from "lucide-react";

function TrialWarning({ org }: { org: { name: string } }) {
	return (
		<div className="w-full px-4 py-2.5 text-center">
			<p className="text-sm inline-flex items-center justify-center gap-2">
				<CircleAlertIcon className="w-4 h-4" />
				<span>
					<strong>{org.name}</strong> esta en{" "}
					<span className="text-amber-700 font-semibold">modo trial</span> — los datos no aparecen
					en los rankings publicos todavia.
				</span>
			</p>
		</div>
	);
}

export default TrialWarning;
