import config from "@payload-config";
import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Metadata } from "next";
import { getPayload } from "payload";
import { draftMode } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";
import { env } from "~/env";
import { createPageMetadata } from "~/seo";
import { getSession } from "~/server/better-auth/server";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value?: null | string) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

const getPublishedPostBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "posts",
    depth: 1,
    limit: 1,
    where: {
      and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
    },
  });

  return result.docs[0] ?? null;
});

async function getPreviewPostBySlug(slug: string) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "posts",
    depth: 1,
    draft: true,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: slug } },
  });

  return result.docs[0] ?? null;
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: "Musing not found",
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  const featuredImage =
    post.featuredImage && typeof post.featuredImage === "object"
      ? post.featuredImage
      : null;

  return createPageMetadata({
    description: post.excerpt,
    image:
      featuredImage?.url && featuredImage.alt
        ? { alt: featuredImage.alt, url: featuredImage.url }
        : null,
    path: `/blog/${post.slug}`,
    publishedTime: post.publishedAt,
    title: post.title,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const { isEnabled: isDraftMode } = await draftMode();
  const session = isDraftMode ? await getSession() : null;
  const canPreview =
    isDraftMode &&
    session?.user.email.toLowerCase() === env.PAYLOAD_ADMIN_EMAIL.toLowerCase();

  const payload = await getPayload({ config });
  const [settings, post] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }),
    canPreview ? getPreviewPostBySlug(slug) : getPublishedPostBySlug(slug),
  ]);

  if (!post) notFound();

  const featuredImage =
    post.featuredImage && typeof post.featuredImage === "object"
      ? post.featuredImage
      : null;

  return (
    <main className="site-frame article-shell" id="top">
      {canPreview ? (
        <div className="preview-bar">
          <span>Draft preview</span>
          <Link href={`/preview/exit?slug=${encodeURIComponent(slug)}`}>
            Exit preview
          </Link>
        </div>
      ) : null}
      <PortfolioHeader name={settings.name} />
      <article className="article-layout">
        <header className="article-header">
          <Link href="/blog">Musings</Link>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
        </header>
        {featuredImage?.url ? (
          <figure className="article-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={featuredImage.alt} src={featuredImage.url} />
            <figcaption>{featuredImage.alt}</figcaption>
          </figure>
        ) : null}
        <div className="article-prose">
          {post.content ? (
            <RichText data={post.content} />
          ) : (
            <p>Start writing to preview the article.</p>
          )}
        </div>
      </article>
      <PortfolioFooter name={settings.name} />
    </main>
  );
}
