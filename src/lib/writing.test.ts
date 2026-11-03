import assert from "node:assert/strict";
import { test } from "node:test";

import { getWritingStats } from "./writing";

void test("empty or unavailable writing has no reading estimate", () => {
  for (const content of [null, undefined, {}, { root: { children: [] } }]) {
    assert.deepEqual(getWritingStats(content), { words: 0, minutes: 0 });
  }
});

void test("counts visible text across formatting, links, paragraphs and lists", () => {
  const content = {
    root: {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { text: "Writ" },
            { text: "ing " },
            {
              type: "link",
              url: "https://example.com",
              children: [{ text: "well" }],
            },
          ],
        },
        {
          type: "list",
          children: [
            { type: "listitem", children: [{ text: "takes practice" }] },
            { type: "listitem", children: [{ text: "and patience" }] },
          ],
        },
        { type: "upload", value: { alt: "Do not count image metadata" } },
      ],
    },
  };

  assert.deepEqual(getWritingStats(content), { words: 6, minutes: 1 });
});

void test("reading estimates round up at 200 words per minute", () => {
  const content = {
    root: {
      children: [
        { type: "paragraph", children: [{ text: "word ".repeat(201) }] },
      ],
    },
  };
  assert.deepEqual(getWritingStats(content), { words: 201, minutes: 2 });
});
