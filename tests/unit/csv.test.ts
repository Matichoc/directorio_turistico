import { describe, expect, it } from "vitest";
import {
  parseCsv,
  parseCsvWithHeader,
  toCsvDocument,
  toCsvRow,
} from "@/lib/csv";

describe("toCsvRow", () => {
  it("deja los valores simples sin comillas", () => {
    expect(toCsvRow(["a", "b", 1, true, null])).toBe("a,b,1,true,");
  });

  it("entrecomilla valores con comas, comillas o saltos de línea", () => {
    expect(toCsvRow(["La Ligua, Petorca"])).toBe('"La Ligua, Petorca"');
    expect(toCsvRow(['dijo "hola"'])).toBe('"dijo ""hola"""');
    expect(toCsvRow(["línea 1\nlínea 2"])).toBe('"línea 1\nlínea 2"');
  });
});

describe("parseCsv / toCsvDocument", () => {
  it("hace ida y vuelta con comas y comillas dentro de una celda", () => {
    const rows = [
      ["nombre", "descripcion"],
      ["La Ligua, Petorca", 'con "comillas" adentro'],
    ];
    const document = toCsvDocument(rows);
    expect(parseCsv(document)).toEqual(rows);
  });

  it("soporta saltos de línea CRLF (como exporta Excel)", () => {
    const document = 'a,b\r\n"c\nd",e\r\n';
    expect(parseCsv(document)).toEqual([
      ["a", "b"],
      ["c\nd", "e"],
    ]);
  });

  it("ignora filas completamente vacías", () => {
    const document = "a,b\n1,2\n\n3,4\n";
    expect(parseCsv(document)).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });
});

describe("parseCsvWithHeader", () => {
  it("mapea cada fila a un objeto por nombre de columna", () => {
    const document = "nombre,comuna\nPedegua,Petorca\n";
    expect(parseCsvWithHeader(document)).toEqual([
      { nombre: "Pedegua", comuna: "Petorca" },
    ]);
  });

  it("devuelve lista vacía para un documento vacío", () => {
    expect(parseCsvWithHeader("")).toEqual([]);
  });
});
