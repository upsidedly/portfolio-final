import config from "@payload-config";
import { getPayload } from "payload";
import Link from "next/link";

import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";

function formatDate(value?: null | string) {
  if (!value) return "Unpublished";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function BlogIndexPage() {
  const payload = await getPayload({ config });
  const [settings, posts] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }),
    payload.find({
      collection: "posts",
      limit: 50,
      sort: "-publishedAt",
      where: { _status: { equals: "published" } },
    }),
  ]);

  return (
    <main className="site-frame" id="top">
      <PortfolioHeader name={settings.name} />
      <header className="index-intro">
        <h1>Things on my mind</h1>
        <p>
          Observations, thoughts, essays, and notes on any topic that I think
          might be of interest
        </p>
      </header>
      <section
        className={
          posts.docs.length ? "post-index" : "post-index post-index--empty"
        }
        aria-label="Musings"
      >
        {posts.docs.length ? (
          posts.docs.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.id}>
              <time dateTime={post.publishedAt ?? undefined}>
                {formatDate(post.publishedAt)}
              </time>
              <div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </Link>
          ))
        ) : (
          <p className="post-index-empty">Nothing published yet.</p>
        )}
      </section>
      <PortfolioFooter name={settings.name} />
    </main>
  );
}
