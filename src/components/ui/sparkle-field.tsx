const SPARKLES = [
  { top: "12%", left: "18%", delay: "0s", size: "h-1.5 w-1.5" },
  { top: "22%", left: "82%", delay: "0.7s", size: "h-1 w-1" },
  { top: "58%", left: "8%", delay: "1.3s", size: "h-1 w-1" },
  { top: "68%", left: "72%", delay: "1.9s", size: "h-2 w-2" },
  { top: "38%", left: "48%", delay: "0.4s", size: "h-1 w-1" },
  { top: "85%", left: "32%", delay: "1.6s", size: "h-1.5 w-1.5" },
  { top: "15%", left: "60%", delay: "2.2s", size: "h-1 w-1" },
] as const;

/**
 * Chispas/estrellitas decorativas que parpadean — pedido del usuario para
 * que el hero se sienta más "galaxia/tecnología" en vez de plano. Puramente
 * decorativo (`aria-hidden`), pensado para fondos oscuros.
 */
export function SparkleField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {SPARKLES.map((sparkle, index) => (
        <span
          key={index}
          className={`animate-sparkle-twinkle absolute rounded-full bg-white shadow-[0_0_6px_2px_rgba(255,255,255,0.8)] ${sparkle.size}`}
          style={{
            top: sparkle.top,
            left: sparkle.left,
            animationDelay: sparkle.delay,
          }}
        />
      ))}
    </div>
  );
}
