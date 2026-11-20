import Link from "next/link";

type PortfolioFooterProps = {
  name?: string;
  showSignIn?: boolean;
};

export function PortfolioFooter({
  name = "Matthew Williams",
  showSignIn = false,
}: PortfolioFooterProps) {
  return (
    <footer className="site-footer">
      <div className="site-footer-credit">
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        {showSignIn ? (
          <Link href="/admin" prefetch={false} rel="nofollow">
            Sign in
          </Link>
        ) : null}
      </div>
      <Link href="#top">Back to top</Link>
    </footer>
  );
}
