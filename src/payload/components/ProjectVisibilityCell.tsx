"use client";

import { useRouter } from "next/navigation";
import type { DefaultCellComponentProps } from "payload";
import { useEffect, useState } from "react";

export default function ProjectVisibilityCell({
  cellData,
  rowData,
}: DefaultCellComponentProps) {
  const router = useRouter();
  const [hidden, setHidden] = useState(Boolean(cellData));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const title = typeof rowData.title === "string" ? rowData.title : "project";

  useEffect(() => {
    setHidden(Boolean(cellData));
  }, [cellData]);

  async function toggleVisibility() {
    if (busy) return;

    setBusy(true);
    setError(false);

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(String(rowData.id))}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hidden: !hidden }),
        },
      );

      if (!response.ok) throw new Error("Visibility update failed");

      setHidden(!hidden);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="project-visibility-cell">
      <span className="project-visibility-state">
        {hidden ? "Hidden" : "Visible"}
      </span>
      <button
        aria-label={`${hidden ? "Reveal" : "Hide"} ${title} ${hidden ? "on" : "from"} the portfolio`}
        disabled={busy}
        onClick={(event) => {
          event.stopPropagation();
          void toggleVisibility();
        }}
        type="button"
      >
        {busy ? "Saving…" : hidden ? "Reveal" : "Hide"}
      </button>
      {error ? (
        <span className="project-visibility-error" role="alert">
          Couldn’t save. Try again.
        </span>
      ) : null}
    </span>
  );
}
