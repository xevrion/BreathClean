"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { ISavedRoute } from "./types";

interface RouteMapProps {
  routes: ISavedRoute[];
  selectedRouteId: string | null;
  selectedSubRouteIndex: number;
}

const ACTIVE_COLOR = "#2bee6c";
const INACTIVE_COLOR = "#94a3b8";

export default function RouteMap({
  routes,
  selectedRouteId,
  selectedSubRouteIndex,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapboxglRef = useRef<any>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // Initialize map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container || mapRef.current || !mapboxToken) return;

    let isCancelled = false;

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
          attributionControl: false,
        });

        mapRef.current = map;

        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          "bottom-right"
        );

        map.on("load", () => {
          if (!isCancelled) setMapReady(true);
        });

        const resize = () => map.resize();
        window.addEventListener("resize", resize);

        return () => {
          window.removeEventListener("resize", resize);
          map.remove();
        };
      } catch (err) {
        console.error("Error loading mapbox-gl:", err);
      }
    };

    const cleanup = initMap();

    return () => {
      isCancelled = true;
      cleanup?.then((fn) => fn?.());
      mapRef.current = null;
    };
  }, [mapboxToken]);

  // Clear old markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }, []);

  // Update map when selection changes
  useEffect(() => {
    const map = mapRef.current;
    const mapboxgl = mapboxglRef.current;
    if (!map || !mapboxgl || !mapReady) return;

    const selectedRoute = routes.find((r) => r._id === selectedRouteId);

    // Remove old sources/layers
    routes.forEach((route) => {
      route.routes.forEach((_, i) => {
        const layerId = `route-${route._id}-${i}`;
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      });
    });

    clearMarkers();

    if (!selectedRoute) return;

    // Add all sub-route polylines
    const allCoords: [number, number][] = [];

    selectedRoute.routes.forEach((subRoute, i) => {
      const layerId = `route-${selectedRoute._id}-${i}`;
      const isActive = i === selectedSubRouteIndex;

      map.addSource(layerId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: subRoute.routeGeometry,
        },
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: layerId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
          "line-width": isActive ? 5 : 3,
          "line-opacity": isActive ? 1 : 0.4,
        },
      });

      allCoords.push(...subRoute.routeGeometry.coordinates);
    });

    // Add markers for from/to
    const fromMarker = new mapboxgl.Marker({ color: ACTIVE_COLOR })
      .setLngLat(selectedRoute.from.location.coordinates)
      .addTo(map);

    const toMarker = new mapboxgl.Marker({ color: "#f43f5e" })
      .setLngLat(selectedRoute.to.location.coordinates)
      .addTo(map);

    markersRef.current = [fromMarker, toMarker];

    // Fit bounds
    if (allCoords.length > 0) {
      const lngs = allCoords.map((c) => c[0]);
      const lats = allCoords.map((c) => c[1]);

      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];

      map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
    }
  }, [routes, selectedRouteId, selectedSubRouteIndex, mapReady, clearMarkers]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full" />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f6f8f6] dark:bg-[#102216]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2bee6c] border-t-transparent" />
            <span className="text-xs text-slate-500">Loading map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
