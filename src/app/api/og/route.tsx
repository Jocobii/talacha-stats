import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// ── Paleta TalachaStats ────────────────────────────────────────────────────────
const C = {
  pitch:   "#0a0f0d",   // fondo principal
  surface: "#111814",   // fondo tarjeta
  brand:   "#00e676",   // verde TalachaStats
  ink:     "#f0f4f2",   // texto principal
  inkDim:  "#6b7a72",   // texto secundario
  line:    "#1e2b23",   // bordes
};

// ── Query params esperados ─────────────────────────────────────────────────────
// title  — nombre de la org o liga
// sub    — subtítulo (ciudad · temporada, etc.)
// s1l, s1v — stat 1: label y value
// s2l, s2v — stat 2
// s3l, s3v — stat 3

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const title = searchParams.get("title") ?? "TalachaStats";
  const sub   = searchParams.get("sub")   ?? "Estadísticas amateur en Tijuana";

  const stats = [
    { label: searchParams.get("s1l"), value: searchParams.get("s1v") },
    { label: searchParams.get("s2l"), value: searchParams.get("s2v") },
    { label: searchParams.get("s3l"), value: searchParams.get("s3v") },
  ].filter((s) => s.label && s.value) as { label: string; value: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: C.pitch,
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ── Glow decorativo — esquina superior derecha ── */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse at center, rgba(0,230,118,0.12) 0%, transparent 65%)",
            display: "flex",
          }}
        />

        {/* ── Marca de agua — inicial gigante ── */}
        <div
          style={{
            position: "absolute",
            bottom: -20,
            right: 40,
            fontSize: 320,
            fontWeight: 900,
            color: "rgba(0,230,118,0.04)",
            lineHeight: 1,
            display: "flex",
            fontFamily: "sans-serif",
          }}
        >
          {title.charAt(0).toUpperCase()}
        </div>

        {/* ── Contenido principal ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "72px 80px",
            gap: 0,
            position: "relative",
          }}
        >
          {/* Eyebrow — branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 40,
            }}
          >
            {/* Pelota SVG pequeña */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: C.brand,
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: C.brand,
                letterSpacing: 3,
              }}
            >
              TALACHASTATS
            </span>
          </div>

          {/* Título — nombre de org o liga */}
          <div
            style={{
              fontSize: title.length > 20 ? 68 : 84,
              fontWeight: 900,
              color: C.ink,
              lineHeight: 1.0,
              textTransform: "uppercase",
              letterSpacing: -2,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Subtítulo */}
          <div
            style={{
              fontSize: 28,
              color: C.inkDim,
              marginTop: 20,
              display: "flex",
            }}
          >
            {sub}
          </div>

          {/* Separador */}
          <div
            style={{
              width: 64,
              height: 4,
              background: C.brand,
              borderRadius: 2,
              marginTop: 40,
              display: "flex",
            }}
          />

          {/* ── Grid de stats (si hay) ── */}
          {stats.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 48,
              }}
            >
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: C.surface,
                    border: `1px solid ${C.line}`,
                    borderRadius: 20,
                    padding: "24px 32px",
                    gap: 6,
                    minWidth: 160,
                  }}
                >
                  <span
                    style={{
                      fontSize: 52,
                      fontWeight: 900,
                      color: C.brand,
                      lineHeight: 1,
                      display: "flex",
                    }}
                  >
                    {s.value}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.inkDim,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      display: "flex",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer — URL del site ── */}
        <div
          style={{
            display: "flex",
            padding: "0 80px 40px",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 20, color: C.inkDim }}>
            talachastats.com
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: C.inkDim,
              letterSpacing: 2,
            }}
          >
            FÚTBOL AMATEUR · TIJUANA
          </span>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    },
  );
}
