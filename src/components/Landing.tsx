"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarCheckIcon,
  CheckIcon,
  ClipboardCheckIcon,
  CodeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("reveal", visible && "is-visible", className)}
    >
      {children}
    </div>
  );
}

function useTimer(start = 754) {
  const [seconds, setSeconds] = useState(start);
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

const KEYWORDS = /\b(function|const|for|of|new|if|return)\b/;

function highlight(text: string) {
  return text.split(KEYWORDS).map((part, i) =>
    KEYWORDS.test(part) ? (
      <span key={i} className="text-teal-400">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

/* -------------------------------------------------------------------------- */
/*                         SVG "PHOTOS" (drawn in code)                       */
/* -------------------------------------------------------------------------- */

function Avatar({
  id,
  bgFrom,
  bgTo,
  skin,
  hair,
  shirt,
}: {
  id: string;
  bgFrom: string;
  bgTo: string;
  skin: string;
  hair: string;
  shirt: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bgFrom} />
          <stop offset="1" stopColor={bgTo} />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#bg-${id})`} />
      <circle cx="165" cy="35" r="55" fill="#fff" opacity="0.08" />
      <circle cx="30" cy="170" r="45" fill="#fff" opacity="0.06" />
      <path d="M28 200c0-44 32-70 72-70s72 26 72 70z" fill={shirt} />
      <rect x="88" y="104" width="24" height="30" rx="10" fill={skin} />
      <circle cx="100" cy="82" r="36" fill={skin} />
      <path
        d="M63 82c-3-32 17-47 38-47s38 15 35 44c-7-15-21-22-36-22s-27 8-37 25z"
        fill={hair}
      />
      <g className="animate-eye origin-center transform-fill" fill="#1f2937">
        <circle cx="86" cy="86" r="3.4" />
        <circle cx="114" cy="86" r="3.4" />
      </g>
      <path
        d="M90 102q10 8 20 0"
        stroke="#7c2d12"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function WaveBars({ className }: { className?: string }) {
  const bars = [0.9, 0.6, 1.1, 0.75, 1, 0.65, 0.95];
  return (
    <div className={cn("flex h-5 items-end gap-0.75", className)}>
      {bars.map((d, i) => (
        <span
          key={i}
          className="animate-wave origin-bottom block h-full w-0.75 rounded-full bg-emerald-400"
          style={{ animationDuration: `${d}s`, animationDelay: `${i * 90}ms` }}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         ANIMATED "VIDEO" CALL MOCKUP                       */
/* -------------------------------------------------------------------------- */

const CODE_LINES = [
  "function twoSum(nums, target) {",
  "  const seen = new Map();",
  "  for (const [i, n] of nums.entries()) {",
  "    if (seen.has(target - n)) return [seen.get(target - n), i];",
  "    seen.set(n, i);",
  "  }",
  "}",
];

function CallMockup() {
  const time = useTimer();
  const [cycle, setCycle] = useState(0);

  // restart the typing animation every 13s so it feels like a live session
  useEffect(() => {
    const id = setInterval(() => setCycle((c) => c + 1), 13000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute -inset-4 rounded-4xl bg-linear-to-tr from-emerald-500/30 via-teal-400/20 to-transparent blur-2xl" />

      <div className="animate-float-slow relative overflow-hidden rounded-2xl border bg-card shadow-2xl">
        {/* title bar */}
        <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            InterviewX &middot; Frontend Engineer
          </span>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-red-500" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="tabular-nums text-muted-foreground">{time}</span>
          </div>
        </div>

        <div className="grid gap-3 p-3 sm:grid-cols-2">
          {/* video tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="relative aspect-square overflow-hidden rounded-xl sm:aspect-video">
              <Avatar
                id="a"
                bgFrom="#065f46"
                bgTo="#0f766e"
                skin="#f1c7a0"
                hair="#2b1d14"
                shirt="#0b3b36"
              />
              <span className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/80" />
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                Interviewer
                <WaveBars className="h-3" />
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-xl sm:aspect-video">
              <Avatar
                id="b"
                bgFrom="#134e4a"
                bgTo="#1e293b"
                skin="#b9835a"
                hair="#111827"
                shirt="#334155"
              />
              <div className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] text-white backdrop-blur">
                Candidate
              </div>
            </div>
          </div>

          {/* code editor */}
          <div className="flex flex-col overflow-hidden rounded-xl border bg-[#0b1220] font-mono text-[11px] leading-5 text-slate-200 sm:text-xs">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-slate-400">
              <CodeIcon className="h-3.5 w-3.5 text-teal-400" />
              solution.js
              <span className="ml-auto flex items-center gap-1 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                synced
              </span>
            </div>
            <div key={cycle} className="flex-1 space-y-0.5 p-3">
              {CODE_LINES.map((line, i) => (
                <span
                  key={i}
                  className="typing"
                  style={
                    {
                      "--chars": line.length,
                      animationDelay: `${0.6 + i * 1.1}s`,
                      animationDuration: `${Math.max(0.5, line.length * 0.03)}s`,
                    } as CSSProperties
                  }
                >
                  {highlight(line)}
                </span>
              ))}
              <div
                className="animate-pop mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300"
                style={{ animationDelay: "9s" }}
              >
                <CheckIcon className="h-3.5 w-3.5" /> 3 tests passed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div
        className="animate-float absolute -left-4 top-24 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-lg md:flex"
        style={{ animationDelay: "-2s" }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
          <ClipboardCheckIcon className="h-3.5 w-3.5" />
        </span>
        Feedback saved
      </div>
      <div
        className="animate-float absolute -right-3 bottom-10 hidden items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-lg md:flex"
        style={{ animationDelay: "-4s" }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-teal-500/15 text-teal-600">
          <SparklesIcon className="h-3.5 w-3.5" />
        </span>
        Strong candidate
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const MARQUEE = [
  "Live video interviews",
  "Shared code editor",
  "Smart scheduling",
  "Structured feedback",
  "Role-based dashboards",
  "Secure sessions",
];

const FEATURES = [
  {
    icon: VideoIcon,
    title: "Live video interviews",
    description: "Start or join a crisp video call in seconds, with nothing to install.",
  },
  {
    icon: CodeIcon,
    title: "Built-in code editor",
    description: "Candidates solve problems in a shared editor while you watch it happen.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Smart scheduling",
    description: "Plan interviews ahead and keep everyone on the same page.",
  },
  {
    icon: ClipboardCheckIcon,
    title: "Structured feedback",
    description: "Capture notes and ratings during the session, not after.",
  },
  {
    icon: UsersIcon,
    title: "Made for two roles",
    description: "Interviewers and candidates each get a dashboard that fits them.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure by default",
    description: "Every session is tied to signed-in accounts, so only the right people join.",
  },
];

const STEPS = [
  {
    title: "Sign in",
    description: "Create your account in a few clicks and land on your own dashboard.",
  },
  {
    title: "Start or join",
    description: "Interviewers launch a call, candidates join from their scheduled list.",
  },
  {
    title: "Interview and review",
    description: "Talk, code together, and leave with feedback ready to share.",
  },
];

const ROLES = [
  {
    label: "For interviewers",
    title: "Run sessions with confidence",
    points: [
      "Start an instant call or schedule ahead",
      "Watch candidates code in real time",
      "Keep notes and ratings in one place",
    ],
  },
  {
    label: "For candidates",
    title: "Show up prepared, perform at your best",
    points: [
      "See every upcoming interview at a glance",
      "Join with a single click",
      "Work in a clean, distraction-free editor",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*                                   LANDING                                  */
/* -------------------------------------------------------------------------- */

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      {/* ---------------------------------- HERO --------------------------------- */}
      <section className="relative">
        <div className="grid-bg pointer-events-none absolute inset-0 text-foreground" />
        <div className="animate-blob pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl" />
        <div
          className="animate-blob pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl"
          style={{ animationDelay: "-8s" }}
        />

        <div className="container relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
          <div className="space-y-7">
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Hiring, reimagined
            </span>

            <h1
              className="animate-fade-up text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ animationDelay: "100ms" }}
            >
              Run technical interviews that{" "}
              <span className="gradient-text">feel effortless</span>
            </h1>

            <p
              className="animate-fade-up max-w-xl text-lg text-muted-foreground"
              style={{ animationDelay: "200ms" }}
            >
              InterviewX brings live video, a shared code editor and structured
              feedback into one workspace, so interviewers focus on people and
              candidates focus on their best work.
            </p>

            <div
              className="animate-fade-up flex flex-wrap items-center gap-3"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group relative h-11 px-5 text-base shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/30"
                )}
              >
                Sign in to InterviewX
                <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-5 text-base"
                )}
              >
                See how it works
              </a>
            </div>

            <div
              className="animate-fade-up flex items-center gap-4 text-sm text-muted-foreground"
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex -space-x-2">
                {[
                  ["#065f46", "#0f766e", "#f1c7a0", "#2b1d14", "#0b3b36"],
                  ["#134e4a", "#1e293b", "#b9835a", "#111827", "#334155"],
                  ["#0f766e", "#164e63", "#e0ac84", "#7c2d12", "#134e4a"],
                ].map(([bgFrom, bgTo, skin, hair, shirt], i) => (
                  <div
                    key={i}
                    className="h-9 w-9 overflow-hidden rounded-full border-2 border-background"
                  >
                    <Avatar
                      id={`h${i}`}
                      bgFrom={bgFrom}
                      bgTo={bgTo}
                      skin={skin}
                      hair={hair}
                      shirt={shirt}
                    />
                  </div>
                ))}
              </div>
              Built for modern hiring teams
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "250ms" }}>
            <CallMockup />
          </div>
        </div>
      </section>

      {/* -------------------------------- MARQUEE -------------------------------- */}
      <section className="border-y bg-muted/30 py-4">
        <div className="overflow-hidden mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="animate-marquee flex w-max items-center gap-10 whitespace-nowrap">
            {[...MARQUEE, ...MARQUEE].map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-10 text-sm font-medium text-muted-foreground"
              >
                {item}
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------- FEATURES -------------------------------- */}
      <section className="container mx-auto max-w-7xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
            Everything you need
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            One workspace for the whole interview
          </h2>
          <p className="mt-4 text-muted-foreground">
            Stop juggling video tools, code pads and spreadsheets. InterviewX
            keeps it all together.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <Reveal key={title} delay={(i % 3) * 100}>
              <div className="group h-full rounded-xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg bg-linear-to-br from-emerald-600 to-teal-500 text-white transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------- HOW IT WORKS ------------------------------ */}
      <section id="how-it-works" className="border-y bg-muted/30 py-24">
        <div className="container mx-auto max-w-6xl px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              From sign-in to feedback in three steps
            </h2>
          </Reveal>

          <div className="relative mt-16 grid gap-10 md:grid-cols-3">
            <div className="absolute left-[16%] right-[16%] top-6 hidden h-0.5 bg-border md:block">
              <div className="animate-grow origin-left h-full bg-linear-to-r from-emerald-600 to-teal-400" />
            </div>
            {STEPS.map((step, i) => (
              <Reveal key={step.title} delay={i * 150} className="relative text-center">
                <div className="relative z-10 mx-auto grid h-12 w-12 place-items-center rounded-full bg-linear-to-br from-emerald-600 to-teal-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30">
                  {i + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted-foreground">
                  {step.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- ROLES --------------------------------- */}
      <section className="container mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-6 lg:grid-cols-2">
          {ROLES.map((role, i) => (
            <Reveal key={role.label} delay={i * 150}>
              <div className="relative h-full overflow-hidden rounded-2xl border bg-card p-8 shadow-sm">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl" />
                <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-xs font-medium text-emerald-600">
                  {role.label}
                </span>
                <h3 className="mt-4 text-2xl font-bold">{role.title}</h3>
                <ul className="mt-5 space-y-3">
                  {role.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------- CTA --------------------------------- */}
      <section className="container mx-auto max-w-7xl px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-600 via-emerald-600 to-teal-500 px-8 py-16 text-center text-white shadow-2xl shadow-emerald-600/20">
            <div className="animate-blob absolute -left-10 -top-10 h-52 w-52 rounded-full bg-white/15 blur-2xl" />
            <div
              className="animate-blob absolute -bottom-12 -right-8 h-60 w-60 rounded-full bg-teal-300/20 blur-2xl"
              style={{ animationDelay: "-6s" }}
            />
            <div className="relative">
              <h2 className="text-4xl font-bold tracking-tight">
                Ready to hire with InterviewX?
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-white/85">
                Sign in and run your first interview in minutes.
              </p>
              <Link
                href="/sign-in"
                className={cn(
                  buttonVariants({ variant: "secondary", size: "lg" }),
                  "group mt-8 h-11 px-6 text-base"
                )}
              >
                Sign in to continue
                <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* --------------------------------- FOOTER -------------------------------- */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} InterviewX. All rights reserved.
      </footer>
    </div>
  );
}