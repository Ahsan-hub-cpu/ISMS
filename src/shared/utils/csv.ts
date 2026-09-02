/** Quotes a value only when it could otherwise break the row. */
const escapeCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";

  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);

  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const toCsv = (
  headers: readonly string[],
  rows: readonly (readonly unknown[])[],
): string => {
  const lines = [headers.map(escapeCell).join(","), ...rows.map((row) => row.map(escapeCell).join(","))];
  return `${lines.join("\r\n")}\r\n`;
};

export const csvResponse = (fileName: string, csv: string): Response =>
  new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${fileName}"`,
    },
  });
