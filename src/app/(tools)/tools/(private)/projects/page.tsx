import Link from "next/link";
import { requireToolsOwner } from "~/server/tools/access";

export const metadata = { title: "Project controls" };
export default async function ProjectsPage() {
  await requireToolsOwner();
  return (
    <main id="main">
      <div className="tool-heading">
        <Link href="/tools" className="back-link">
          ← Tools
        </Link>
        <h1>Project controls</h1>
      </div>
      <div className="tool-list">
        <Link className="tool-row" href="/tools/projects/cork">
          <div>
            <h2>Cork</h2>
            <p>Gift codes and purchase settings.</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="tool-row" href="/admin/globals/site-settings">
          <div>
            <h2>Portfolio</h2>
            <p>Site settings and contact links.</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="tool-row" href="/admin/collections/projects">
          <div>
            <h2>Project catalogue</h2>
            <p>Published projects, case studies and visibility.</p>
          </div>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </main>
  );
}
