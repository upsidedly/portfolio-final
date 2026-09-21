"use client";

import { useState } from "react";
import { authClient } from "~/server/better-auth/client";

export function ToolsSignIn({ wrongAccount }: { wrongAccount: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    setBusy(true);
    setError("");
    try {
      if (wrongAccount) {
        const result = await authClient.signOut();
        if (result.error)
          throw new Error("Could not switch accounts. Try again.");
      }
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/tools",
        errorCallbackURL: "/tools/sign-in",
      });
      if (result.error) throw new Error("Sign-in failed. Try again.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Sign-in failed. Try again.",
      );
      setBusy(false);
    }
  }
  return (
    <main id="main" className="sign-in-main">
      <h1>Just for you.</h1>
      <p className="tool-description">Sign in to open your private tools.</p>
      {wrongAccount && (
        <p role="alert" className="tool-error">
          This account doesn’t have access. Use your owner account.
        </p>
      )}
      <button className="primary-button" onClick={signIn} disabled={busy}>
        {busy
          ? "Opening Google…"
          : wrongAccount
            ? "Use another Google account"
            : "Continue with Google"}
      </button>
      {error && (
        <p role="alert" className="tool-error">
          {error}
        </p>
      )}
    </main>
  );
}
