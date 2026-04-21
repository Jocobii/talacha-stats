/**
 * entities/user/queries.ts
 * Acceso a DB + utilidades de contraseña para usuarios.
 *
 * Hashing: Node.js crypto.scrypt — sin dependencias externas.
 * Format del hash: "{salt}:{derivedKey}" (ambos en hex).
 */

import { eq }               from "drizzle-orm";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify }        from "util";
import { db, users }        from "@/db";
import type { CreateUserInput, UpdateUserInput, UserPublic } from "./model";

const scryptAsync = promisify(scrypt);

// ── Contraseñas ───────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt       = randomBytes(16).toString("hex");
  const derived    = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, storedHex] = hash.split(":");
  if (!salt || !storedHex) return false;
  const derived  = (await scryptAsync(password, salt, 64)) as Buffer;
  const stored   = Buffer.from(storedHex, "hex");
  if (derived.length !== stored.length) return false;
  return timingSafeEqual(derived, stored);
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase().trim()),
  });
}

export async function listUsers(): Promise<UserPublic[]> {
  const rows = await db.query.users.findMany({
    orderBy: (u, { asc }) => [asc(u.createdAt)],
  });
  return rows.map(toPublic);
}

export async function createUser(input: CreateUserInput) {
  const passwordHash = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      email:        input.email.toLowerCase().trim(),
      passwordHash,
      name:         input.name,
      role:         input.role ?? "organizer",
    })
    .returning();
  return toPublic(user);
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const patch: Record<string, unknown> = {};
  if (input.name     !== undefined) patch.name   = input.name;
  if (input.role     !== undefined) patch.role   = input.role;
  if (input.active   !== undefined) patch.active = input.active;
  if (input.password !== undefined) patch.passwordHash = await hashPassword(input.password);

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, id))
    .returning();
  return updated ? toPublic(updated) : null;
}

export async function countUsers(): Promise<number> {
  const rows = await db.query.users.findMany({ columns: { id: true } });
  return rows.length;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toPublic(u: typeof users.$inferSelect): UserPublic {
  return {
    id:        u.id,
    email:     u.email,
    name:      u.name,
    role:      u.role as UserPublic["role"],
    active:    u.active,
    createdAt: u.createdAt,
  };
}
