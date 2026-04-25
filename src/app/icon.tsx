import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#141414",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 3,
          padding: "5px 5px",
        }}
      >
        {/* Bars — mismas proporciones que logo-icon.svg */}
        {[
          { h: "35%", opacity: 0.35 },
          { h: "55%", opacity: 0.55 },
          { h: "75%", opacity: 0.75 },
          { h: "100%", opacity: 1 },
          { h: "65%", opacity: 0.65 },
        ].map((bar, i) => (
          <div
            key={i}
            style={{
              width: 3,
              height: bar.h,
              background: `rgba(0, 230, 118, ${bar.opacity})`,
              borderRadius: 1,
            }}
          />
        ))}
      </div>
    ),
    { ...size }
  );
}
