import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROI Calculator — Code Sample",
  description:
    "Interactive ROI calculator showing complex React state, hooks, and a TypeScript pricing model with full Vitest coverage.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
