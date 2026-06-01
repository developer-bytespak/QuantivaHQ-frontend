"use client";

export default function AffiliateAssetsPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-6">
        <h2 className="text-lg font-semibold text-white">Marketing Assets</h2>
        <p className="mt-1 text-sm text-slate-400">
          Logos, banners, copy templates, and short demo videos for your
          content.
        </p>
      </div>

      <Section title="Logos & wordmarks">
        Coming soon — full logo pack (SVG, PNG, light, dark).
      </Section>
      <Section title="Banners">
        Coming soon — pre-sized ad banners for common placements.
      </Section>
      <Section title="Copy templates">
        Coming soon — tweet templates, newsletter blurbs, video script
        outlines.
      </Section>
      <Section title="Demo video">
        Coming soon — 60s / 30s / 15s cuts.
      </Section>
      <Section title="Brand guidelines">
        Coming soon — do's, don'ts, and prohibited claims.
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#070d17] p-5">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{children}</p>
    </div>
  );
}
