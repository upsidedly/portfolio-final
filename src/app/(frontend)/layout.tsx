import "~/styles/globals.css";

import { type Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";

export const metadata: Metadata = {
  title: "Matthew | Engineer and computer scientist",
  description:
    "The portfolio and musings of Matthew Williams, working across AI/ML, software, robotics, and systems engineering.",
  icons: {
    apple: [{ url: "/avatar-rounded.png", type: "image/png" }],
    icon: [{ url: "/avatar-rounded.png", type: "image/png" }],
  },
};

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: "variable",
});

export default function FrontendLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={ibmPlexSans.variable}>
      <body>{children}</body>
    </html>
  );
}
