"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
} from "lexical";
import { useEffect, useState } from "react";

function WritingToolbar() {
  const [editor] = useLexicalComposerContext();
  const editable = useLexicalEditable();
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    heading: false,
  });

  useEffect(
    () =>
      editor.registerRootListener((root) => {
        root?.setAttribute("aria-label", "Musing content");
      }),
    [editor],
  );

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const block = selection.anchor.getNode().getTopLevelElement();
          setFormats({
            bold: selection.hasFormat("bold"),
            italic: selection.hasFormat("italic"),
            heading: $isHeadingNode(block),
          });
        });
      }),
    [editor],
  );

  function format(action: "bold" | "italic" | "heading") {
    editor.focus(() => {
      if (action !== "heading") {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, action);
        return;
      }

      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;
        const block = selection.anchor.getNode().getTopLevelElement();
        const isHeading = $isHeadingNode(block);
        $setBlocksType(selection, () =>
          isHeading ? $createParagraphNode() : $createHeadingNode("h2"),
        );
      });
    });
  }

  return (
    <div className="writing-toolbar" role="group" aria-label="Text formatting">
      {(["bold", "italic", "heading"] as const).map((action) => (
        <button
          aria-pressed={formats[action]}
          disabled={!editable}
          key={action}
          onClick={() => format(action)}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          {action === "bold"
            ? "Bold"
            : action === "italic"
              ? "Italic"
              : "Heading"}
        </button>
      ))}
      <span>Select text to format. Type / for more.</span>
    </div>
  );
}

export const WritingToolbarFeatureClient = createClientFeature({
  plugins: [{ Component: WritingToolbar, position: "aboveContainer" }],
});
