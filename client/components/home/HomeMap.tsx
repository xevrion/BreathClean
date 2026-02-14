"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowRight,
  Crosshair,
  Info,
  LocateFixed,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type HomeMapProps = {
  className?: string;
};

type LocationData = {
  lng: number;
  lat: number;
  address: string;
};

export default function HomeMap({ className }: HomeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [showRightModal, setShowRightModal] = useState(true);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersRef = useRef<{
    source: mapboxgl.Marker | null;
    dest: mapboxgl.Marker | null;
  }>({ source: null, dest: null });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Loading States
  const [mapStatus, setMapStatus] = useState<
    "loading" | "ready" | "error" | "no-token"
  >(mapboxToken ? "loading" : "no-token");
  const [isLocating, setIsLocating] = useState(!!mapboxToken);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Selection States
  const [sourceLocation, setSourceLocation] = useState<LocationData | null>(
    null
  );
  const [destLocation, setDestLocation] = useState<LocationData | null>(null);
  const [pickingMode, setPickingMode] = useState<"source" | "dest" | null>(
    null
  );
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState<
    "source" | "dest" | null
  >(null);

  const mapStatusLabel = useMemo(() => {
    if (mapStatus === "no-token") return "Mapbox token missing";
    if (mapStatus === "error") return mapError || "Map failed to load";
    if (mapStatus === "loading") return "Loading map...";
    return "";
  }, [mapStatus, mapError]);

  // Helper to reverse geocode
  const reverseGeocode = useCallback(
    async (lng: number, lat: number): Promise<string> => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          return data.features[0].place_name; // Full address
        }
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback
      } catch (error) {
        console.error("Geocoding failed:", error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },
    [mapboxToken]
  );

  // Helper to update markers
  const updateMarker = (type: "source" | "dest", lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing marker if any
    if (markersRef.current[type]) {
      markersRef.current[type]?.remove();
    }

    // Create new marker
    const color = type === "source" ? "#2bee6c" : "#f43f5e"; // Green for source, Red for dest
    const marker = new mapboxgl.Marker({ color })
      .setLngLat([lng, lat])
      .addTo(map);

    markersRef.current[type] = marker;
  };

  // Helper: Use Current Location for specific input
  const handleNavigationClick = (type: "source" | "dest") => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported in this browser.");
      return;
    }

    setIsGettingCurrentLocation(type);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { longitude, latitude } = position.coords;
        const address = await reverseGeocode(longitude, latitude);

        if (type === "source") {
          setSourceLocation({ lng: longitude, lat: latitude, address });
          updateMarker("source", longitude, latitude);
        } else {
          setDestLocation({ lng: longitude, lat: latitude, address });
          updateMarker("dest", longitude, latitude);
        }

        // Fly to updated location
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
        });

        setIsGettingCurrentLocation(null);
        setGeoError(null);
      },
      (error) => {
        setGeoError(error.message || "Location permission denied.");
        setIsGettingCurrentLocation(null);
      },
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    if (mapRef.current) return;

    if (!mapboxToken) {
      // Status is already set to 'no-token' by initial state
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    let isCancelled = false;
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 0],
      zoom: 2,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    const handleMapLoad = () => setMapStatus("ready");
    const handleMapError = () => {
      setMapStatus("error");
      setMapError("Map failed to load. Check your token or network.");
      setIsLocating(false);
    };

    map.on("load", handleMapLoad);
    map.on("error", handleMapError);

    const hideRightModal = () => {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      setShowRightModal(false);
    };
    const scheduleShowRightModal = () => {
      // Only show if NOT picking
      // We'll handle this in the picking logic
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => {
        setShowRightModal(true);
      }, 1000);
    };

    map.on("movestart", hideRightModal);
    map.on("moveend", scheduleShowRightModal);

    // Initial Geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (isCancelled) return;
          const { longitude, latitude } = position.coords;

          // Fetch address for current location
          const address = await reverseGeocode(longitude, latitude);
          if (isCancelled) return;

          setSourceLocation({ lng: longitude, lat: latitude, address });
          updateMarker("source", longitude, latitude);

          map.once("moveend", () => {
            if (!isCancelled) setIsLocating(false);
          });

          map.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            essential: true,
          });
        },
        (error) => {
          if (isCancelled) return;
          setGeoError(error.message || "Location permission was denied.");
          setIsLocating(false);
          map.flyTo({ center: [0, 0], zoom: 2 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setTimeout(() => {
        if (isCancelled) return;
        setGeoError("Geolocation is not supported in this browser.");
        setIsLocating(false);
      }, 0);
    }

    const resize = () => map.resize();
    window.addEventListener("resize", resize);

    return () => {
      isCancelled = true;
      map.off("movestart", hideRightModal);
      map.off("moveend", scheduleShowRightModal);
      map.off("load", handleMapLoad);
      map.off("error", handleMapError);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);

      // Safe Cleanup
      const markers = markersRef.current;
      if (markers.source) markers.source.remove();
      if (markers.dest) markers.dest.remove();

      window.removeEventListener("resize", resize);
      map.remove();
      mapRef.current = null;
    };
  }, [mapboxToken, reverseGeocode]);

  // Effect to handle Map Clicks based on pickingMode
  // We attach this separately so it can access the latest 'pickingMode' state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMapClick = async (e: mapboxgl.MapMouseEvent) => {
      if (!pickingMode) return;

      const { lng, lat } = e.lngLat;
      const address = await reverseGeocode(lng, lat);

      if (pickingMode === "source") {
        setSourceLocation({ lng, lat, address });
        updateMarker("source", lng, lat);
      } else {
        setDestLocation({ lng, lat, address });
        updateMarker("dest", lng, lat);
      }

      setPickingMode(null); // Exit picking mode
    };

    map.on("click", onMapClick);

    // Change cursor style
    if (pickingMode) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    return () => {
      map.off("click", onMapClick);
      map.getCanvas().style.cursor = "";
    };
  }, [pickingMode, reverseGeocode]);

  const shouldShowLoader =
    (mapStatus === "loading" || isLocating) &&
    mapStatus !== "error" &&
    mapStatus !== "no-token";

  return (
    <div
      className={`font-display relative min-h-screen overflow-hidden bg-[#f6f8f6] text-slate-800 dark:bg-[#102216] dark:text-slate-100 ${
        className || ""
      }`}
    >
      {/* Map Background */}
      <div className="fixed inset-0 z-0">
        <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 bg-[#f6f8f6]/5" />

        {/* Picking Mode Overlay Banner */}
        {pickingMode && (
          <div className="pointer-events-none absolute top-20 left-1/2 z-40 -translate-x-1/2">
            <div className="animate-in fade-in slide-in-from-top-4 rounded-full bg-slate-900/90 px-6 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md">
              Click on the map to choose{" "}
              {pickingMode === "source" ? "Start Point" : "Destination"}
            </div>
          </div>
        )}

        {/* Subtle Air Quality Blobs */}
        <div className="pointer-events-none absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-[#2bee6c]/10 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 bottom-1/4 h-96 w-96 rounded-full bg-[#2bee6c]/5 blur-[100px]" />

        {/* Full Screen Loading Overlay */}
        {shouldShowLoader && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#f6f8f6]/80 backdrop-blur-md transition-all duration-500 dark:bg-[#102216]/80">
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="h-20 w-20 animate-ping rounded-full bg-[#2bee6c]/30"></div>
                <div className="absolute h-10 w-10 animate-pulse rounded-full bg-[#2bee6c] shadow-[0_0_40px_rgba(43,238,108,0.6)]"></div>
                <MapPin className="absolute z-10 h-5 w-5 animate-bounce fill-[#102216] text-[#102216]" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {mapStatus === "loading"
                    ? "Initializing Map"
                    : "Locating You"}
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Finding the cleanest air near you...
                </p>
              </div>
            </div>
          </div>
        )}

        {mapStatus !== "ready" && !shouldShowLoader && (
          <div className="pointer-events-none absolute top-4 left-4 z-30">
            <div
              className={`rounded-lg border px-3 py-2 text-xs shadow-sm backdrop-blur-sm ${
                mapStatus === "error" || mapStatus === "no-token"
                  ? "border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400"
                  : "border-slate-200/60 bg-white/80 text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300"
              }`}
            >
              {mapStatusLabel}
            </div>
          </div>
        )}

        {/* Floating Overlays */}
        <main
          className={`pointer-events-none absolute inset-0 z-20 flex h-full w-full flex-col items-start gap-6 px-4 pt-12 transition-opacity duration-700 md:px-8 md:pt-3 lg:flex-row lg:justify-between lg:px-4 ${shouldShowLoader ? "opacity-0" : "opacity-100"}`}
        >
          {/* Left Section: Search Card */}
          <div className="pointer-events-auto mt-1 w-full lg:mt-3 lg:max-w-xs xl:max-w-sm">
            <div className="rounded-xl border border-[#2bee6c]/10 bg-white p-6 shadow-2xl shadow-[#2bee6c]/5 dark:bg-slate-900/90">
              <h2 className="mb-1 text-lg font-bold">
                Start your healthy journey
              </h2>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                Enter your route to find the cleanest path.
              </p>

              <div className="relative space-y-4">
                {" "}
                {/* Increased spacing for buttons */}
                <div className="absolute top-2 bottom-6 left-5 w-0.5 bg-slate-100 dark:bg-slate-800" />
                {/* Source Input Group */}
                <div className="relative space-y-1">
                  <div className="group relative">
                    <div className="absolute top-1/2 left-3.5 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-[#2bee6c] bg-white" />
                    <input
                      className="w-full rounded-lg border-transparent bg-slate-50 py-3 pr-3 pl-10 text-sm transition-all outline-none placeholder:text-slate-400 focus:border-[#2bee6c] focus:ring-0 dark:bg-slate-800/50"
                      placeholder="Current location..."
                      type="text"
                      value={sourceLocation?.address || ""}
                      readOnly // Let's make it read-only for now if we rely on map picking/geo
                    />
                    {/* Navigation/Current Location Button */}
                    <button
                      onClick={() => handleNavigationClick("source")}
                      disabled={isGettingCurrentLocation === "source"}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2bee6c] dark:hover:bg-slate-700"
                      title="Use Current Location"
                    >
                      <LocateFixed
                        className={`h-4 w-4 ${isGettingCurrentLocation === "source" ? "animate-spin text-[#2bee6c]" : ""}`}
                      />
                    </button>
                  </div>
                  {/* Choose on Map Button for Source */}
                  <button
                    onClick={() => setPickingMode("source")}
                    className="ml-10 flex items-center gap-1 text-[10px] font-medium text-[#2bee6c] hover:text-[#2bee6c]/80 hover:underline disabled:opacity-50"
                    disabled={!!pickingMode}
                  >
                    <Crosshair className="h-3 w-3" />
                    Choose Starting Point on Map
                  </button>
                </div>
                {/* Destination Input Group */}
                <div className="relative space-y-1">
                  <div className="group relative">
                    <div className="absolute top-1/2 left-3.5 z-10 flex -translate-y-1/2 items-center justify-center">
                      <MapPin className="h-4 w-4 text-[#2bee6c]" />
                    </div>
                    <input
                      className="w-full rounded-lg border-transparent bg-slate-50 py-3 pr-3 pl-10 text-sm transition-all outline-none placeholder:text-slate-400 focus:border-[#2bee6c] focus:ring-0 dark:bg-slate-800/50"
                      placeholder="Search destination..."
                      type="text"
                      value={destLocation?.address || ""}
                      readOnly
                    />
                    {/* Navigation/Current Location Button for Dest */}
                    <button
                      onClick={() => handleNavigationClick("dest")}
                      disabled={isGettingCurrentLocation === "dest"}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2bee6c] dark:hover:bg-slate-700"
                      title="Use Current Location"
                    >
                      <LocateFixed
                        className={`h-4 w-4 ${isGettingCurrentLocation === "dest" ? "animate-spin text-[#2bee6c]" : ""}`}
                      />
                    </button>
                  </div>
                  {/* Choose on Map Button for Destination */}
                  <button
                    onClick={() => setPickingMode("dest")}
                    className="ml-10 flex items-center gap-1 text-[10px] font-medium text-[#2bee6c] hover:text-[#2bee6c]/80 hover:underline disabled:opacity-50"
                    disabled={!!pickingMode}
                  >
                    <Crosshair className="h-3 w-3" />
                    Choose Destination on Map
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <button
                  disabled={!sourceLocation || !destLocation}
                  className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2bee6c] px-5 py-3 text-sm font-bold text-[#102216] shadow-lg shadow-[#2bee6c]/20 transition-all hover:bg-[#2bee6c]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Find Cleanest Route</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {geoError && (
                <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  {geoError}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#2bee6c]" />
                    <span className="mt-0.5 text-[9px] text-slate-400">
                      Clean
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="mt-0.5 text-[9px] text-slate-400">
                      Fair
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                    <span className="mt-0.5 text-[9px] text-slate-400">
                      Poor
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  Live Air Quality Data
                </span>
              </div>
            </div>
          </div>

          {/* Right Section: Onboarding */}
          <div
            className={`pointer-events-auto mt-1 hidden w-full max-w-md transition-opacity duration-300 lg:mt-3 lg:block xl:max-w-xl ${
              showRightModal ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="rounded-2xl border border-white/60 bg-white/50 p-8 shadow-xl shadow-[#2bee6c]/5 backdrop-blur-xl xl:p-10 dark:border-slate-700/50 dark:bg-slate-900/50">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-lg bg-[#2bee6c]/10 p-2">
                  <Info className="h-5 w-5 text-[#2bee6c]" />
                </div>
                <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">
                  How it works
                </h3>
              </div>
              <div className="space-y-7">
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#2bee6c]/20 bg-white text-xl font-bold text-[#2bee6c] shadow-md dark:bg-slate-800">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold">
                      Enter Destination
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      Tell us where you&apos;re headed. We&apos;ll scan
                      thousands of real-time air quality sensors along every
                      possible route.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#2bee6c]/20 bg-white text-xl font-bold text-[#2bee6c] shadow-md dark:bg-slate-800">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold">
                      Compare Air Quality
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      We analyze PM2.5 and Ozone levels across routes to
                      identify and avoid pollution hotspots in real time.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#2bee6c]/20 bg-white text-xl font-bold text-[#2bee6c] shadow-md dark:bg-slate-800">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 text-lg font-bold">Breathe Easy</h4>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      Follow the greenest path for your lungs. Studies show you
                      can reduce pollution exposure by up to 40%.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-9 flex items-center gap-4 rounded-xl border border-[#2bee6c]/10 bg-[#2bee6c]/5 p-5">
                <div className="rounded-full bg-[#2bee6c]/20 p-2.5">
                  <ShieldCheck className="h-6 w-6 text-[#2bee6c]" />
                </div>
                <p className="text-sm leading-snug text-slate-600 dark:text-slate-300">
                  Join{" "}
                  <span className="font-semibold text-slate-800 dark:text-white">
                    50,000+
                  </span>{" "}
                  commuters prioritizing their respiratory health today.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
