"use client";

import {
  type TouchEvent as ReactTouchEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Crosshair,
  Info,
  LocateFixed,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import type { Map, MapMouseEvent, Marker } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  { ssr: false }
);

type HomeMapProps = {
  className?: string;
};

type LocationData = {
  lng: number;
  lat: number;
  address: string;
};

export default function HomeMap({ className }: HomeMapProps) {
  const router = useRouter();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxglRef = useRef<any>(null);
  const [showRightModal, setShowRightModal] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markersRef = useRef<{
    source: Marker | null;
    dest: Marker | null;
  }>({ source: null, dest: null });

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Loading States
  const [mapStatus, setMapStatus] = useState<
    "loading" | "ready" | "error" | "no-token"
  >(mapboxToken ? "loading" : "no-token");
  const [isLocating, setIsLocating] = useState(!!mapboxToken);
  const [mapError, setMapError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

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

  // Search Box Queries
  const [sourceQuery, setSourceQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");

  // Mobile Bottom Sheet State
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef(0);
  const touchCurrentY = useRef(0);
  const isDragging = useRef(false);
  const sheetContentRef = useRef<HTMLDivElement | null>(null);

  const handleSheetTouchStart = (e: ReactTouchEvent) => {
    // Only start drag from the handle area, not when scrolling content
    const scrollableContent = sheetContentRef.current;
    if (scrollableContent && scrollableContent.scrollTop > 0 && sheetExpanded) {
      // If content is scrolled down and sheet is expanded, let normal scroll happen
      return;
    }
    touchStartY.current = e.touches[0].clientY;
    touchCurrentY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleSheetTouchMove = (e: ReactTouchEvent) => {
    if (!isDragging.current) return;
    touchCurrentY.current = e.touches[0].clientY;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Only allow dragging down when expanded, or up when collapsed
    if (sheetExpanded && deltaY > 0) {
      // Dragging down to collapse
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${deltaY}px)`;
    } else if (!sheetExpanded && deltaY < 0) {
      // Dragging up to expand
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${Math.max(deltaY, -window.innerHeight * 0.6)}px)`;
    }
  };

  const handleSheetTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = touchCurrentY.current - touchStartY.current;
    const sheet = sheetRef.current;
    if (!sheet) return;

    sheet.style.transition = "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)";
    sheet.style.transform = "";

    const threshold = 80;

    if (sheetExpanded && deltaY > threshold) {
      setSheetExpanded(false);
    } else if (!sheetExpanded && deltaY < -threshold) {
      setSheetExpanded(true);
    }
  };

  // Map padding offset — push center point upward so marker shows above the bottom sheet
  const getMobileMapPadding = useCallback(() => {
    if (typeof window === "undefined")
      return { top: 0, bottom: 300, left: 0, right: 0 };
    return {
      top: 0,
      bottom: sheetExpanded ? Math.round(window.innerHeight * 0.45) : 80,
      left: 0,
      right: 0,
    };
  }, [sheetExpanded]);

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
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl) return;

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

  const handleFindRoute = () => {
    setRouteError(null);
    if (!sourceLocation) {
      setRouteError("Please select a starting location.");
      return;
    }
    if (!destLocation) {
      setRouteError("Please select a destination.");
      return;
    }

    if (
      sourceLocation.lng === destLocation.lng &&
      sourceLocation.lat === destLocation.lat
    ) {
      setRouteError("Start and destination cannot be the same.");
      return;
    }

    const from = `${sourceLocation.lng},${sourceLocation.lat}`;
    const to = `${destLocation.lng},${destLocation.lat}`;

    router.push(`/home/routes?from=${from}&to=${to}`);
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
          setSourceQuery(address);
          updateMarker("source", longitude, latitude);
        } else {
          setDestLocation({ lng: longitude, lat: latitude, address });
          setDestQuery(address);
          updateMarker("dest", longitude, latitude);
        }

        // Fly to updated location with mobile offset
        const isMobile = window.innerWidth < 1024;
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          essential: true,
          padding: isMobile
            ? {
                top: 0,
                bottom: Math.round(window.innerHeight * 0.45),
                left: 0,
                right: 0,
              }
            : undefined,
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

    let isCancelled = false;
    const cleanupRef = { current: () => {} };

    const initMap = async () => {
      try {
        const mapboxglModule = await import("mapbox-gl");
        const mapboxgl = mapboxglModule.default;
        mapboxglRef.current = mapboxgl;

        mapboxgl.accessToken = mapboxToken;

        if (isCancelled) return;

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

        const handleMapLoad = () => {
          if (!isCancelled) setMapStatus("ready");
        };

        const handleMapError = () => {
          if (!isCancelled) {
            setMapStatus("error");
            setMapError("Map failed to load. Check your token or network.");
            setIsLocating(false);
          }
        };

        map.on("load", handleMapLoad);
        map.on("error", handleMapError);

        const hideControls = () => {
          if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
          setShowRightModal(false);
          setShowControls(false);
        };
        const scheduleShowControls = () => {
          if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
          revealTimeoutRef.current = setTimeout(() => {
            setShowRightModal(true);
            setShowControls(true);
          }, 800);
        };

        map.on("movestart", hideControls);
        map.on("moveend", scheduleShowControls);

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
              setSourceQuery(address);
              updateMarker("source", longitude, latitude);

              map.once("moveend", () => {
                if (!isCancelled) setIsLocating(false);
              });

              // Use padding to offset center upward on mobile so marker
              // sits above the bottom sheet (roughly upper-third of screen)
              const isMobile = window.innerWidth < 1024;
              map.flyTo({
                center: [longitude, latitude],
                zoom: 13,
                essential: true,
                padding: isMobile
                  ? {
                      top: 0,
                      bottom: Math.round(window.innerHeight * 0.45),
                      left: 0,
                      right: 0,
                    }
                  : undefined,
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

        cleanupRef.current = () => {
          window.removeEventListener("resize", resize);
          map.off("movestart", hideControls);
          map.off("moveend", scheduleShowControls);
          map.off("load", handleMapLoad);
          map.off("error", handleMapError);
          map.remove();
        };
      } catch (err) {
        console.error("Error loading mapbox-gl:", err);
        if (!isCancelled) {
          setMapStatus("error");
          setMapError("Failed to load map library.");
        }
      }
    };

    initMap();

    const markersInstance = markersRef.current; // Capture ref value

    return () => {
      isCancelled = true;
      cleanupRef.current();

      // Safe Cleanup
      if (markersInstance.source) markersInstance.source.remove();
      if (markersInstance.dest) markersInstance.dest.remove();

      mapRef.current = null;
    };
  }, [mapboxToken, reverseGeocode]);

  // Effect to handle Map Clicks based on pickingMode
  // We attach this separately so it can access the latest 'pickingMode' state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMapClick = async (e: MapMouseEvent) => {
      if (!pickingMode) return;

      const { lng, lat } = e.lngLat;
      const address = await reverseGeocode(lng, lat);

      if (pickingMode === "source") {
        setSourceLocation({ lng, lat, address });
        setSourceQuery(address);
        updateMarker("source", lng, lat);
      } else {
        setDestLocation({ lng, lat, address });
        setDestQuery(address);
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
      try {
        map.getCanvas().style.cursor = "";
      } catch {
        // Canvas may already be removed during cleanup
      }
    };
  }, [pickingMode, reverseGeocode]);

  const shouldShowLoader =
    (mapStatus === "loading" || isLocating) &&
    mapStatus !== "error" &&
    mapStatus !== "no-token";

  // Shared search input renderer to avoid duplication
  const renderSearchInputs = () => (
    <div className="relative space-y-4">
      <div className="absolute top-2 bottom-6 left-5 w-0.5 bg-slate-100 dark:bg-slate-800" />
      {/* Source Input Group */}
      <div className="relative space-y-1">
        <div className="group relative">
          <div className="absolute top-1/2 left-3.5 z-10 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-[#2bee6c] bg-white" />
          <SearchBox
            accessToken={mapboxToken}
            value={sourceQuery}
            onChange={(val: string) => setSourceQuery(val)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onRetrieve={(res: any) => {
              if (
                !res ||
                !Array.isArray(res.features) ||
                res.features.length === 0
              ) {
                return;
              }
              const feature = res.features[0];
              const [lng, lat] = feature.geometry.coordinates;
              const address =
                feature.properties?.place_name ||
                feature.properties?.full_address ||
                feature.place_name ||
                sourceQuery;
              setSourceLocation({ lng, lat, address });
              setSourceQuery(address);
              updateMarker("source", lng, lat);
              mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
            }}
            placeholder="Start location..."
            options={{ language: "en", limit: 5 }}
            theme={{
              variables: {
                fontFamily: "inherit",
                padding: "12px 48px 12px 42px",
                borderRadius: "8px",
                boxShadow: "none",
              },
              icons: {
                search: '<svg viewBox="0 0 1 1"></svg>',
              },
            }}
          />
          <button
            onClick={() => handleNavigationClick("source")}
            disabled={isGettingCurrentLocation === "source"}
            className={`absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2bee6c] dark:hover:bg-slate-700 ${sourceQuery ? "hidden" : ""}`}
            title="Use Current Location"
          >
            <LocateFixed
              className={`h-4 w-4 ${isGettingCurrentLocation === "source" ? "animate-spin text-[#2bee6c]" : ""}`}
            />
          </button>
        </div>
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
          <SearchBox
            accessToken={mapboxToken}
            value={destQuery}
            onChange={(val: string) => setDestQuery(val)}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onRetrieve={(res: any) => {
              if (
                !res ||
                !Array.isArray(res.features) ||
                res.features.length === 0
              ) {
                return;
              }
              const feature = res.features[0];
              const [lng, lat] = feature.geometry.coordinates;
              const address =
                feature.properties?.place_name ||
                feature.properties?.full_address ||
                feature.place_name ||
                destQuery;
              setDestLocation({ lng, lat, address });
              setDestQuery(address);
              updateMarker("dest", lng, lat);
              mapRef.current?.flyTo({ center: [lng, lat], zoom: 14 });
            }}
            placeholder="Enter destination..."
            options={{ language: "en", limit: 5 }}
            theme={{
              variables: {
                fontFamily: "inherit",
                padding: "12px 48px 12px 42px",
                borderRadius: "8px",
                boxShadow: "none",
              },
              icons: {
                search: '<svg viewBox="0 0 1 1"></svg>',
              },
            }}
          />
          <button
            onClick={() => handleNavigationClick("dest")}
            disabled={isGettingCurrentLocation === "dest"}
            className={`absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#2bee6c] dark:hover:bg-slate-700 ${destQuery ? "hidden" : ""}`}
            title="Use Current Location"
          >
            <LocateFixed
              className={`h-4 w-4 ${isGettingCurrentLocation === "dest" ? "animate-spin text-[#2bee6c]" : ""}`}
            />
          </button>
        </div>
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
  );

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

        {/* Subtle Air Quality Blobs (desktop only) */}
        <div className="pointer-events-none absolute top-1/3 left-1/4 hidden h-64 w-64 rounded-full bg-[#2bee6c]/10 blur-3xl lg:block" />
        <div className="pointer-events-none absolute right-1/3 bottom-1/4 hidden h-96 w-96 rounded-full bg-[#2bee6c]/5 blur-[100px] lg:block" />

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

        {/* ===== MOBILE LAYOUT (< lg) ===== */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex flex-col transition-opacity duration-700 lg:hidden ${shouldShowLoader ? "opacity-0" : "opacity-100"}`}
        >
          {/* Spacer for AppNavbar */}
          <div className="h-14" />

          {/* Mobile Floating Map Controls */}
          <div
            className={`pointer-events-auto absolute top-18 right-4 flex flex-col gap-3 transition-opacity duration-300 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <button
              onClick={() => {
                mapRef.current?.flyTo({
                  center: sourceLocation
                    ? [sourceLocation.lng, sourceLocation.lat]
                    : [0, 0],
                  zoom: sourceLocation ? 14 : 2,
                  essential: true,
                  padding: getMobileMapPadding(),
                });
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur dark:bg-slate-900/90"
            >
              <LocateFixed className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Mobile AQI Badge */}
          <div className="pointer-events-none absolute top-18 left-4">
            <div className="flex items-center gap-2 rounded-lg bg-[#2bee6c]/90 px-3 py-2 shadow-lg backdrop-blur">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 text-slate-900"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z" />
              </svg>
              <span className="text-xs font-extrabold text-slate-900 uppercase">
                AQI: Good
              </span>
            </div>
          </div>

          {/* Spacer to push bottom sheet down */}
          <div className="flex-1" />

          {/* Mobile Bottom Sheet — Draggable */}
          <div
            ref={sheetRef}
            className={`pointer-events-auto flex flex-col items-center transition-opacity duration-300 ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{
              transform: sheetExpanded
                ? "translateY(0)"
                : "translateY(calc(100% - 72px))",
              transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
              willChange: "transform",
            }}
          >
            {/* Drag Handle Area — always visible for swipe */}
            <div
              className="flex w-full cursor-grab flex-col items-center pt-2 pb-0 active:cursor-grabbing"
              onTouchStart={handleSheetTouchStart}
              onTouchMove={handleSheetTouchMove}
              onTouchEnd={handleSheetTouchEnd}
              onClick={() => {
                if (!sheetExpanded) setSheetExpanded(true);
              }}
            >
              <div className="mb-3 h-1.5 w-12 rounded-full bg-white/40 shadow-sm" />
            </div>

            {/* Bottom Card */}
            <div className="w-full rounded-t-3xl bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:bg-slate-900">
              {/* Collapsed Peek Bar — shown when sheet is collapsed */}
              <div
                className={`flex items-center justify-between px-6 pt-4 pb-3 ${sheetExpanded ? "hidden" : ""}`}
                onTouchStart={handleSheetTouchStart}
                onTouchMove={handleSheetTouchMove}
                onTouchEnd={handleSheetTouchEnd}
                onClick={() => setSheetExpanded(true)}
              >
                <div>
                  <h2 className="text-base font-extrabold text-slate-800 dark:text-white">
                    Where are you heading?
                  </h2>
                  <p className="text-xs text-slate-400">Swipe up to search</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2bee6c]/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#2bee6c]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              <div
                ref={sheetContentRef}
                className={`overflow-y-auto px-6 pb-6 ${sheetExpanded ? "pt-4" : "hidden"}`}
                style={{ maxHeight: "60vh" }}
              >
                {/* Header */}
                <div
                  className="mb-5 space-y-1"
                  onTouchStart={handleSheetTouchStart}
                  onTouchMove={handleSheetTouchMove}
                  onTouchEnd={handleSheetTouchEnd}
                >
                  <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                    Where are you heading?
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Prioritize your health with clean-air routing.
                  </p>
                </div>

                {/* Search Inputs */}
                {renderSearchInputs()}

                {geoError && (
                  <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                    {geoError}
                  </div>
                )}

                {/* How It Works (compact mobile version) */}
                <div className="mt-6 border-y border-slate-100 py-4 dark:border-slate-800">
                  <h3 className="mb-4 text-xs font-bold tracking-widest text-slate-400 uppercase">
                    How it works
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2bee6c]/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-[#2bee6c]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm leading-tight font-bold text-slate-700 dark:text-slate-200">
                          Search
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Enter your destination
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2bee6c]/10">
                        <ArrowRight className="h-5 w-5 rotate-180 text-[#2bee6c]" />
                      </div>
                      <div>
                        <h4 className="text-sm leading-tight font-bold text-slate-700 dark:text-slate-200">
                          Compare
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          View real-time AQI across routes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#2bee6c]/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-[#2bee6c]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
                          <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
                          <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm leading-tight font-bold text-slate-700 dark:text-slate-200">
                          Breathe
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Enjoy your healthy commute
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-6">
                  <button
                    onClick={handleFindRoute}
                    disabled={!sourceLocation || !destLocation}
                    className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2bee6c] px-5 py-5 text-base font-extrabold text-[#102216] shadow-lg shadow-[#2bee6c]/25 transition-all hover:bg-[#2bee6c]/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="6" cy="19" r="3" />
                      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
                      <circle cx="18" cy="5" r="3" />
                    </svg>
                    <span>Find Healthy Route</span>
                  </button>
                  {routeError && (
                    <div className="mt-2 text-center text-xs font-semibold text-red-500">
                      {routeError}
                    </div>
                  )}
                </div>

                {/* Safe area bottom padding */}
                <div className="h-[max(1rem,env(safe-area-inset-bottom))]" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== DESKTOP LAYOUT (lg+) ===== */}
        <main
          className={`pointer-events-none absolute inset-0 z-20 mt-10 hidden h-full w-full flex-col items-start gap-6 px-4 pt-16 transition-opacity duration-700 md:pt-3 lg:flex lg:flex-row lg:justify-between lg:px-4 ${shouldShowLoader ? "opacity-0" : "opacity-100"}`}
        >
          {/* Left Section: Search Card */}
          <div
            className={`pointer-events-auto mt-3 w-full max-w-xs transition-opacity duration-300 xl:max-w-sm ${showControls ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <div className="rounded-xl border border-[#2bee6c]/10 bg-white p-6 shadow-2xl shadow-[#2bee6c]/5 dark:bg-slate-900/90">
              <h2 className="mb-1 text-lg font-bold">
                Start your healthy journey
              </h2>
              <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
                Enter your route to find the cleanest path.
              </p>

              {renderSearchInputs()}

              <div className="mt-6">
                <button
                  onClick={handleFindRoute}
                  disabled={!sourceLocation || !destLocation}
                  className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2bee6c] px-5 py-3 text-sm font-bold text-[#102216] shadow-lg shadow-[#2bee6c]/20 transition-all hover:bg-[#2bee6c]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>Find Cleanest Route</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                {routeError && (
                  <div className="mt-2 text-center text-xs font-semibold text-red-500">
                    {routeError}
                  </div>
                )}
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

          {/* Right Section: Onboarding (desktop only) */}
          <div
            className={`pointer-events-auto mt-3 w-full max-w-md transition-opacity duration-300 xl:max-w-xl ${
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
                    100+
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
