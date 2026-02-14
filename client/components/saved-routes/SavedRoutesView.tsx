"use client";

import { useState } from "react";

import EmptyState from "./EmptyState";
import RouteInsightsPanel from "./RouteInsightsPanel";
import RouteMap from "./RouteMap";
import SavedRoutesList from "./SavedRoutesList";
import type { ISavedRoute } from "./types";

interface SavedRoutesViewProps {
  routes: ISavedRoute[];
}

export default function SavedRoutesView({ routes }: SavedRoutesViewProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(
    routes.length > 0 ? routes[0]._id : null
  );
  const [selectedSubRouteIndex, setSelectedSubRouteIndex] = useState(0);

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedSubRouteIndex(0);
  };

  const selectedRoute = routes.find((r) => r._id === selectedRouteId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8f6] dark:bg-[#102216]">
      <div className="flex flex-1 pt-14">
        {routes.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Left sidebar - route list */}
            <SavedRoutesList
              routes={routes}
              selectedRouteId={selectedRouteId}
              selectedSubRouteIndex={selectedSubRouteIndex}
              onSelectRoute={handleSelectRoute}
              onSelectSubRoute={setSelectedSubRouteIndex}
            />

            {/* Center - map */}
            <div className="hidden flex-1 lg:block">
              <RouteMap
                routes={routes}
                selectedRouteId={selectedRouteId}
                selectedSubRouteIndex={selectedSubRouteIndex}
              />
            </div>

            {/* Right panel - insights */}
            {selectedRoute && (
              <div className="hidden xl:block">
                <RouteInsightsPanel
                  route={selectedRoute}
                  subRouteIndex={selectedSubRouteIndex}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
