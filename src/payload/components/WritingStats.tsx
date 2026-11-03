"use client";

import { useField } from "@payloadcms/ui";

import { getWritingStats } from "~/lib/writing";

export default function WritingStats() {
  const { value } = useField<unknown>({ path: "content" });
  const { words, minutes } = getWritingStats(value);

  return (
    <p className="writing-stats">
      {words.toLocaleString("en")} {words === 1 ? "word" : "words"}
      {minutes ? ` · ${minutes} min read` : ""}
    </p>
  );
}
