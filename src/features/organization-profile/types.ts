export type OrganizationGeneralDto = {
	id: string;
	name: string;
	slug: string;
	city: string;
	logoUrl: string | null;
};

export type SlugCheckStatus = "idle" | "checking" | "available" | "taken" | "invalid";
