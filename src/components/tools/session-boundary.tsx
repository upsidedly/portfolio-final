"use client";

import { useEffect, useState } from "react";
import { authClient } from "~/server/better-auth/client";

export async function checkToolsSession(signal?: AbortSignal) {
  const response = await fetch("/api/tools/session", {
    cache: "no-store",
    signal,
  });
  if (response.status === 401 || response.status === 403) {
    window.location.replace("/tools/sign-in");
    throw new Error("Your session ended. Sign in again.");
  }
  if (!response.ok) throw new Error("Could not check your session. Try again.");
}

export function SessionBoundary({ children }: { children: React.ReactNode }) {
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    const check = () => {
      if (document.visibilityState === "visible") {
        void checkToolsSession(controller.signal).catch(() => {
          // A network outage does not destroy local work. Every conversion also checks access.
        });
      }
    };
    check();
    window.addEventListener("pageshow", check);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    const interval = window.setInterval(check, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Could not sign out. Try again.");
      window.location.replace("/tools/sign-in");
    } catch {
      setSigningOut(false);
      setError("Could not sign out. Try again.");
    }
  }

  return (
    <>
      {signingOut ? (
        <main id="main">
          <p role="status">Signing out…</p>
        </main>
      ) : (
        children
      )}
      <footer className="tools-footer">
        <span>Only your account has access.</span>
        <button
          type="button"
          className="text-button"
          onClick={signOut}
          disabled={signingOut}
        >
          Sign out
        </button>
        {error && <p role="alert">{error}</p>}
      </footer>
    </>
  );
}
