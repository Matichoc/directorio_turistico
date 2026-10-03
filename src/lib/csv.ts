/**
 * Codec CSV genérico (RFC4180: comillas dobles, comas y saltos de línea
 * dentro de una celda) — una sola fuente de verdad para exportar e
 * importar, en vez de parsers ad-hoc por entidad (como el de
 * `scripts/export-content-gaps.ts`, que no necesitaba leer de vuelta).
 */

function toCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function toCsvRow(values: (string | number | boolean | null)[]): string {
  return values
    .map((value) =>
      toCsvCell(value === null || value === undefined ? "" : String(value)),
    )
    .join(",");
}

export function toCsvDocument(rows: string[][]): string {
  return rows.map((row) => toCsvRow(row)).join("\r\n") + "\r\n";
}

/** Parsea un documento CSV completo a filas de celdas (texto plano, sin tipar). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  // Normaliza saltos de línea de Windows/Excel antes de recorrer carácter a
  // carácter, así no hay que distinguir \r\n de \n en el bucle principal.
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  // Última celda/fila, si el documento no termina en salto de línea.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

/** Parsea un CSV con encabezado a una lista de objetos `{columna: valor}`. */
export function parseCsvWithHeader(text: string): Record<string, string>[] {
  const [header, ...dataRows] = parseCsv(text);
  if (!header) return [];

  return dataRows.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((column, index) => {
      record[column.trim()] = (row[index] ?? "").trim();
    });
    return record;
  });
}
