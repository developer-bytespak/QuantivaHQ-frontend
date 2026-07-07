"use client";

import { RefObject, useEffect, useRef } from "react";
import Image from "next/image";
import { m, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Scroll-scrubbed particle background spanning the first three sections:
 *
 *   hero     → glowing particle globe with connective arcs (centered)
 *   about    → rotating torus ring (slides LEFT, clear of the image)
 *   features → the ring drifts right and bursts outward into sparks, out of
 *              which the robot video grows from tiny to full size
 */

type V3 = [number, number, number];

interface Particle {
  sphere: V3;
  torus: V3;
  /** Scatter target — each particle bursts outward along its own path. */
  figure: V3;
  color: string;
  size: number;
}

function buildParticles(count: number): Particle[] {
  const GOLDEN = Math.PI * (1 + Math.sqrt(5));
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    // Globe — fibonacci sphere
    const k = i + 0.5;
    const phi = Math.acos(1 - (2 * k) / count);
    const theta = GOLDEN * k;
    const sphere: V3 = [
      Math.sin(phi) * Math.cos(theta) * 0.95,
      Math.cos(phi) * 0.85,
      Math.sin(phi) * Math.sin(theta) * 0.95,
    ];

    // Torus ring — clean 3D form that reads well while rotating
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    const R = 0.82;
    const tube = 0.3;
    const torus: V3 = [
      (R + tube * Math.cos(v)) * Math.cos(u),
      tube * Math.sin(v),
      (R + tube * Math.cos(v)) * Math.sin(u),
    ];

    // Scatter target: the particle's own torus position pushed outward with
    // jitter — the ring bursts into sparks, out of which the robot grows
    const burst = 1.6 + Math.random() * 0.7;
    const figure: V3 = [
      torus[0] * burst + (Math.random() - 0.5) * 0.3,
      torus[1] * burst + (Math.random() - 0.5) * 0.3,
      torus[2] * burst + (Math.random() - 0.5) * 0.3,
    ];

    const roll = Math.random();
    const color = roll < 0.45 ? "255,122,26" : roll < 0.85 ? "255,178,56" : "255,240,220";

    particles.push({ sphere, torus, figure, color, size: 0.7 + Math.random() * 1.1 });
  }
  return particles;
}

/** Random nearby pairs on the sphere for connective arcs. */
function buildSphereLinks(particles: Particle[], max: number): [number, number][] {
  const links: [number, number][] = [];
  let attempts = 0;
  while (links.length < max && attempts < max * 60) {
    attempts++;
    const a = Math.floor(Math.random() * particles.length);
    const b = Math.floor(Math.random() * particles.length);
    if (a === b) continue;
    const pa = particles[a].sphere;
    const pb = particles[b].sphere;
    const d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
    if (d > 0.12 && d < 0.5) links.push([a, b]);
  }
  return links;
}

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function ScrollSceneBackground({ targetRef }: { targetRef: RefObject<HTMLDivElement | null> }) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: targetRef, offset: ["start start", "end end"] });

  const stateRef = useRef({ p: 0, raf: 0 });
  const drawRef = useRef<(p: number) => void>(() => {});

  // Cinematic horizon backdrop sits behind the globe, fading out as About arrives
  const bgOpacity = useTransform(scrollYProgress, [0.14, 0.32], [1, 0]);

  useEffect(() => {
    if (reduced) return;
    const holder = holderRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!holder || !canvas || !ctx) return;

    const dense = window.innerWidth >= 768;
    const wide = window.innerWidth >= 1024;
    const count = dense ? 900 : 420;
    // Side drifts only exist on desktop layouts; on mobile everything stays centered
    const figureOx = wide ? 0.22 : 0;
    const aboutOx = wide ? -0.26 : 0;
    const particles = buildParticles(count);
    const sphereLinks = buildSphereLinks(particles, dense ? 130 : 60);
    const projected = new Float32Array(count * 2);

    const draw = (p: number) => {
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      // Formation index: 0 globe → 1 torus → 2 implode toward the robot.
      // The 1→2 leg is stretched for a slower, smoother hand-off.
      let f: number;
      if (p < 0.16) f = 0;
      else if (p < 0.4) f = (p - 0.16) / 0.24;
      else if (p < 0.56) f = 1;
      else if (p < 0.82) f = 1 + (p - 0.56) / 0.26;
      else f = 2;

      const toTorus = smooth(clamp01(f));
      const toFigure = smooth(clamp01(f - 1));
      const mix = f <= 1 ? toTorus : toFigure;

      // Horizontal drift: centered → left (about) → right 40% (features); no drift on mobile
      const ox = f <= 1 ? lerp(0, aboutOx, toTorus) : lerp(aboutOx, figureOx, toFigure);
      const rotY = p * Math.PI * 2.4 * (1 - toFigure);
      // The torus tilts gently toward the viewer
      const rotX = lerp(0.3 - p * 0.2, 0.5, toTorus * (1 - toFigure));
      const particleFade = 1 - toFigure;
      if (particleFade <= 0.01) return;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cx = w / 2 + w * ox;
      const cy = h / 2;
      const base = Math.min(w, h) * 0.42;
      const fov = 3.2;

      for (let i = 0; i < count; i++) {
        const pt = particles[i];
        const from = f <= 1 ? pt.sphere : pt.torus;
        const to = f <= 1 ? pt.torus : pt.figure;
        const x = from[0] + (to[0] - from[0]) * mix;
        const y = from[1] + (to[1] - from[1]) * mix;
        const z = from[2] + (to[2] - from[2]) * mix;

        const rx = x * cosY + z * sinY;
        const rz = -x * sinY + z * cosY;
        const ry = y * cosX - rz * sinX;
        const rz2 = y * sinX + rz * cosX;
        const s = fov / (fov + rz2);
        const px = cx + rx * base * s;
        const py = cy + ry * base * s;
        projected[i * 2] = px;
        projected[i * 2 + 1] = py;

        const depth = clamp01((s - 0.72) * 1.6);
        const alpha = Math.min(0.8, particleFade * (0.12 + depth * 0.55));
        if (alpha <= 0.015) continue;

        // Sparks shrink as they scatter so the burst feels like dissipating energy
        const r = pt.size * s * (w > 1500 ? 1.5 : 1.15) * (1 - toFigure * 0.35);
        ctx.fillStyle = `rgba(${pt.color},${(alpha * 0.15).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${pt.color},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Connective arcs while the globe is dominant
      const arcAlpha = (1 - toTorus) * particleFade * 0.1;
      if (arcAlpha > 0.01 && f < 1) {
        ctx.strokeStyle = `rgba(255,178,56,${arcAlpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const [a, b] of sphereLinks) {
          ctx.moveTo(projected[a * 2], projected[a * 2 + 1]);
          ctx.lineTo(projected[b * 2], projected[b * 2 + 1]);
        }
        ctx.stroke();
      }

    };

    drawRef.current = draw;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = holder.clientWidth * dpr;
      canvas.height = holder.clientHeight * dpr;
      draw(stateRef.current.p);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(holder);
    resize();

    const state = stateRef.current;
    return () => {
      ro.disconnect();
      if (state.raf) cancelAnimationFrame(state.raf);
      drawRef.current = () => {};
    };
  }, [reduced]);

  // Redraw only when scroll changes, throttled to one frame
  useMotionValueEvent(scrollYProgress, "change", (p) => {
    stateRef.current.p = p;
    if (!stateRef.current.raf) {
      stateRef.current.raf = requestAnimationFrame(() => {
        stateRef.current.raf = 0;
        drawRef.current(stateRef.current.p);
      });
    }
  });

  if (reduced) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div ref={holderRef} className="sticky top-0 h-screen w-full overflow-hidden">
        <m.div className="absolute inset-0" style={{ opacity: bgOpacity }}>
          <Image src="/hero-bg-blue.png" alt="" fill priority sizes="100vw" className="object-cover opacity-80" />
          {/* Blend edges into the page and protect headline contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/85" />
        </m.div>
        <canvas ref={canvasRef} className="relative h-full w-full opacity-80" />
      </div>
    </div>
  );
}
