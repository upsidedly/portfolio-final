import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";

import { SITE_NAME } from "~/site-constants";

function fitText(text: string, limit: number) {
  const normalized = text.replace(/\s+/gu, " ").trim();
  if (normalized.length <= limit) return normalized;
  const shortened = normalized.slice(0, limit - 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > limit * 0.7 ? boundary : undefined)}…`;
}

export async function createSocialImage({
  title,
  description,
  label,
}: {
  title: string;
  description: string;
  label: "Musing" | "Project";
}) {
  const [regular, medium, iconFile] = await Promise.all([
    readFile(
      path.join(process.cwd(), "src/assets/og-fonts/IBMPlexSans-Regular.ttf"),
    ),
    readFile(
      path.join(process.cwd(), "src/assets/og-fonts/IBMPlexSans-Medium.ttf"),
    ),
    readFile(path.join(process.cwd(), "public/avatar-rounded.png")),
  ]);
  const icon = await sharp(iconFile).resize(96, 96).png().toBuffer();
  const heading = fitText(title, 150);

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        padding: 48,
        background: "#191b1c",
        color: "#e5e7e5",
        fontFamily: "IBM Plex Sans",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          border: "1px solid #343839",
          padding: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            color: "#9a9e9d",
            fontSize: 16,
            letterSpacing: 3,
          }}
        >
          {label.toUpperCase()}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "block",
              fontSize:
                heading.length > 100 ? 40 : heading.length > 65 ? 46 : 54,
              fontWeight: 500,
              letterSpacing: -1.5,
              lineHeight: 1.15,
              wordBreak: "break-word",
              lineClamp: 3,
              textOverflow: "ellipsis",
            }}
          >
            {heading}
          </div>
          <div
            style={{
              display: "block",
              color: "#9a9e9d",
              fontSize: 25,
              lineHeight: 1.45,
              wordBreak: "break-word",
              lineClamp: 3,
              textOverflow: "ellipsis",
            }}
          >
            {fitText(description, 200)}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #343839",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={`data:image/png;base64,${icon.toString("base64")}`}
              width={48}
              height={48}
              style={{ borderRadius: 24 }}
            />
            <span style={{ fontSize: 22 }}>{SITE_NAME}</span>
          </div>
          <span style={{ color: "#9a9e9d", fontSize: 20 }}>upsided.dev</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "IBM Plex Sans", data: regular, weight: 400, style: "normal" },
        { name: "IBM Plex Sans", data: medium, weight: 500, style: "normal" },
      ],
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
