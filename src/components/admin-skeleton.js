export default function AdminSkeleton({ tone = "light", rows = 6, cards = 6 }) {
  const isDark = tone === "dark";
  const panelClass = isDark
    ? "border-yellow-500/20 bg-zinc-900"
    : "border-zinc-200 bg-white";
  const blockClass = isDark ? "bg-zinc-800" : "bg-zinc-200";
  const softBlockClass = isDark ? "bg-zinc-800/70" : "bg-zinc-100";

  return (
    <div className={`animate-pulse rounded-3xl border p-5 ${panelClass}`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className={`h-5 w-44 rounded-full ${blockClass}`} />
          <div
            className={`mt-3 h-3 w-64 max-w-full rounded-full ${softBlockClass}`}
          />
        </div>
        <div className={`h-10 w-28 rounded-2xl ${softBlockClass}`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-4 ${
              isDark
                ? "border-yellow-500/10 bg-black/20"
                : "border-zinc-100 bg-zinc-50"
            }`}
          >
            <div className={`h-28 rounded-2xl ${softBlockClass}`} />
            <div className={`mt-4 h-4 w-3/4 rounded-full ${blockClass}`} />
            <div className={`mt-3 h-3 w-1/2 rounded-full ${softBlockClass}`} />
            <div className="mt-5 flex gap-3">
              <div className={`h-9 flex-1 rounded-xl ${softBlockClass}`} />
              <div className={`h-9 flex-1 rounded-xl ${softBlockClass}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className={`h-4 rounded-full ${
              index % 2 === 0 ? blockClass : softBlockClass
            }`}
          />
        ))}
      </div>
    </div>
  );
}
