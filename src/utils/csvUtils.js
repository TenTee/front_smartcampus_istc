export function arrayToCsv(headers, rows) {
  const escape = (value) => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = headers.map(escape).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escape(row[h] ?? "")).join(","),
  );
  return [headerLine, ...dataLines].join("\n");
}

export function downloadFile(
  filename,
  content,
  mime = "text/csv;charset=utf-8;",
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function parseCsvText(text) {
  // Very small CSV parser for simple cases (no multiline fields expected in templates)
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0]
    .split(",")
    .map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, ""));
    const obj = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ""));
    return obj;
  });
  return { headers, rows };
}

export function validateRows(headers, rows, requiredFields = []) {
  const errors = [];
  rows.forEach((row, idx) => {
    requiredFields.forEach((field) => {
      if (!row[field] || String(row[field]).trim() === "") {
        errors.push({
          row: idx + 2,
          field,
          message: `Le champ "${field}" est requis`,
        });
      }
    });
  });
  return errors;
}
