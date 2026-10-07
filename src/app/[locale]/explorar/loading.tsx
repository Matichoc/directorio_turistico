export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <div className="h-8 w-40 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      <div className="h-10 w-full animate-pulse rounded-full bg-black/5 dark:bg-white/10" />
      {/* El mapa es la vista por defecto: el esqueleto tiene su forma. */}
      <div className="h-[55vh] min-h-[380px] w-full animate-pulse rounded-2xl bg-black/5 dark:bg-white/10" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 w-52 shrink-0 animate-pulse rounded-2xl bg-black/5 dark:bg-white/10"
          />
        ))}
      </div>
    </main>
  );
}
