"use client";

import { useState } from "react";

import { authClient } from "~/server/better-auth/client";

export default function GoogleLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async () => {
    setIsLoading(true);

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/admin",
    });

    setIsLoading(false);
  };

  return (
    <div className="google-login">
      <p>Use the Google account configured as the Payload administrator.</p>
      <button disabled={isLoading} onClick={signIn} type="button">
        {isLoading ? "Redirecting…" : "Continue with Google"}
      </button>
    </div>
  );
}
