"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Bookmark, Tag, X } from "lucide-react";
import { toast } from "sonner";

import InsightToast from "@/components/routes/InsightToast";
import MapControls from "@/components/routes/MapControls";
import RouteComparisonPanel from "@/components/routes/RouteComparisonPanel";
import RouteDiscoveryPanel from "@/components/routes/RouteDiscoveryPanel";
import RouteMapBackground from "@/components/routes/RouteMapBackground";

// Types
type Coordinates = {
  lng: number;
  lat: number;
};

type RouteData = {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
  aqiScore?: number;
  pollutionReductionPct?: number;
  exposureWarning?: string;
};

type TravelMode = "walking" | "driving" | "cycling";

type MapboxRoute = {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][];
    type: string;
  };
};

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

if (!MAPBOX_TOKEN) {
  const warning =
    "BreathClean Dev Warning: MAPBOX_TOKEN is empty. Mapbox API calls will fail.";
  if (process.env.NODE_ENV !== "production") {
    console.warn(warning);
  }
}

const RouteContent = () => {
  const searchParams = useSearchParams();
  const [source, setSource] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [sourceAddress, setSourceAddress] = useState<string>("");
  const [destAddress, setDestAddress] = useState<string>("");
  const [selectedMode, setSelectedMode] = useState<TravelMode>("driving");
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [routeName, setRouteName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Parse query parameters
  useEffect(() => {
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    if (fromParam && toParam) {
      const [fromLng, fromLat] = fromParam.split(",").map(Number);
      const [toLng, toLat] = toParam.split(",").map(Number);

      if (
        !isNaN(fromLng) &&
        !isNaN(fromLat) &&
        !isNaN(toLng) &&
        !isNaN(toLat)
      ) {
        setSource({ lng: fromLng, lat: fromLat });
        setDestination({ lng: toLng, lat: toLat });

        // Fetch addresses for source and destination
        reverseGeocode(fromLng, fromLat).then(setSourceAddress);
        reverseGeocode(toLng, toLat).then(setDestAddress);
      }
    }
  }, [searchParams]);

  // Reverse geocode to get address from coordinates
  const reverseGeocode = async (lng: number, lat: number): Promise<string> => {
    if (!MAPBOX_TOKEN) {
      console.error("Aborting reverseGeocode: MAPBOX_TOKEN is missing.");
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Geocoding HTTP error: ${response.status} ${response.statusText} | Body: ${errorBody}`
        );
      }

      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].place_name;
      }
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      // Only swallow network/runtime errors so we return coordinates as fallback
      // ideally we might want to surface this, but the UI expects a string
      console.error("Geocoding failed:", error);
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Fetch routes from Mapbox Directions API
  const fetchRoutes = useCallback(
    async (mode: TravelMode) => {
      if (!source || !destination) return;
      if (!MAPBOX_TOKEN) {
        setError("Mapbox configuration error: Missing Token");
        console.error("Aborting fetchRoutes: MAPBOX_TOKEN is missing.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const profile = `mapbox/${mode}`;
        const coordinates = `${source.lng},${source.lat};${destination.lng},${destination.lat}`;

        // Request multiple alternative routes
        const url = `https://api.mapbox.com/directions/v5/${profile}/${coordinates}?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `FetchRoutes HTTP error: ${response.status} ${response.statusText}`,
            errorText
          );
          setError(
            `Route fetch failed: ${response.status} ${response.statusText}`
          );
          setRoutes([]);
          return;
        }

        const data = await response.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          // Take up to 3 routes
          const fetchedRoutes = data.routes
            .slice(0, 3)
            .map((route: MapboxRoute, index: number) => {
              // Placeholder/Demo data logic
              let aqiScore = 80;
              let pollutionReductionPct: number | undefined = undefined;
              let exposureWarning: string | undefined = undefined;

              if (index === 0) {
                aqiScore = 92;
                pollutionReductionPct = 34;
              } else if (index === 1) {
                aqiScore = 74;
              } else {
                aqiScore = 42;
                exposureWarning = "High PM2.5 Exposure Zone";
              }

              return {
                distance: route.distance,
                duration: route.duration,
                geometry: route.geometry,
                aqiScore,
                pollutionReductionPct,
                exposureWarning,
              };
            });
          setRoutes(fetchedRoutes);
        } else {
          setError("No routes found. Please try different locations.");
          setRoutes([]);
        }
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError("Failed to fetch routes. Please try again.");
        setRoutes([]);
      } finally {
        setIsLoading(false);
      }
    },
    [source, destination]
  );

  // Fetch routes when source, destination, or mode changes
  useEffect(() => {
    if (source && destination) {
      fetchRoutes(selectedMode);
    }
  }, [source, destination, selectedMode, fetchRoutes]);

  // Handle mode toggle
  const handleModeChange = (mode: TravelMode) => {
    setSelectedMode(mode);
    setSelectedRouteIndex(0); // Reset to first route when mode changes
  };

  // Handle route selection
  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
  };

  // Open save modal
  const handleSaveClick = () => {
    setShowSaveModal(true);
    // Focus input after modal renders
    setTimeout(() => saveInputRef.current?.focus(), 100);
  };

  // Save route function
  const saveRoute = async () => {
    if (!source || !destination || routes.length === 0) return;
    if (!routeName.trim()) {
      toast.error("Please enter a route name.");
      return;
    }

    const nameToSave = routeName.trim();

    try {
      const payload = {
        name: nameToSave,
        from: {
          address: sourceAddress,
          location: {
            type: "Point",
            coordinates: [source.lng, source.lat],
          },
        },
        to: {
          address: destAddress,
          location: {
            type: "Point",
            coordinates: [destination.lng, destination.lat],
          },
        },
        routes: routes.map((route) => ({
          distance: route.distance / 1000,
          duration: route.duration / 60,
          routeGeometry: route.geometry,
          lastComputedScore: route.aqiScore || Math.floor(Math.random() * 100),
          lastComputedAt: new Date(),
          travelMode: selectedMode,
        })),
        isFavorite: false,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/saved-routes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Save route response:", data);

      if (!response.ok) {
        console.error("Save route failed:", data);
        toast.error(data.message || "Failed to save route");
        return;
      }

      toast.success("Route saved successfully!");
      setShowSaveModal(false);
      setRouteName("");
    } catch (error) {
      console.error("Save route error:", error);
      toast.error("An error occurred while saving the route");
    }
  };

  return (
    <div className="font-display flex h-screen flex-col overflow-hidden bg-[#f6f8f6] text-slate-900 md:pt-12 dark:bg-[#102216]">
      <main className="relative flex-1 overflow-hidden">
        <RouteMapBackground
          source={source}
          destination={destination}
          routes={routes}
          selectedRouteIndex={selectedRouteIndex}
        />
        <RouteDiscoveryPanel
          sourceAddress={sourceAddress}
          destAddress={destAddress}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          onSaveRoute={handleSaveClick}
          canSave={!isLoading && !error && routes.length > 0}
        />
        <RouteComparisonPanel
          routes={routes}
          isLoading={isLoading}
          error={error}
          selectedMode={selectedMode}
          selectedRouteIndex={selectedRouteIndex}
          onRouteSelect={handleRouteSelect}
        />
        <InsightToast />
        <MapControls />

        {/* Save Route Modal */}
        {showSaveModal && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  Save Route
                </h2>
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              <label className="mb-1.5 block text-xs font-bold tracking-wider text-slate-400 uppercase">
                Route Name <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 p-3 transition-all focus-within:border-[#2bee6c] focus-within:ring-2 focus-within:ring-[#2bee6c]/20 dark:border-slate-700 dark:bg-slate-800">
                <Tag className="text-[#2bee6c]" size={18} />
                <input
                  ref={saveInputRef}
                  className="w-full border-none bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-none dark:text-white"
                  placeholder="e.g. Morning Commute"
                  type="text"
                  value={routeName}
                  onChange={(e) => setRouteName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && routeName.trim()) saveRoute();
                  }}
                />
              </div>
              {!routeName.trim() && (
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Give your route a name to save it.
                </p>
              )}

              <button
                onClick={saveRoute}
                disabled={!routeName.trim()}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold shadow-lg transition-all ${
                  routeName.trim()
                    ? "bg-[#2bee6c] text-slate-900 shadow-[#2bee6c]/20 hover:bg-[#2bee6c]/90"
                    : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                }`}
              >
                <Bookmark className="h-5 w-5" />
                Save Route
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default function RoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f6f8f6] dark:bg-[#102216]">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2bee6c] border-t-transparent" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading route parameters...
            </p>
          </div>
        </div>
      }
    >
      <RouteContent />
    </Suspense>
  );
}
