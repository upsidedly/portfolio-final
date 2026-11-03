const emails = new Set(["matthewlloydw@gmail.com", "matthew@manta.works"]);

/** @param {unknown} email */
export function isAdminEmail(email) {
  return typeof email === "string" && emails.has(email.trim().toLowerCase());
}

/** @param {{user?: {email?: string, emailVerified?: boolean} | null} | null | undefined} session */
export function isPortfolioOwner(session) {
  return (
    session?.user?.emailVerified === true && isAdminEmail(session.user.email)
  );
}
