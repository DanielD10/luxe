import { ImageResponse } from "next/og";

export const alt = "LUXE · Places worth the flight";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default share card. Destination pages use their own photo instead. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(160deg, #1d2428 0%, #0d1113 60%)",
          color: "#efe8dc",
        }}
      >
        <div style={{ fontSize: 44, letterSpacing: 18 }}>LUXE</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, lineHeight: 1 }}>Places worth</div>
          <div style={{ fontSize: 96, lineHeight: 1.1, color: "#d4b98c" }}>the flight.</div>
          <div style={{ fontSize: 30, marginTop: 28, color: "#9aa29f" }}>Luxury travel, imagery first. One all-in price. Perks at no extra cost.</div>
        </div>
      </div>
    ),
    size,
  );
}
