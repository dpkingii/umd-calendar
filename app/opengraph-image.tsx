import { cacheLife } from "next/cache";
import { ImageResponse } from "next/og";

export const alt = "UMD Calendar Feed: every UMD break, finals week, and holiday, in your calendar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ImageResponse can't use next/font, so fetch the same Overpass weights directly. Without a
// browser user agent Google Fonts serves TTF, which is a format ImageResponse accepts.
async function overpass(weight: number) {
  "use cache";
  cacheLife("max");
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Overpass:wght@${weight}`)).text();
  const url = css.match(/src: url\((.+?)\) format/)![1];
  return { name: "Overpass", data: await (await fetch(url)).arrayBuffer(), weight: weight as 400 | 700 | 800 };
}

export default async function Image() {
  const fonts = await Promise.all([overpass(400), overpass(700), overpass(800)]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#ffffff",
          borderTop: "16px solid #e03a3e",
          color: "#16130f",
          fontFamily: "Overpass",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "#e03a3e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="32" height="32" viewBox="8 6 16 19" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
              <rect x="8" y="9" width="16" height="15" rx="2.5" />
              <path d="M8 14h16M12 6.5v4M20 6.5v4" />
            </svg>
          </div>
          UMD Calendar Feed
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
          Every UMD break, finals week, and holiday, in your calendar.
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#6b665c" }}>
          Free · No account · Synced daily from the UMD Academic Catalog
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
