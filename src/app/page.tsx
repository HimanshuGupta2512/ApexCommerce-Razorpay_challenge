import Link from "next/link";
import { Hexagon, ShieldCheck, Calculator, Zap,ArrowRight } from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
export const metadata = {
  title: "ApexCommerce — Agentic Commerce with Guardrails",
  description:
    "ApexCommerce pairs conversational AI with zero-trust server logic: fail-closed security, deterministic math, and sub-50ms cart validation.",
};

const metrics = [
  {
    icon: ShieldCheck,
    tone: "text-emerald-400",
    title: "Fail-Closed Security",
    description:
      "Strict HMAC SHA-256 webhook verification. Rejects prompt-injection attacks and unauthorized coupon bypassing in real-time.",
  },
  {
    icon: Calculator,
    tone: "text-blue-400",
    title: "100% Deterministic Math",
    description:
      "Zero floating-point errors. Complete separation of conversational AI and integer-safe paise-level financial calculations.",
  },
  {
    icon: Zap,
    tone: "text-amber-400",
    title: "Sub-50ms Gatekeeper",
    description:
      "Ultra-low latency cart validation. Intercepts AI tool-calls and verifies inventory shape before Razorpay order creation.",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Ambient background glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-64 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-72 right-0 h-[34rem] w-[34rem] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #10b981 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
            <Hexagon className="size-5 text-white" strokeWidth={2.4} />
          </span>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            ApexCommerce
          </span>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="https://github.com/HimanshuGupta2512/ApexCommerce-Razorpay_challenge"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:flex"
          >
            <GithubIcon className="size-4"/> View GitHub
          </a>
          <Link
            href="/demo"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:-translate-y-0.5"
          >
            Launch Demo
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto max-w-6xl px-6">
        <section className="pt-20 pb-16 text-center sm:pt-28 sm:pb-20">
          <p className="mx-auto mb-6 w-fit rounded-full border border-slate-800 bg-slate-900/80 px-4 py-1.5 text-xs font-medium tracking-wide text-blue-400 backdrop-blur shadow-inner">
            Zero-Trust AI Storefront Infrastructure
          </p>
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
            Agentic Commerce with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Deterministic Guardrails.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            The LLM handles the conversation. Hardened, zero-trust server logic controls the money.
            A production-ready AI storefront built on Razorpay APIs.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 transition-all hover:bg-blue-500 hover:-translate-y-0.5 sm:w-auto"
            >
              Launch Live Demo <ArrowRight className="size-4" />
            </Link>
            <a
              href="#engine"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 px-8 py-3.5 text-sm font-semibold text-slate-300 backdrop-blur transition-all hover:bg-slate-800/80 hover:text-white sm:w-auto"
            >
              Read Architecture
            </a>
          </div>
        </section>

        {/* Metrics Grid */}
        <section id="engine" className="grid gap-6 pb-24 md:grid-cols-3">
          {metrics.map(({ icon: Icon, tone, title, description }) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:bg-slate-900/80"
            >
              <span className="mb-6 flex size-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/80">
                <Icon className={`size-6 ${tone}`} />
              </span>
              <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
            </article>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 px-6 py-8 text-center text-xs text-slate-500">
        Built for the Razorpay AI Buildathon. Engineered for Track 1: AI Growth &amp; Agentic Commerce.
      </footer>
    </div>
  );
}