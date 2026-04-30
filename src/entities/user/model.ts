/**
 * entities/user/model.ts
 * Tipos del dominio para usuarios del panel admin.
 *
 * Roles:
 *  - "owner"     → superadmin, ve y edita todo sin restricción
 *  - "organizer" → solo gestiona las ligas donde es adminId
 *  - "player"    → reservado para el futuro acceso de jugadores
 */
import { z } from "zod";

export type UserRole = "owner" | "organizer";

export type UserPublic = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	active: boolean;
	createdAt: Date;
};

// ── Schemas Zod ───────────────────────────────────────────────────────────────

export const CreateUserSchema = z.object({
	email: z.string().email("Email inválido").toLowerCase(),
	password: z.string().min(8, "Mínimo 8 caracteres"),
	name: z.string().min(2).max(80),
	role: z.enum(["owner", "organizer"]).default("organizer"),
});

export const UpdateUserSchema = z.object({
	name: z.string().min(2).max(80).optional(),
	role: z.enum(["owner", "organizer"]).optional(),
	active: z.boolean().optional(),
	password: z.string().min(8).optional(),
});

export const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
