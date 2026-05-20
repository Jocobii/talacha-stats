/**
 * bracket-generator.ts
 *
 * Pure function — no DB, no side effects.
 * Generates the SlotSpec[] for a single-elimination bracket given a list of
 * seeded teams. Supports bracket sizes B = 2, 4, or 8.
 *
 * Seeding for B=8: 1v8, 4v5, 2v7, 3v6 (classic format).
 * Byes: when actual team count < B, the top-ranked seeds get a BYE in R1 and
 * advance automatically to QF/SF.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type BracketTeam = {
	id: string;
	name: string;
	seed: number; // 1-based position in standings
};

export type SlotFromType = "winner" | "loser";

export type SlotSpec = {
	round: number; // 1 = R1/QF, 2 = SF, 3 = Final/3rd
	slotIndex: number; // 0-based within the round
	isThirdPlace: boolean;
	isBye: boolean;
	homeTeamId: string | null;
	awayTeamId: string | null;
	// Keys of the slot that feeds into this slot (used to set FKs after insert)
	homeFromSlotKey: string | null; // "R{round}S{slotIndex}" of feeding slot
	awayFromSlotKey: string | null;
	homeFromType: SlotFromType | null;
	awayFromType: SlotFromType | null;
};

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Classic seeding matchups per bracket size.
 * Each tuple is [topSeed, bottomSeed] for slotIndex order 0,1,2,3.
 */
const SEEDINGS: Record<number, [number, number][]> = {
	2: [[1, 2]],
	4: [
		[1, 4],
		[2, 3],
	],
	8: [
		[1, 8],
		[4, 5],
		[2, 7],
		[3, 6],
	],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slotKey(round: number, slotIndex: number): string {
	return `R${round}S${slotIndex}`;
}

function nextPowerOf2(n: number): number {
	if (n <= 2) return 2;
	if (n <= 4) return 4;
	return 8;
}

function teamById(teams: BracketTeam[], seed: number): BracketTeam | undefined {
	return teams.find((t) => t.seed === seed);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateBracket
 *
 * @param teams  Seeded teams (seed = standings position). Length 1–8.
 * @returns      Ordered list of SlotSpec, including third-place match.
 */
export function generateBracket(teams: BracketTeam[]): SlotSpec[] {
	if (teams.length === 0) return [];

	const bracketSize = nextPowerOf2(teams.length);
	const seedings = SEEDINGS[bracketSize];

	const slots: SlotSpec[] = [];

	// ── Round 1 (QF for B=8, SF for B=4, Final for B=2) ───────────────────────
	const round1Slots: SlotSpec[] = seedings.map(([topSeed, botSeed], idx) => {
		const topTeam = teamById(teams, topSeed);
		const botTeam = teamById(teams, botSeed);

		const isBye = topTeam !== undefined && botTeam === undefined;

		return {
			round: 1,
			slotIndex: idx,
			isThirdPlace: false,
			isBye,
			homeTeamId: topTeam?.id ?? null,
			awayTeamId: botTeam?.id ?? null,
			homeFromSlotKey: null,
			awayFromSlotKey: null,
			homeFromType: null,
			awayFromType: null,
		};
	});

	slots.push(...round1Slots);

	if (bracketSize === 2) {
		// B=2: just the one final, no further rounds needed
		return slots;
	}

	// ── Round 2 ───────────────────────────────────────────────────────────────
	// For B=4: round 2 = Final (2 slots → 1 match + 3rd place)
	// For B=8: round 2 = SF   (4 slots → 2 matches)
	const round2Count = bracketSize / 4; // B=4 → 1; B=8 → 2
	const round2Slots: SlotSpec[] = Array.from({ length: round2Count }, (_, idx) => {
		// Each SF/Final feeds from two R1 slots
		const feedA = round1Slots[idx * 2];
		const feedB = round1Slots[idx * 2 + 1];

		// If a R1 slot was a bye, the winner is already known — wire the team directly
		const homeTeam = feedA.isBye ? feedA.homeTeamId : null;
		const awayTeam = feedB.isBye ? feedB.homeTeamId : null;

		return {
			round: 2,
			slotIndex: idx,
			isThirdPlace: false,
			isBye: false,
			homeTeamId: homeTeam,
			awayTeamId: awayTeam,
			homeFromSlotKey: feedA.isBye ? null : slotKey(1, feedA.slotIndex),
			awayFromSlotKey: feedB.isBye ? null : slotKey(1, feedB.slotIndex),
			homeFromType: feedA.isBye ? null : "winner",
			awayFromType: feedB.isBye ? null : "winner",
		};
	});

	slots.push(...round2Slots);

	if (bracketSize === 4) {
		// B=4 Round 3: Final + 3rd place
		const [sf1, sf2] = round2Slots;
		slots.push(
			{
				round: 3,
				slotIndex: 0,
				isThirdPlace: false,
				isBye: false,
				homeTeamId: null,
				awayTeamId: null,
				homeFromSlotKey: slotKey(2, sf1.slotIndex),
				awayFromSlotKey: slotKey(2, sf2.slotIndex),
				homeFromType: "winner",
				awayFromType: "winner",
			},
			{
				round: 3,
				slotIndex: 1,
				isThirdPlace: true,
				isBye: false,
				homeTeamId: null,
				awayTeamId: null,
				homeFromSlotKey: slotKey(2, sf1.slotIndex),
				awayFromSlotKey: slotKey(2, sf2.slotIndex),
				homeFromType: "loser",
				awayFromType: "loser",
			},
		);
		return slots;
	}

	// B=8 ── Round 3 = Final + 3rd place (feeds from R2 SF slots) ────────────
	const [sf1, sf2] = round2Slots;
	slots.push(
		{
			round: 3,
			slotIndex: 0,
			isThirdPlace: false,
			isBye: false,
			homeTeamId: null,
			awayTeamId: null,
			homeFromSlotKey: slotKey(2, sf1.slotIndex),
			awayFromSlotKey: slotKey(2, sf2.slotIndex),
			homeFromType: "winner",
			awayFromType: "winner",
		},
		{
			round: 3,
			slotIndex: 1,
			isThirdPlace: true,
			isBye: false,
			homeTeamId: null,
			awayTeamId: null,
			homeFromSlotKey: slotKey(2, sf1.slotIndex),
			awayFromSlotKey: slotKey(2, sf2.slotIndex),
			homeFromType: "loser",
			awayFromType: "loser",
		},
	);

	return slots;
}
