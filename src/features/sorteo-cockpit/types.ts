export type MatchdayStatus = "draft" | "published" | "in_progress" | "completed";

export type TeamWithAttendance = {
	id: string;
	name: string;
	color: string | null;
	short: string | null;
	status: "presente" | "ausente";
	restReason: string | null;
	purchasedSlot: { venueId: string | null; venueName: string; startTime: string } | null;
	matchesPlayed: number;
};

export type CockpitPairing = {
	uid: string;
	homeTeamId: string;
	awayTeamId: string | null;
	venueId: string | null;
	startTime: string | null;
	isConflict: boolean;
};

export type VenueOption = { id: string; name: string; slots: string[] };

export type CockpitMatchday = {
	id: string;
	number: number;
	scheduledDate: string;
	status: MatchdayStatus;
	matchCount: number;
};

export type CockpitConfig = {
	matchDurationMinutes: number;
	bufferMinutes: number;
	noRepeatWithin: number;
	regularMatchdays: number;
	allowDuplicateMatchups: boolean;
};

// Return type for useCockpitState — co-located for import reuse
export type AddPairingResult = { ok: true } | { ok: false; error: string };

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type CockpitHookReturn = {
	matchday: CockpitMatchday | null;
	totalMatchdays: number;
	leagueName: string;
	config: CockpitConfig | null;
	venues: VenueOption[];
	teams: TeamWithAttendance[];
	pairings: CockpitPairing[];
	recentPairKeys: Set<string>;
	loading: boolean;
	loadError: string | null;
	sortearLoading: boolean;
	createLoading: boolean;
	saveStatus: SaveStatus;
	publishLoading: boolean;
	drawerOpen: boolean;
	activeDrawerTab: string;
	lastSeed: number | null;
	isDirty: boolean;
	loadCurrent: () => Promise<void>;
	createMatchday: (scheduledDate: string) => Promise<void>;
	toggleAttendance: (teamId: string, status: "presente" | "ausente") => Promise<void>;
	sortear: (seed?: number) => Promise<void>;
	addManualPairing: (homeTeamId: string, awayTeamId: string) => AddPairingResult;
	changeTeam: (pairingIdx: number, role: "home" | "away", newTeamId: string) => void;
	swapHomeAway: (pairingIdx: number) => void;
	changeVenue: (pairingIdx: number, venueId: string) => void;
	changeTime: (pairingIdx: number, startTime: string) => void;
	deletePairing: (pairingIdx: number) => void;
	confirmPairings: () => Promise<void>;
	publishMatchday: () => Promise<void>;
	updateConfig: (partial: Partial<CockpitConfig>) => void;
	openDrawer: (tab: string) => void;
	closeDrawer: () => void;
};
