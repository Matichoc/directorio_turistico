import { describe, expect, it } from "vitest";
import {
  REPORTAJES,
  embedUrl,
  formatDuration,
  reportajesForRoute,
} from "@/lib/reportajes";

describe("reportajes", () => {
  it("usa siempre el reproductor oficial, nunca un archivo propio", () => {
    for (const reportaje of REPORTAJES) {
      expect(embedUrl(reportaje)).toMatch(
        /^https:\/\/(www\.youtube-nocookie\.com\/embed|rudo\.video\/vod)\//,
      );
      expect(reportaje.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("no repite reportajes", () => {
    const keys = REPORTAJES.map((reportaje) => reportaje.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("muestra en la ruta del poncho solo los que tratan de ella", () => {
    expect(
      reportajesForRoute("ruta-del-diablo-pedegua-chincolco").map((r) => r.key),
    ).toEqual(["canal13", "tvn24"]);
    expect(reportajesForRoute("ruta-ferroviaria-pedegua-las-palmas")).toEqual(
      [],
    );
  });

  it("escribe la duración en horas y minutos", () => {
    expect(formatDuration(20)).toBe("20 min");
    expect(formatDuration(71)).toBe("1 h 11 min");
    expect(formatDuration(60)).toBe("1 h");
  });
});
