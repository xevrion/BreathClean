"use client";

import Link from "next/link";

import {
  Clock,
  Navigation,
  Route,
  Ruler,
  ShieldCheck,
  Wind,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type { ISavedRoute } from "./types";

interface RouteInsightsPanelProps {
  route: ISavedRoute;
  subRouteIndex: number;
}

function getAqiBadge(score: number | null | undefined) {
  if (score == null)
    return { label: "N/A", color: "bg-slate-100 text-slate-600" };
  if (score <= 50)
    return { label: "Good", color: "bg-emerald-100 text-emerald-700" };
  if (score <= 100)
    return { label: "Fair", color: "bg-yellow-100 text-yellow-700" };
  if (score <= 150)
    return { label: "Poor", color: "bg-orange-100 text-orange-700" };
  return { label: "Unhealthy", color: "bg-red-100 text-red-700" };
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export default function RouteInsightsPanel({
  route,
  subRouteIndex,
}: RouteInsightsPanelProps) {
  const subRoute = route.routes[subRouteIndex];
  const aqi = getAqiBadge(subRoute.lastComputedScore);

  // Find the cleanest route
  const bestIdx = route.routes.reduce(
    (best, r, i) => {
      const score = r.lastComputedScore ?? Infinity;
      return score < best.score ? { score, idx: i } : best;
    },
    { score: Infinity, idx: 0 }
  ).idx;

  const bestRoute = route.routes[bestIdx];
  const isBest = subRouteIndex === bestIdx;

  return (
    <div className="flex h-full w-full flex-col border-l border-slate-200 bg-white lg:w-[360px] dark:border-slate-700 dark:bg-[#102216]">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Route Insights
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {route.name || "Saved Route"} &middot; Route {subRouteIndex + 1}
        </p>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* AQI Score */}
        <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <Wind className="h-4 w-4 text-[#2bee6c]" />
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Air Quality
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-slate-900 dark:text-white">
              {subRoute.lastComputedScore ?? "--"}
            </span>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                aqi.color
              )}
            >
              {aqi.label}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="mb-1 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase">
                Duration
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatDuration(subRoute.duration)}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
            <div className="mb-1 flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-400 uppercase">
                Distance
              </span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatDistance(subRoute.distance)}
            </span>
          </div>
        </div>

        {/* Best Route Recommendation */}
        {route.routes.length > 1 && (
          <div
            className={cn(
              "rounded-xl border p-4",
              isBest
                ? "border-[#2bee6c]/30 bg-[#2bee6c]/5"
                : "border-slate-100 dark:border-slate-800"
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <ShieldCheck
                className={cn(
                  "h-4 w-4",
                  isBest ? "text-[#2bee6c]" : "text-slate-400"
                )}
              />
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Recommendation
              </span>
            </div>
            {isBest ? (
              <p className="text-sm font-medium text-[#2bee6c]">
                This is the cleanest route!
              </p>
            ) : (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Route {bestIdx + 1} is cleaner
                {bestRoute.lastComputedScore != null &&
                  ` (AQI: ${bestRoute.lastComputedScore})`}
                . Consider switching for better air quality.
              </p>
            )}
          </div>
        )}

        {/* Route Comparison */}
        {route.routes.length > 1 && (
          <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <Route className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase">
                All Routes
              </span>
            </div>
            <div className="space-y-2">
              {route.routes.map((r, i) => {
                const badge = getAqiBadge(r.lastComputedScore);
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2 text-xs",
                      i === subRouteIndex
                        ? "bg-[#2bee6c]/10 font-semibold text-slate-900 dark:text-white"
                        : "text-slate-500"
                    )}
                  >
                    <span>
                      Route {i + 1}
                      {i === bestIdx && r.lastComputedScore != null && " *"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{formatDuration(r.duration)}</span>
                      <span>{formatDistance(r.distance)}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5",
                          badge.color
                        )}
                      >
                        {r.lastComputedScore ?? "--"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Addresses */}
        <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-[#2bee6c] bg-white" />
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  From
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {route.from.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-[#f43f5e]" />
              <div>
                <span className="text-[10px] font-medium text-slate-400 uppercase">
                  To
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {route.to.address}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <Link
          href="/home"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2bee6c] px-5 py-3 text-sm font-bold text-[#102216] shadow-lg shadow-[#2bee6c]/20 transition-all hover:bg-[#2bee6c]/90 active:scale-95"
        >
          <Navigation className="h-4 w-4" />
          Start Route
        </Link>
      </div>
    </div>
  );
}
