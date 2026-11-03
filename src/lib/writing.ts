function getText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  if ("text" in node && typeof node.text === "string") return node.text;
  if ("type" in node && node.type === "linebreak") return "\n";
  if ("children" in node && Array.isArray(node.children)) {
    const separator = "type" in node && node.type === "root" ? "\n" : "";
    const text = node.children.map(getText).join(separator);
    return "type" in node &&
      ["paragraph", "heading", "listitem", "quote"].includes(String(node.type))
      ? `${text}\n`
      : text;
  }

  return "";
}

export function getWritingStats(content: unknown) {
  const text =
    content && typeof content === "object" && "root" in content
      ? getText(content.root).trim()
      : "";
  const words = text ? text.split(/\s+/u).length : 0;

  return { words, minutes: words ? Math.max(1, Math.ceil(words / 200)) : 0 };
}
