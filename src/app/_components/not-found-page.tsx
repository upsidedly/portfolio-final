import Link from "next/link";

import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";

export function NotFoundPage() {
  return (
    <main className="site-frame" id="top">
      <PortfolioHeader />

      <section className="not-found-panel" aria-labelledby="not-found-title">
        <span className="not-found-code">404</span>
        <div className="not-found-copy">
          <h1 id="not-found-title">Page not found</h1>
          <p>The page you were looking for does not exist.</p>
          <Link className="not-found-link" href="/">
            Return home
          </Link>
        </div>
      </section>

      <PortfolioFooter />
    </main>
  );
}
