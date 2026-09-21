/** RFC 4180-style CSV, with doubled quotes and quoted line breaks. Values stay strings. */
export function parseCsv(source: string): string[][] {
  const input = source.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closed = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i]!;
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += char;
    } else if (char === ",") {
      row.push(field);
      field = "";
      closed = false;
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      closed = false;
    } else if (char === '"' && field === "" && !closed) quoted = true;
    else {
      if (closed || char === '"')
        throw new Error(
          "CSV has an unexpected quote or text after a closing quote.",
        );
      field += char;
    }
  }
  if (quoted) throw new Error("CSV has an unclosed quoted field.");
  if (row.length || field || closed) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function csvToJson(input: string): string {
  const [headers, ...rows] = parseCsv(input);
  if (
    !headers?.length ||
    headers.some((value) => !value.trim()) ||
    new Set(headers).size !== headers.length
  ) {
    throw new Error("CSV needs a first row of unique, non-empty column names.");
  }
  if (rows.some((row) => row.length !== headers.length))
    throw new Error(
      "CSV rows must have the same number of columns as the header.",
    );
  return JSON.stringify(
    rows.map((row) =>
      Object.fromEntries(headers.map((key, i) => [key, row[i]])),
    ),
    null,
    2,
  );
}

export function jsonToCsv(input: string): string {
  const data: unknown = JSON.parse(input.replace(/^\uFEFF/, ""));
  if (
    !Array.isArray(data) ||
    !data.length ||
    data.some(
      (item: unknown) =>
        !item || typeof item !== "object" || Array.isArray(item),
    )
  ) {
    throw new Error(
      'JSON-to-CSV needs a non-empty array of objects, such as [{"name":"Matthew"}].',
    );
  }
  const rows = data as Record<string, unknown>[];
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  if (!keys.length)
    throw new Error("The JSON objects have no columns to export.");
  const escape = (value: unknown) => {
    const text =
      value == null
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean"
            ? String(value)
            : "";
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return [
    keys.map(escape).join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\r\n");
}
