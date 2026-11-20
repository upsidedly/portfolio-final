"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { useEffect } from "react";

function LabelMusingCanvas() {
  const [editor] = useLexicalComposerContext();

  useEffect(
    () =>
      editor.registerRootListener((root) => {
        root?.setAttribute("aria-label", "Musing content");
      }),
    [editor],
  );

  return null;
}

export const MusingCanvasFeatureClient = createClientFeature({
  plugins: [{ Component: LabelMusingCanvas, position: "aboveContainer" }],
});
