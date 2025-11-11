interface ScreenScaffoldProps {
  title: string;
  description: string;
  highlights: string[];
  cta?: {
    label: string;
    href: string;
  };
}

export function ScreenScaffold({ title, description, highlights, cta }: ScreenScaffoldProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[--color-border] bg-[--color-surface]/80 p-10 shadow-xl shadow-blue-900/10 backdrop-blur">
      <div className="absolute right-10 top-10 h-32 w-32 rounded-full bg-linear-to-br from-blue-600/40 via-sky-400/30 to-cyan-300/20 blur-3xl" />
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[--color-accent]">Blueprint</p>
        <h1 className="text-3xl font-semibold text-slate-100">{title}</h1>
        <p className="max-w-2xl text-base text-slate-300">{description}</p>
      </header>
      <ul className="mt-8 grid gap-4 text-sm text-slate-200 md:grid-cols-2">
        {highlights.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-2xl border border-[--color-border] bg-[--color-surface-alt]/70 p-4"
          >
            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[--color-accent]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {cta && (
        <div className="mt-10 flex">
          <a
            href={cta.href}
            className="inline-flex items-center justify-center rounded-xl border border-[--color-border] bg-[--color-surface] px-6 py-2 text-sm font-semibold text-[--color-accent] transition hover:border-[--color-accent] hover:bg-[--color-accent]/10"
          >
            {cta.label}
          </a>
        </div>
      )}
    </section>
  );
}
