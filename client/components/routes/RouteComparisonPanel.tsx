"use client";

import { useEffect, useRef } from "react";

import { AlertTriangle, Ruler, Timer } from "lucide-react";

type TravelMode = "walking" | "driving" | "cycling";

export type RouteData = {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  aqiScore?: number;
  pollutionReductionPct?: number;
  exposureWarning?: string;
};

type RouteComparisonPanelProps = {
  routes: RouteData[];
  isLoading: boolean;
  error: string | null;
  selectedMode: TravelMode;
  selectedRouteIndex: number;
  onRouteSelect: (index: number) => void;
};

export default function RouteComparisonPanel({
  routes,
  isLoading,
  error,
  selectedMode,
  selectedRouteIndex,
  onRouteSelect,
}: RouteComparisonPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset scroll position when routes load
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [routes, isLoading]);
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (meters: number): string => {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  };

  const getRouteLabel = (route: RouteData, allRoutes: RouteData[]) => {
    const maxAqi = Math.max(...allRoutes.map((r) => r.aqiScore || 0));
    const minDuration = Math.min(...allRoutes.map((r) => r.duration));
    if (route.aqiScore === maxAqi && maxAqi > 0) return "Cleanest Path";
    if (route.duration === minDuration) return "Fastest";
    return "Balanced";
  };

  // Shared route card content
  const renderRouteCard = (
    route: RouteData,
    index: number,
    isMobile: boolean
  ) => {
    const isSelected = index === selectedRouteIndex;
    return (
      <div
        key={index}
        onClick={() => onRouteSelect(index)}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 bg-white shadow-xl transition-all dark:bg-slate-800 ${
          isMobile ? "flex-shrink-0 snap-start" : "hover:scale-[1.02]"
        } ${
          isSelected
            ? "border-[#2bee6c] ring-2 ring-[#2bee6c]/20"
            : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
        }`}
        style={isMobile ? { width: "280px", minWidth: "280px" } : undefined}
      >
        {index === 0 && (
          <div className="absolute -top-3 right-0 p-2">
            <span className="rounded-full border border-[#2bee6c]/20 bg-[#2bee6c]/10 px-2 py-1 text-[10px] font-bold tracking-tight text-[#2bee6c] uppercase">
              Best for Health
            </span>
          </div>
        )}
        <div className={isMobile ? "p-4" : "p-5"}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">
                {getRouteLabel(route, routes)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                via{" "}
                {selectedMode === "walking"
                  ? "Pedestrian Paths"
                  : selectedMode === "driving"
                    ? "Main Roads"
                    : "Bike Lanes"}
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-2xl font-black ${
                  (route.aqiScore || 0) >= 80
                    ? "text-[#2bee6c]"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {route.aqiScore ?? "(demo)"}
              </span>
              <span className="block text-[10px] font-bold text-slate-400">
                AQI SCORE
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Timer className="text-slate-400" size={14} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatDuration(route.duration)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="text-slate-400" size={14} />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {formatDistance(route.distance)}
              </span>
            </div>
          </div>
          {route.pollutionReductionPct !== undefined && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Pollution Exposure
              </span>
              <span className="text-xs font-bold text-[#2bee6c]">
                -{route.pollutionReductionPct}% avg.
              </span>
            </div>
          )}
          {route.exposureWarning && (
            <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-500">
              <AlertTriangle size={14} />
              {route.exposureWarning}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Skeleton card
  const renderSkeleton = (i: number, isMobile: boolean) => (
    <div
      key={i}
      className={`animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${
        isMobile ? "flex-shrink-0 snap-start" : ""
      }`}
      style={isMobile ? { width: "280px", minWidth: "280px" } : undefined}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );

  return (
    <>
      {/* ===== MOBILE: Bottom Sheet with Horizontal Scroll ===== */}
      <div className="absolute inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="bg-white/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:bg-slate-900/95">
          {/* Section header */}
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              {isLoading
                ? "Finding routes..."
                : routes.length > 0
                  ? `${routes.length} routes found`
                  : "Routes"}
            </h3>
          </div>

          {/* Horizontal scroll container */}
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3"
            style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
          >
            {isLoading ? (
              [1, 2, 3].map((i) => renderSkeleton(i, true))
            ) : error ? (
              <div className="w-full flex-shrink-0 rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/50 dark:bg-red-900/20">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            ) : routes.length > 0 ? (
              routes.map((route, index) => renderRouteCard(route, index, true))
            ) : null}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP: Original Right Sidebar ===== */}
      <aside className="absolute top-6 right-6 z-40 hidden w-80 flex-col gap-4 lg:flex">
        {isLoading ? (
          [1, 2, 3].map((i) => renderSkeleton(i, false))
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        ) : routes.length > 0 ? (
          routes.map((route, index) => renderRouteCard(route, index, false))
        ) : null}
      </aside>
    </>
  );
}
