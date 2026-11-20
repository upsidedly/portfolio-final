import config from "@payload-config";
import type { Metadata } from "next";
import Link from "next/link";
import { getPayload } from "payload";

import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";
import { createPageMetadata } from "~/seo";
import { SITE_NAME } from "~/site-constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = createPageMetadata({
  description: "More projects by Matthew Williams.",
  path: "/projects",
  title: `Other Projects | ${SITE_NAME}`,
});

export default async function ProjectsPage() {
  const payload = await getPayload({ config });
  const [settings, projects] = await Promise.all([
    payload.findGlobal({ slug: "site-settings", select: { name: true } }),
    payload.find({
      collection: "projects",
      depth: 0,
      pagination: false,
      sort: "order",
      where: {
        hidden: { not_equals: true },
        featured: { not_equals: true },
      },
      select: {
        slug: true,
        summary: true,
        title: true,
        year: true,
      },
    }),
  ]);

  return (
    <main className="site-frame" id="top">
      <PortfolioHeader name={settings.name} />
      <header className="index-intro project-index-intro section-heading">
        <h1>Other Projects</h1>
        <Link href="/#work">Featured Projects</Link>
      </header>
      {projects.docs.length ? (
        <div className="other-project-list">
          {projects.docs.map((project) => (
            <Link
              href={`/projects/${project.slug}`}
              key={project.id}
              prefetch={false}
            >
              <div>
                <h2>{project.title}</h2>
                <p>{project.summary}</p>
              </div>
              {project.year ? (
                <div className="other-project-meta">
                  <span>{project.year}</span>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-work">
          <p>No other projects yet.</p>
        </div>
      )}
      <PortfolioFooter name={settings.name} />
    </main>
  );
}
