"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getRoot,
  FORMAT_TEXT_COMMAND,
  type SerializedEditorState,
  type TextFormatType,
} from "lexical";
import { useState, type FormEvent, type ReactNode } from "react";

type EditorValue = {
  json: SerializedEditorState;
  text: string;
};

type SubmitState = "error" | "idle" | "sending" | "success";

const editorConfig = {
  namespace: "ContactMessage",
  onError(error: Error) {
    throw error;
  },
  theme: {
    paragraph: "contact-editor-paragraph",
    text: {
      bold: "contact-editor-bold",
      italic: "contact-editor-italic",
    },
  },
};

function ToolbarButton({
  children,
  format,
}: {
  children: ReactNode;
  format: TextFormatType;
}) {
  const [editor] = useLexicalComposerContext();

  return (
    <button
      className="contact-editor-tool"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
      type="button"
    >
      {children}
    </button>
  );
}

function MessageEditor({
  onChange,
  resetKey,
}: {
  onChange: (value: EditorValue) => void;
  resetKey: number;
}) {
  return (
    <LexicalComposer initialConfig={editorConfig} key={resetKey}>
      <div className="contact-editor">
        <div aria-label="Message formatting" className="contact-editor-toolbar">
          <ToolbarButton format="bold">Bold</ToolbarButton>
          <ToolbarButton format="italic">Italic</ToolbarButton>
        </div>
        <div className="contact-editor-input-wrap">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Message"
                className="contact-editor-input"
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={
              <span className="contact-editor-placeholder">
                Write your message.
              </span>
            }
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(editorState) => {
            editorState.read(() => {
              onChange({
                json: editorState.toJSON(),
                text: $getRoot().getTextContent(),
              });
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}

export function ContactForm() {
  const [editorValue, setEditorValue] = useState<EditorValue | null>(null);
  const [message, setMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (!editorValue || editorValue.text.trim().length < 3) {
      setSubmitState("error");
      setMessage("Write a message before sending.");
      return;
    }

    setSubmitState("sending");
    setMessage("");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          email: formData.get("email"),
          message: editorValue.json,
          name: formData.get("name"),
          website: formData.get("website"),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const result = (await response.json()) as {
        error?: string;
        ok?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to send your message.");
      }

      form.reset();
      setEditorValue(null);
      setResetKey((value) => value + 1);
      setSubmitState("success");
      setMessage("Message sent. Thank you.");
    } catch (error) {
      setSubmitState("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to send your message.",
      );
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-field">
        <label htmlFor="contact-name">
          Name <span>optional</span>
        </label>
        <input autoComplete="name" id="contact-name" name="name" type="text" />
      </div>
      <div className="contact-form-field">
        <label htmlFor="contact-email">Email</label>
        <input
          autoComplete="email"
          id="contact-email"
          name="email"
          required
          type="email"
        />
      </div>
      <div className="contact-form-field">
        <span className="contact-form-label">Message</span>
        <MessageEditor onChange={setEditorValue} resetKey={resetKey} />
      </div>
      <div aria-hidden="true" className="contact-form-honeypot">
        <label htmlFor="contact-website">Website</label>
        <input
          autoComplete="off"
          id="contact-website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>
      <div className="contact-form-actions">
        <button disabled={submitState === "sending"} type="submit">
          {submitState === "sending" ? "Sending..." : "Send message"}
        </button>
        <p aria-live="polite" data-state={submitState}>
          {message}
        </p>
      </div>
    </form>
  );
}
