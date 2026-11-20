"use client";

import {
  LeaveWithoutSaving,
  useFormFields,
  useFormModified,
} from "@payloadcms/ui";
import { useMemo } from "react";

import { getWritingStats } from "~/lib/writing";

export default function WritingStats() {
  const content = useFormFields(([fields]) => fields.content?.value);
  const modified = useFormModified();
  const { words, minutes } = useMemo(() => getWritingStats(content), [content]);

  return (
    <>
      <LeaveWithoutSaving disablePreventLeave={!modified} />
      <p className="musing-word-count">
        {words.toLocaleString("en")} {words === 1 ? "word" : "words"}
        {minutes ? ` · ${minutes} min read` : ""}
      </p>
    </>
  );
}
