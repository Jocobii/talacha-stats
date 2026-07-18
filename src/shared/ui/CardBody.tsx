import type { HTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { PAD, type PadToken } from "./layout/scales";

export type CardBodyProps = HTMLAttributes<HTMLDivElement> & {
	pad?: PadToken;
};

/** Slot de contenido de `Card`. `pad="md"` (16px) por default. */
export function CardBody({ pad = "md", className, ...rest }: CardBodyProps) {
	return <div className={cn(PAD[pad], className)} {...rest} />;
}
