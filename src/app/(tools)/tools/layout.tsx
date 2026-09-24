import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ICON_URL } from "~/site-constants";
import "./tools.css";

export const metadata: Metadata = {
  title: { default: "Tools", template: "%s · Tools" },
  icons: {
    apple: [{ url: SITE_ICON_URL, type: "image/png" }],
    icon: [{ url: SITE_ICON_URL, type: "image/png" }],
  },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="tools-body">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="tools-shell">
          <header className="tools-header">
            <Link className="tools-wordmark" href="/tools">
              Tools <span>Private</span>
            </Link>
            <Link href="/">
              Portfolio <span aria-hidden="true">↗</span>
            </Link>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
