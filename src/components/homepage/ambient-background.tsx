/**
 * Single fixed background layer for the homepage: top aurora glow,
 * two slow-drifting brand orbs and a faint dot grid. Pure CSS — no JS after mount.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* Top aurora cone */}
      <div
        className="absolute -top-[45%] left-1/2 h-[90vh] w-[130vw] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(252,79,2,0.22) 0%, rgba(253,163,0,0.08) 38%, transparent 70%)",
        }}
      />
      {/* Drifting brand orbs */}
      <div
        className="hp-drift-a absolute top-1/3 -left-48 h-[34rem] w-[34rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(252,79,2,0.07), transparent 65%)" }}
      />
      <div
        className="hp-drift-b absolute -bottom-24 -right-48 h-[38rem] w-[38rem] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(253,163,0,0.06), transparent 65%)" }}
      />
      {/* Faint dot grid, fading out below the fold */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 65% at 50% 0%, black 0%, transparent 75%)",
        }}
      />
    </div>
  );
}
