import { useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- иконки (inline SVG) ---------- */

function I({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconArrow = (p: { className?: string }) => (
  <I {...p}><path d="M4 12h15M13 6l6 6-6 6" /></I>
);
export const IconCheck = (p: { className?: string }) => (
  <I {...p}><path d="M4 12.5l5 5L20 6.5" /></I>
);
export const IconUpload = (p: { className?: string }) => (
  <I {...p}><path d="M12 16V4M6.5 9.5L12 4l5.5 5.5M4 20h16" /></I>
);
export const IconFile = (p: { className?: string }) => (
  <I {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></I>
);
export const IconTrash = (p: { className?: string }) => (
  <I {...p}><path d="M4 7h16M10 4h4M6.5 7l1 13h9l1-13M10 11v6M14 11v6" /></I>
);
export const IconDownload = (p: { className?: string }) => (
  <I {...p}><path d="M12 4v12M6.5 10.5L12 16l5.5-5.5M4 20h16" /></I>
);
export const IconLock = (p: { className?: string }) => (
  <I {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>
);
export const IconX = (p: { className?: string }) => (
  <I {...p}><path d="M6 6l12 12M18 6L6 18" /></I>
);
export const IconLogout = (p: { className?: string }) => (
  <I {...p}><path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" /></I>
);
export const IconMail = (p: { className?: string }) => (
  <I {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></I>
);
export const IconShield = (p: { className?: string }) => (
  <I {...p}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="M9 12l2 2 4-4" /></I>
);
export const IconPlus = (p: { className?: string }) => (
  <I {...p}><path d="M12 5v14M5 12h14" /></I>
);
export const IconSpark = (p: { className?: string }) => (
  <I {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></I>
);
export const IconBolt = (p: { className?: string }) => (
  <I {...p}><path d="M13 2L4 14h6l-1 8 9-12h-6z" /></I>
);

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M11 5H8a3 3 0 0 0-3 3v3M21 5h3a3 3 0 0 1 3 3v3M11 27H8a3 3 0 0 1-3-3v-3M21 27h3a3 3 0 0 0 3-3v-3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="4" fill="currentColor" />
    </svg>
  );
}

/* ---------- уголки-скобки «видоискателя» ---------- */

export function Brackets({ className = "border-mint-500/50" }: { className?: string }) {
  const pos = [
    "top-0 left-0 border-t-2 border-l-2",
    "top-0 right-0 border-t-2 border-r-2",
    "bottom-0 left-0 border-b-2 border-l-2",
    "bottom-0 right-0 border-b-2 border-r-2",
  ];
  return (
    <>
      {pos.map((c) => (
        <span key={c} className={`pointer-events-none absolute h-5 w-5 ${className} ${c}`} aria-hidden="true" />
      ))}
    </>
  );
}

/* ---------- радар ожидания ---------- */

export function Radar({ className = "h-44 w-44" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="90" className="stroke-mint-500/25" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="60" className="stroke-mint-500/15" strokeWidth="1" fill="none" />
        <circle cx="100" cy="100" r="30" className="stroke-mint-500/15" strokeWidth="1" fill="none" />
        <line x1="10" y1="100" x2="190" y2="100" className="stroke-mint-500/10" strokeWidth="1" />
        <line x1="100" y1="10" x2="100" y2="190" className="stroke-mint-500/10" strokeWidth="1" />
        <g className="radar-sweep">
          <path d="M100 100 L100 12 A88 88 0 0 1 148 25 Z" fill="rgba(46,207,156,0.20)" />
          <line x1="100" y1="100" x2="100" y2="12" stroke="rgba(46,207,156,0.75)" strokeWidth="1.5" />
        </g>
        <circle cx="142" cy="68" r="3" fill="#2ecf9c" className="pulse-dot" />
        <circle cx="62" cy="138" r="3" fill="#f4bd5a" className="pulse-dot" style={{ animationDelay: "0.6s" }} />
        <circle cx="120" cy="150" r="2.5" fill="#f57f6d" className="pulse-dot" style={{ animationDelay: "1.1s" }} />
      </svg>
    </div>
  );
}

/* ---------- счётчик с анимацией ---------- */

export function useCountUp(target: number, duration = 1300): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(target * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ---------- круговая шкала ---------- */

export function Gauge({
  value,
  label,
  color,
  note,
}: {
  value: number;
  label: string;
  color: string;
  note: string;
}) {
  const v = useCountUp(value);
  const R = 56;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          <circle cx="70" cy="70" r={R} stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" />
          <circle
            cx="70"
            cy="70"
            r={R}
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - v / 100)}
            style={{ filter: `drop-shadow(0 0 10px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-bold tabular-nums">
            {Math.round(v)}
            <span className="text-base text-fog-500">%</span>
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-fog-500">{label}</p>
        <p className="mt-0.5 text-xs text-fog-300">{note}</p>
      </div>
    </div>
  );
}

/* ---------- штамп на отчёте ---------- */

export function Stamp({ verdict }: { verdict: "clean" | "mixed" | "risk" }) {
  const cfg =
    verdict === "clean"
      ? { t: "ОДОБРЕНО", s: "ТЕКСТ ОРИГИНАЛЕН", cls: "border-mint-500/80 text-mint-400" }
      : verdict === "mixed"
        ? { t: "ПРОВЕРЬТЕ", s: "ЕСТЬ ЗАМЕЧАНИЯ", cls: "border-sun-400/80 text-sun-400" }
        : { t: "РИСК", s: "ТРЕБУЕТ ПРАВОК", cls: "border-coral-400/80 text-coral-400" };
  return (
    <div
      className={`stamp-in pointer-events-none absolute right-5 top-5 z-10 rounded border-2 px-3 py-1.5 text-center ${cfg.cls} bg-ink-950/60`}
    >
      <div className="font-display text-sm font-bold tracking-[0.18em]">{cfg.t}</div>
      <div className="font-mono text-[9px] tracking-[0.14em] opacity-80">{cfg.s}</div>
    </div>
  );
}

/* ---------- scroll reveal ---------- */

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${vis ? "is-visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- тосты ---------- */

export type ToastTone = "ok" | "warn" | "err";
export interface ToastItem {
  id: number;
  msg: string;
  tone: ToastTone;
}

export function Toasts({ items }: { items: ToastItem[] }) {
  const tone = {
    ok: { cls: "border-mint-500/50 text-mint-300", icon: <IconCheck className="h-4 w-4" /> },
    warn: { cls: "border-sun-400/50 text-sun-300", icon: <IconBolt className="h-4 w-4" /> },
    err: { cls: "border-coral-400/50 text-coral-300", icon: <IconX className="h-4 w-4" /> },
  } as const;
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`toast-in pointer-events-auto flex items-center gap-3 rounded-lg border bg-ink-800/95 px-4 py-3 shadow-xl shadow-black/40 backdrop-blur ${tone[t.tone].cls}`}
        >
          <span className="shrink-0">{tone[t.tone].icon}</span>
          <span className="text-sm leading-snug text-fog-100">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
