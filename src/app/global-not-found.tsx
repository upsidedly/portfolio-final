import "~/styles/globals.css";

import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";

import { NotFoundPage } from "~/app/_components/not-found-page";

export const metadata: Metadata = {
  title: "Page not found | Matthew Williams",
};

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: "variable",
});

export default function GlobalNotFound() {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body>
        <NotFoundPage />
      </body>
    </html>
  );
}
