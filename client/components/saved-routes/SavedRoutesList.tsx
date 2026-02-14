"use client";

import { Bookmark } from "lucide-react";

import SavedRouteCard from "./SavedRouteCard";
import type { ISavedRoute } from "./types";

interface SavedRoutesListProps {
  routes: ISavedRoute[];
  selectedRouteId: string | null;
  selectedSubRouteIndex: number;
  onSelectRoute: (routeId: string) => void;
  onSelectSubRoute: (index: number) => void;
}

export default function SavedRoutesList({
  routes,
  selectedRouteId,
  selectedSubRouteIndex,
  onSelectRoute,
  onSelectSubRoute,
}: SavedRoutesListProps) {
  return (
    <div className="flex h-full w-full flex-col border-r border-slate-200 bg-white lg:w-[400px] dark:border-slate-700 dark:bg-[#102216]">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <Bookmark className="h-5 w-5 text-[#2bee6c]" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Saved Routes
        </h2>
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {routes.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {routes.map((route) => (
          <SavedRouteCard
            key={route._id}
            route={route}
            isSelected={selectedRouteId === route._id}
            selectedSubRouteIndex={
              selectedRouteId === route._id ? selectedSubRouteIndex : 0
            }
            onSelect={onSelectRoute}
            onSubRouteSelect={onSelectSubRoute}
          />
        ))}
      </div>
    </div>
  );
}
