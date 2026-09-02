import { ClipboardCheck, FolderLock, Gauge, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

const highlights = [
  { icon: ClipboardCheck, text: "Assess controls against ISO/IEC 27001:2022" },
  { icon: FolderLock, text: "Keep evidence beside the control it supports" },
  { icon: Gauge, text: "Track remediation until every gap is closed" },
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
    <div className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between bg-brand-700 p-10 text-white lg:flex">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-semibold">ISMS Compliance Platform</span>
        </div>

        <div className="relative space-y-6">
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight">
            One place for gap analysis, evidence and remediation.
          </h1>
          <ul className="space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <Icon className="size-4 shrink-0" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/60">
          Academic project scenario · Northern Rivers Local Health District
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <span className="flex size-11 items-center justify-center rounded-xl bg-brand-600 text-white lg:hidden">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-content-muted">
              Use the account issued to you by the ISMS administrator.
            </p>
          </div>

          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </div>
  );
}
