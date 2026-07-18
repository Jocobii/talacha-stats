import { twMerge } from "tailwind-merge";

export function cn(...args: (string | false | null | undefined)[]): string {
	return twMerge(args.filter(Boolean).join(" "));
}
