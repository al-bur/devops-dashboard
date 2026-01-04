import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0B",
          borderRadius: 80,
        }}
      >
        <svg width="360" height="360" viewBox="0 0 32 32">
          <rect x="6" y="6" width="8" height="8" rx="2" fill="#10B981" />
          <rect
            x="18"
            y="6"
            width="8"
            height="8"
            rx="2"
            fill="#10B981"
            opacity="0.6"
          />
          <rect
            x="6"
            y="18"
            width="8"
            height="8"
            rx="2"
            fill="#10B981"
            opacity="0.6"
          />
          <rect
            x="18"
            y="18"
            width="8"
            height="8"
            rx="2"
            fill="#10B981"
            opacity="0.3"
          />
        </svg>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
