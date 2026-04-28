import Link from "next/link";

interface UpgradeGateProps {
  /** Big heading — e.g. "VC Pool is for ELITE and ELITE Plus" */
  title: string;
  /** Supporting copy under the title */
  description: string;
  /** Where Upgrade Now should link to (defaults to subscription settings) */
  href?: string;
  /** Override the CTA label */
  ctaLabel?: string;
}

/**
 * Shared inline upgrade gate, matching the Top Trades empty-state look.
 * Use to replace a whole feature page when the user's tier doesn't qualify.
 */
export function UpgradeGate({
  title,
  description,
  href = "/dashboard/settings/subscription",
  ctaLabel = "Upgrade Now",
}: UpgradeGateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur p-8">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-6">{description}</p>
        <Link
          href={href}
          className="inline-block px-6 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-semibold"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
