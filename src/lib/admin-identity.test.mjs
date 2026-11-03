import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminEmail, isPortfolioOwner } from "./admin-identity.mjs";

test("only the two verified owner identities can use project administration", () => {
  for (const email of ["matthewlloydw@gmail.com", " MATTHEW@MANTA.WORKS "]) {
    assert.equal(
      isPortfolioOwner({ user: { email, emailVerified: true } }),
      true,
    );
    assert.equal(
      isPortfolioOwner({ user: { email, emailVerified: false } }),
      false,
    );
  }
  for (const email of [
    "other@example.invalid",
    "matthew@manta.works.evil.invalid",
    "matthewlloydw+other@gmail.com",
    "",
  ]) {
    assert.equal(
      isPortfolioOwner({ user: { email, emailVerified: true } }),
      false,
    );
  }
  for (const value of [null, undefined, {}, { user: null }])
    assert.equal(isPortfolioOwner(value), false);
  assert.equal(isAdminEmail({ email: "matthew@manta.works" }), false);
});
