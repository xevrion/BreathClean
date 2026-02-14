import Link from "next/link";

import { MapPin, Route } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f6f8f6] dark:bg-[#102216]">
      <div className="flex max-w-md flex-col items-center px-6 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2bee6c]/10">
          <Route className="h-10 w-10 text-[#2bee6c]" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
          No Saved Routes
        </h2>
        <p className="mb-8 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          You haven&apos;t saved any routes yet. Plan a route from the home page
          and save it to see it here.
        </p>
        <Link
          href="/home"
          className="flex items-center gap-2 rounded-lg bg-[#2bee6c] px-6 py-3 text-sm font-bold text-[#102216] shadow-lg shadow-[#2bee6c]/20 transition-all hover:bg-[#2bee6c]/90 active:scale-95"
        >
          <MapPin className="h-4 w-4" />
          Plan a Route
        </Link>
      </div>
    </div>
  );
}
