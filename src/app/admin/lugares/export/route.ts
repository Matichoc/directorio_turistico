import { exportPlacesCsv } from "@/lib/server/content/places-bulk";

export async function GET() {
  const csv = await exportPlacesCsv();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="lugares.csv"',
    },
  });
}
