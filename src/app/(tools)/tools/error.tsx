"use client";

export default function ToolsError({ reset }: { reset: () => void }) {
  return (
    <main id="main">
      <h1>Tools are unavailable.</h1>
      <p className="tool-description">
        Couldn’t load this page. Try again in a moment.
      </p>
      <div className="action-row">
        <button className="primary-button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
