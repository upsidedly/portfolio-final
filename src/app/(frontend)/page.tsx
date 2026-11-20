import config from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";
import Link from "next/link";

import { AdminTools } from "~/app/_components/admin-tools";
import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";
import { isPortfolioOwner } from "~/lib/admin-identity.mjs";
import { createPageMetadata } from "~/seo";
import { getSession } from "~/server/better-auth/server";
import {
  DEFAULT_CONTACT_EMAIL,
  DEFAULT_SOCIAL_LINKS,
  SITE_DESCRIPTION,
  SITE_NAME,
} from "~/site-constants";

export const metadata: Metadata = createPageMetadata({
  description: SITE_DESCRIPTION,
  path: "/",
  title: SITE_NAME,
});

function formatDate(value?: null | string) {
  if (!value) return "Unpublished";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function Home() {
  const payload = await getPayload({ config });
  const [settings, projects, posts, session] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }),
    payload.find({
      collection: "projects",
      depth: 1,
      pagination: false,
      sort: "order",
      where: {
        featured: { equals: true },
        hidden: { not_equals: true },
      },
      select: {
        image: true,
        slug: true,
        summary: true,
        title: true,
        year: true,
      },
    }),
    payload.find({
      collection: "posts",
      limit: 3,
      sort: "-publishedAt",
      where: { _status: { equals: "published" } },
    }),
    getSession(),
  ]);
  const isAdmin = isPortfolioOwner(session);
  const baseSocialLinks = settings.socialLinks?.length
    ? settings.socialLinks
    : DEFAULT_SOCIAL_LINKS;
  const email = settings.email?.trim() ? settings.email : DEFAULT_CONTACT_EMAIL;
  const socialLinks = baseSocialLinks.filter(
    (link) => link.label.toLowerCase() !== "email",
  );
  const isHeroLink = (label: string) =>
    ["github", "resume"].includes(label.trim().toLowerCase());
  const heroLinks = socialLinks.filter((link) => isHeroLink(link.label));
  const footerLinks = socialLinks.filter((link) => !isHeroLink(link.label));

  return (
    <main className="site-frame" id="top">
      <PortfolioHeader name={settings.name} />

      <section
        className="portfolio-grid hero-grid"
        aria-labelledby="intro-title"
      >
        <div className="hero-identity">
          <div>
            <h1 id="intro-title">{settings.name}</h1>
            <p>{settings.role}</p>
          </div>
          {heroLinks.length ? (
            <ul className="hero-links">
              {heroLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} rel="noreferrer" target="_blank">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="portfolio-grid intro-grid" id="about">
        <div>
          <p className="section-label">About</p>
          <p className="intro-copy">{settings.introduction}</p>
        </div>
        <div>
          <p className="section-label">Now</p>
          <p className="intro-copy muted">{settings.currentFocus}</p>
        </div>
      </section>

      <section
        className="work-section"
        id="work"
        aria-labelledby="featured-projects-title"
      >
        <div className="section-heading">
          <h2 id="featured-projects-title">Featured Projects</h2>
          <Link href="/projects" prefetch={false}>
            Other projects
          </Link>
        </div>
        {projects.docs.length ? (
          <div className="project-grid">
            {projects.docs.map((project) => {
              const image =
                project.image && typeof project.image === "object"
                  ? project.image
                  : null;

              return (
                <Link
                  className="project-card"
                  href={`/projects/${project.slug}`}
                  key={project.id}
                >
                  {image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={image.alt} src={image.url} />
                  ) : null}
                  <div className="project-card-copy">
                    <div>
                      <h3>{project.title}</h3>
                    </div>
                    <span>{project.year ?? "View"}</span>
                  </div>
                  <p className="project-summary">{project.summary}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-work">
            <p>Featured projects are being documented.</p>
            {isAdmin ? (
              <Link href="/admin/collections/projects/create">
                Add a featured project
              </Link>
            ) : null}
          </div>
        )}
      </section>

      <section className="writing-section" aria-labelledby="writing-title">
        <div className="section-heading">
          <h2 id="writing-title">Recent musings</h2>
          <Link href="/blog">All musings</Link>
        </div>
        <div
          className={
            posts.docs.length
              ? "writing-list"
              : "writing-list writing-list--empty"
          }
        >
          {posts.docs.length ? (
            posts.docs.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>
                <time dateTime={post.publishedAt ?? undefined}>
                  {formatDate(post.publishedAt)}
                </time>
              </Link>
            ))
          ) : (
            <p className="writing-empty">
              Thoughts, observations, and analyses I hope you find interesting.
              Check back soon.
            </p>
          )}
        </div>
      </section>

      <section
        className="portfolio-grid contact-grid"
        aria-labelledby="contact-title"
      >
        <div>
          <p className="section-label">Contact</p>
          <Link className="contact-button" href="/contact" id="contact-title">
            Send me a message
          </Link>
          <span className="contact-email-label">Feel free to write me at</span>
          <a href={`mailto:${email}`}>{email}</a>
        </div>
        {footerLinks.length ? (
          <div>
            <p className="section-label">Elsewhere</p>
            <ul className="social-list">
              {footerLinks.map((link) => (
                <li key={link.url}>
                  <a href={link.url} rel="noreferrer" target="_blank">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <PortfolioFooter name={settings.name} showSignIn />
      {isAdmin ? <AdminTools /> : null}
    </main>
  );
}
