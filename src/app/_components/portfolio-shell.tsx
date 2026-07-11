import Image from "next/image";
import Link from "next/link";

type PortfolioHeaderProps = {
  name?: string;
};

export function PortfolioHeader({
  name = "Matthew Williams",
}: PortfolioHeaderProps) {
  return (
    <header className="site-header">
      <Link className="site-mark" href="/" aria-label={`${name} home`}>
        <Image
          alt=""
          height={36}
          priority
          src="/avatar-rounded.png"
          width={36}
        />
      </Link>
      <nav aria-label="Primary navigation" className="site-nav">
        <Link href="/blog">Musings</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
