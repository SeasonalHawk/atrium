// PRD v5 Section 8, Screen Inventory: "landing entry" — the AltoLumo
// consultation entry point that routes into /funnel.
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink flex items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-steel">AltoLumo</p>
        <h1 className="mt-3 text-3xl font-semibold">Book a consultation about your AI implementation challenge</h1>
        <p className="mt-4 text-ink/70">
          A few quick questions, then pick a time that works. No forms to fill out later.
        </p>
        <Link
          href="/funnel"
          className="mt-8 inline-block rounded-md bg-deep-steel px-6 py-3 font-medium text-white hover:bg-ink"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
