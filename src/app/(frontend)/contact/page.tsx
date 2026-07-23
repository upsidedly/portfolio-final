import config from "@payload-config";
import type { Metadata } from "next";
import { getPayload } from "payload";

import { ContactForm } from "~/app/_components/contact-form";
import { PortfolioFooter } from "~/app/_components/portfolio-footer";
import { PortfolioHeader } from "~/app/_components/portfolio-shell";
import { createPageMetadata } from "~/seo";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_SOCIAL_LINKS } from "~/site-constants";

export const metadata: Metadata = createPageMetadata({
  description: "Send Matthew Williams a message or find him elsewhere online.",
  path: "/contact",
  title: "Contact | Matthew Williams",
});

export default async function ContactPage() {
  const payload = await getPayload({ config });
  const settings = await payload.findGlobal({ slug: "site-settings" });
  const email = settings.email?.trim() ? settings.email : DEFAULT_CONTACT_EMAIL;
  const socialLinks = settings.socialLinks?.length
    ? settings.socialLinks
    : DEFAULT_SOCIAL_LINKS;

  return (
    <main className="site-frame" id="top">
      <PortfolioHeader name={settings.name} />
      <article className="contact-page">
        <header className="contact-page-header">
          <p className="section-label">Contact</p>
          <h1>Send me a message</h1>
          <p>
            This goes to my private inbox. You can also email me directly at{" "}
            <a href={`mailto:${email}`}>{email}</a>.
          </p>
        </header>
        <ContactForm />
        <footer className="contact-page-links">
          <span>Elsewhere</span>
          {socialLinks.map((link) => (
            <a href={link.url} key={link.url} rel="noreferrer" target="_blank">
              {link.label}
            </a>
          ))}
        </footer>
      </article>
      <PortfolioFooter name={settings.name} />
    </main>
  );
}
