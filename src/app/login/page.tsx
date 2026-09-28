import { ClipboardCheck, FolderLock, Gauge, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const highlights = [
  {
    icon: ClipboardCheck,
    title: "Assess against ISO/IEC 27001:2022",
    text: "Score all 93 Annex A controls and watch compliance move in real time.",
  },
  {
    icon: FolderLock,
    title: "Evidence beside the control",
    text: "Upload proof where it belongs and let an assessor accept or reject it.",
  },
  {
    icon: Gauge,
    title: "Remediation until closure",
    text: "Every gap gets a rated risk, an owner and a dated action plan.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  // Only accept internal paths so the query string cannot redirect elsewhere.
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(38rem_28rem_at_20%_-10%,oklch(0.6_0.12_198/0.55),transparent_62%),radial-gradient(32rem_24rem_at_95%_110%,oklch(0.62_0.11_70/0.28),transparent_65%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(oklch(1_0_0/0.6)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/0.6)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(42rem_32rem_at_30%_20%,black,transparent)]"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="font-display text-sm font-semibold tracking-tight">
            ISMS Compliance Platform
          </span>
        </div>

        <div className="relative max-w-lg space-y-9">
          <div className="space-y-4">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-brand-300">
              Gap analysis · Compliance tracking
            </p>
            <h1 className="font-display text-[2.5rem] font-semibold leading-[1.1] tracking-[-0.025em]">
              One place for gap analysis, evidence and remediation.
            </h1>
          </div>

          <ul className="space-y-5">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.07] text-brand-300 ring-1 ring-inset ring-white/10">
                  <Icon className="size-[1.05rem]" aria-hidden />
                </span>
                <span className="space-y-0.5">
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-[0.8125rem] leading-relaxed text-white/60">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[0.6875rem] uppercase tracking-[0.14em] text-white/35">
          Academic project scenario
        </p>
      </section>

      <section className="app-canvas flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-[0_10px_24px_-10px_oklch(0.46_0.09_202/0.9)] lg:hidden">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <p className="eyebrow">Welcome back</p>
            <h2 className="font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.022em]">
              Sign in
            </h2>
            <p className="text-sm leading-relaxed text-content-muted">
              Use the account issued to you by the ISMS administrator.
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} />

          <p className="border-t border-surface-border pt-5 text-xs leading-relaxed text-content-subtle">
            Access is role based. What you can see and change depends on the permissions attached to
            your account.
          </p>
        </div>
      </section>
    </div>
  );
}
