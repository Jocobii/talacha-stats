import { apiError } from "@/types";

// POST /api/auth/login
// Body: { password: string }
// Valida contra ADMIN_PASSWORD y setea la cookie de sesión si es correcta.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { password, from } = body as { password?: string; from?: string };

  if (!password) {
    return apiError("Contraseña requerida", 400);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const sessionToken  = process.env.ADMIN_SESSION_TOKEN;

  if (!adminPassword || !sessionToken) {
    return apiError("El servidor no está configurado correctamente", 500);
  }

  if (password !== adminPassword) {
    return apiError("Contraseña incorrecta", 401);
  }

  // Setear cookie segura (httpOnly, sameSite strict)
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = [
    `admin_session=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    isProduction ? "Secure" : "",
    // 7 días
    `Max-Age=${60 * 60 * 24 * 7}`,
  ].filter(Boolean).join("; ");

  const redirectTo = from && from.startsWith("/admin") ? from : "/admin";

  return new Response(JSON.stringify({ ok: true, redirect: redirectTo }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieOptions,
    },
  });
}
