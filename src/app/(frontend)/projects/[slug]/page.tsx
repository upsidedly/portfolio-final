import config from "@payload-config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import { getPayload } from "payload";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });
  const [settings, result] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }),
    payload.find({
      collection: "projects",
      depth: 1,
      limit: 1,
      where: { slug: { equals: slug } },
    }),
  ]);
  const project = result.docs[0];

  if (!project) notFound();

  const image =
    project.image && typeof project.image === "object" ? project.image : null;

  return (
    <main className="site-frame" id="top">
      <PortfolioHeader name={settings.name} />
      <article className="project-page">
        <header className="project-hero portfolio-grid">
          <div>
            <p className="section-label">Selected work</p>
            <h1>{project.title}</h1>
          </div>
          <div className="project-meta">
            <p>
              <span>Role</span>
              {project.role}
            </p>
            {project.year ? (
              <p>
                <span>Year</span>
                {project.year}
              </p>
            ) : null}
            {project.technologies?.length ? (
              <p>
                <span>Built with</span>
                {project.technologies.map((item) => item.name).join(", ")}
              </p>
            ) : null}
          </div>
        </header>
        <p className="project-lede">{project.summary}</p>
        {image?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="project-hero-image" alt={image.alt} src={image.url} />
        ) : null}
        {project.description ? (
          <div className="article-prose project-prose">
            <RichText data={project.description} />
          </div>
        ) : null}
        <div className="project-links">
          {project.projectURL ? (
            <a href={project.projectURL} target="_blank" rel="noreferrer">
              Visit project ↗
            </a>
          ) : null}
          {project.repositoryURL ? (
            <a href={project.repositoryURL} target="_blank" rel="noreferrer">
              View source ↗
            </a>
          ) : null}
          <Link href="/#work">Back to work</Link>
        </div>
      </article>
      <PortfolioFooter name={settings.name} />
    </main>
  );
}
