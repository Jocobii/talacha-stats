"use client";

/**
 * features/tournament-rules/ui/TiebreakerList.tsx
 * Lista arrastrable de criterios de desempate. Tonta: recibe orden + callback.
 */
import { useRef } from "react";
import { GripVertical } from "lucide-react";
import type { UserTiebreakerCriterion } from "@/entities/league-config";
import { TIEBREAKER_LABELS } from "../types";

type Props = {
	items: UserTiebreakerCriterion[];
	onChange: (items: UserTiebreakerCriterion[]) => void;
	locked?: boolean;
};

export function TiebreakerList({ items, onChange, locked }: Props) {
	const dragIdx = useRef<number | null>(null);

	const handleDrop = (dropIndex: number) => {
		const from = dragIdx.current;
		if (from === null || from === dropIndex) return;
		const next = [...items];
		const [moved] = next.splice(from, 1);
		next.splice(dropIndex, 0, moved);
		onChange(next);
		dragIdx.current = null;
	};

	return (
		<div className="flex flex-col gap-2 mt-1">
			{items.map((criterion, i) => (
				<div
					key={criterion}
					draggable={!locked}
					onDragStart={() => {
						dragIdx.current = i;
					}}
					onDragOver={(e) => e.preventDefault()}
					onDrop={() => handleDrop(i)}
					className="flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] bg-surface-2 border border-line"
					style={{ cursor: locked ? "default" : "grab" }}
				>
					<GripVertical size={16} className="text-ink-3 shrink-0" />
					<span className="font-display w-[26px] h-[26px] min-w-[26px] min-h-[26px] rounded-md bg-brand text-[#04371c] flex items-center justify-center font-extrabold text-[13px]">
						{i + 1}
					</span>
					<span className="text-[14.5px] font-semibold text-ink">
						{TIEBREAKER_LABELS[criterion]}
					</span>
				</div>
			))}
		</div>
	);
}
