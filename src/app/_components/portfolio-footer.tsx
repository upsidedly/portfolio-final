import Link from "next/link";

type PortfolioFooterProps = {
  name?: string;
};

export function PortfolioFooter({
  name = "Matthew Williams",
}: PortfolioFooterProps) {
  return (
    <footer className="site-footer">
      <span>
        © {new Date().getFullYear()} {name}
      </span>
      <Link href="#top">Back to top</Link>
    </footer>
  );
}
