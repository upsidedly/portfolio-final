"use client";

import Link from "next/link";
import { useState } from "react";

const tools = [
  {
    href: "/tools/audio",
    title: "Audio speed",
    description: "Pitch and speed, together.",
    keywords:
      "nightcore daycore music mp3 wav flac pitch slow fast speed audio",
  },
  {
    href: "/tools/convert",
    title: "Convert a file",
    description: "Change formats. Preview. Download.",
    keywords:
      "convert converter files video mp4 mov webm audio mp3 wav flac image png jpg webp word document docx pdf text js txt",
  },
];

export function ToolsIndex() {
  const [query, setQuery] = useState("");
  const matches = tools.filter((tool) =>
    query
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .every((word) =>
        `${tool.title} ${tool.description} ${tool.keywords}`
          .toLowerCase()
          .includes(word),
      ),
  );
  return (
    <main id="main">
      <h1>Tools</h1>
      <div className="tool-search">
        <label className="sr-only" htmlFor="tool-search">
          Search tools
        </label>
        <input
          id="tool-search"
          type="search"
          placeholder="Search tools…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="tool-list">
        {matches.map((tool) => (
          <Link href={tool.href} className="tool-row" key={tool.href}>
            <div>
              <h2>{tool.title}</h2>
              <p>{tool.description}</p>
            </div>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
        {matches.length === 0 && (
          <div className="empty-search">
            <p>No tools found for “{query}”.</p>
            <button
              className="text-button"
              type="button"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          </div>
        )}
      </div>
      <p className="sr-only" role="status">
        {matches.length} tools found
      </p>
    </main>
  );
}
