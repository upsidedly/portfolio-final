import Image from "next/image";

const avatarPath = "/avatar-rounded.png";

export function BrandLogo() {
  return (
    <span className="portfolio-brand-logo">
      <Image alt="Portfolio" fill priority sizes="112px" src={avatarPath} />
    </span>
  );
}

export function BrandIcon() {
  return (
    <span className="portfolio-brand-icon">
      <Image alt="Portfolio" fill sizes="40px" src={avatarPath} />
    </span>
  );
}
