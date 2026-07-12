import "~/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import { SITE_ORIGIN } from "~/seo";
import { SITE_DESCRIPTION, SITE_NAME } from "~/site-constants";

export const metadata: Metadata = {
  metadataBase: SITE_ORIGIN,
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  icons: {
    apple: [{ url: "/avatar-rounded.png", type: "image/png" }],
    icon: [{ url: "/avatar-rounded.png", type: "image/png" }],
  },
  robots: {
    follow: true,
    index: true,
  },
};

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-ibm-plex-sans",
  weight: "variable",
});

export default function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
