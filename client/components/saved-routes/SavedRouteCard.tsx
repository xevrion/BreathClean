"use client";

import { Clock, MapPin, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { ISavedRoute } from "./types";

interface SavedRouteCardProps {
  route: ISavedRoute;
  isSelected: boolean;
  selectedSubRouteIndex: number;
  onSelect: (routeId: string) => void;
  onSubRouteSelect: (index: number) => void;
}

function getAqiColor(score: number | null | undefined) {
  if (score == null) return "bg-slate-200 text-slate-600";
  if (score <= 50) return "bg-emerald-100 text-emerald-700";
  if (score <= 100) return "bg-yellow-100 text-yellow-700";
  if (score <= 150) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
}

function getAqiLabel(score: number | null | undefined) {
  if (score == null) return "N/A";
  if (score <= 50) return "Good";
  if (score <= 100) return "Fair";
  if (score <= 150) return "Poor";
  return "Bad";
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

export default function SavedRouteCard({
  route,
  isSelected,
  selectedSubRouteIndex,
  onSelect,
  onSubRouteSelect,
}: SavedRouteCardProps) {
  const bestIdx = route.routes.reduce(
    (best, r, i) => {
      const score = r.lastComputedScore ?? Infinity;
      return score < best.score ? { score, idx: i } : best;
    },
    { score: Infinity, idx: 0 }
  ).idx;

  return (
    <div
      className={cn(
        "cursor-pointer rounded-xl border p-4 transition-all",
        isSelected
          ? "border-[#2bee6c] bg-[#2bee6c]/5 shadow-md"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
      )}
      onClick={() => onSelect(route._id)}
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {route.name || "Saved Route"}
            </h3>
            {route.isFavorite && (
              <Star className="h-3.5 w-3.5 flex-shrink-0 fill-yellow-400 text-yellow-400" />
            )}
          </div>
        </div>
        <span className="ml-2 flex-shrink-0 text-[10px] text-slate-400">
          {route.routes.length} route{route.routes.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="mb-3 space-y-1.5">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-[#2bee6c] bg-white" />
          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
            {route.from.address}
          </p>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-[#2bee6c]" />
          <p className="truncate text-xs text-slate-600 dark:text-slate-400">
            {route.to.address}
          </p>
        </div>
      </div>

      {isSelected && route.routes.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {route.routes.map((subRoute, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onSubRouteSelect(i);
              }}
              className={cn(
                "relative rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                selectedSubRouteIndex === i
                  ? "bg-[#2bee6c] text-[#102216]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              )}
            >
              Route {i + 1}
              {i === bestIdx &&
                route.routes.some((r) => r.lastComputedScore != null) && (
                  <span className="ml-1 text-[9px] opacity-75">Cleanest</span>
                )}
            </button>
          ))}
        </div>
      )}

      {isSelected && (
        <div className="flex items-center gap-3 border-t border-slate-100 pt-2.5 dark:border-slate-700">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="h-3 w-3" />
            {formatDuration(route.routes[selectedSubRouteIndex].duration)}
          </div>
          <div className="text-xs text-slate-500">
            {formatDistance(route.routes[selectedSubRouteIndex].distance)}
          </div>
          <div
            className={cn(
              "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
              getAqiColor(route.routes[selectedSubRouteIndex].lastComputedScore)
            )}
          >
            AQI:{" "}
            {route.routes[selectedSubRouteIndex].lastComputedScore ?? "N/A"} (
            {getAqiLabel(route.routes[selectedSubRouteIndex].lastComputedScore)}
            )
          </div>
        </div>
      )}
    </div>
  );
}
