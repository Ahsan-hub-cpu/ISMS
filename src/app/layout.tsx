import type { Metadata } from "next";
import { Figtree, Sora } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ISMS Compliance Platform",
    template: "%s · ISMS Compliance Platform",
  },
  description:
    "Gap analysis and compliance tracking for an information security management system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${body.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* Extensions often mutate <body> attributes before React hydrates. */}
      <body className="min-h-full font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
