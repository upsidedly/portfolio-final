"use client";

import { useState } from "react";

export function ShareMusing({ title, url }: { title: string; url: string }) {
  const [message, setMessage] = useState("");
  const [showLink, setShowLink] = useState(false);

  async function share() {
    setMessage("");

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
      setShowLink(false);
    } catch {
      setShowLink(true);
      setMessage("Select and copy the link below.");
    }
  }

  return (
    <div className="musing-share">
      <button onClick={share} type="button">
        Share
      </button>
      <span role="status">{message}</span>
      {showLink ? (
        <label>
          Article link
          <input
            onFocus={(event) => event.currentTarget.select()}
            readOnly
            type="url"
            value={url}
          />
        </label>
      ) : null}
    </div>
  );
}
