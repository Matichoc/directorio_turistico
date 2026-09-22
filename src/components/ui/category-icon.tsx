const ICON_PATHS: Record<string, string> = {
  mountain: "M3 20l6-10 4 6 3-4 5 8H3z",
  utensils:
    "M7 3v7a2 2 0 0 0 2 2v9M7 3v7a2 2 0 0 1-2 2v9M17 3c-2 0-3 3-3 6s1 4 3 4 3-1 3-4-1-6-3-6zm0 10v9",
  landmark: "M4 21h16M5 21V10M19 21V10M3 10l9-6 9 6M9 10v11M15 10v11",
  waves:
    "M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0M2 12c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0",
};

export function CategoryIcon({
  icon,
  className = "h-5 w-5",
}: {
  icon: string | null | undefined;
  className?: string;
}) {
  const path = (icon && ICON_PATHS[icon]) || ICON_PATHS.landmark;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
