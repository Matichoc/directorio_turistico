export default function Loading() {
  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <div className="h-8 w-40 animate-pulse rounded bg-black/5 dark:bg-white/10" />
      <div className="h-10 w-full animate-pulse rounded-full bg-black/5 dark:bg-white/10" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-black/5 dark:bg-white/10"
          />
        ))}
      </div>
    </main>
  );
}
