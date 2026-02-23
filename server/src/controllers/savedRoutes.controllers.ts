import { Request, Response } from "express";
import mongoose from "mongoose";

import BreakPoint from "../Schema/breakPoints.js";
import Route from "../Schema/route.schema.js";
import redis from "../utils/redis.js";

type BreakpointDoc = {
  routeId: mongoose.Types.ObjectId;
  routeOptionIndex: number;
  pointIndex: number;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
};

type RouteBreakpoints = Record<
  string,
  { lat: number; lon: number } | undefined
> & {
  point_1?: { lat: number; lon: number };
  point_2?: { lat: number; lon: number };
  point_3?: { lat: number; lon: number };
  point_4?: { lat: number; lon: number };
  point_5?: { lat: number; lon: number };
  point_6?: { lat: number; lon: number };
  point_7?: { lat: number; lon: number };
};

/**
 * GET  /saved-routes
 * Fetch all saved routes for the authenticated user.
 */
export const fetchSavedRoutes = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const routes = await Route.find({ userId }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, routes });
  } catch (error) {
    console.error("fetchSavedRoutes error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST  /saved-routes
 * Create / save a new route.
 */
export const saveRoute = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, from, to, routes, isFavorite, searchId } = req.body;

    if (!from || !to || !routes || routes.length === 0) {
      res
        .status(400)
        .json({ success: false, message: "from, to, and routes are required" });
      return;
    }

    const newRoute = await Route.create({
      userId,
      name,
      from,
      to,
      routes,
      isFavorite: isFavorite ?? false,
    });

    let routeBreakpointsData: RouteBreakpoints[] = [];

    if (searchId) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9-a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (typeof searchId === "string" && uuidRegex.test(searchId)) {
        try {
          const cached = (await redis.get(`route_search:${searchId}`)) as {
            breakpoints: RouteBreakpoints[];
          } | null;

          if (cached && cached.breakpoints) {
            routeBreakpointsData = cached.breakpoints;
          }
        } catch {
          /* redis miss — fall through to recompute */
        }
      }
    }

    if (routeBreakpointsData.length === 0) {
      try {
        const { computeBreakpoints } =
          await import("../utils/compute/breakPoint.compute.js");
        routeBreakpointsData = computeBreakpoints(routes) as RouteBreakpoints[];
      } catch (e) {
        console.error("Failed to re-compute breakpoints during save:", e);
      }
    }

    if (routeBreakpointsData.length > 0) {
      const breakPointDocs: BreakpointDoc[] = [];

      routeBreakpointsData.forEach((rb, routeIndex) => {
        Object.keys(rb).forEach((key) => {
          if (!key.startsWith("point_")) return;

          const parts = key.split("_");
          if (parts.length < 2) return;

          const idxStr = parts[1];
          if (!idxStr) return;

          const pointIndex = parseInt(idxStr, 10) - 1;
          if (Number.isNaN(pointIndex)) return;

          const coord = rb[key];
          if (coord) {
            breakPointDocs.push({
              routeId: newRoute._id,
              routeOptionIndex: routeIndex,
              pointIndex,
              location: {
                type: "Point",
                coordinates: [coord.lon, coord.lat],
              },
            });
          }
        });
      });

      if (breakPointDocs.length > 0) {
        await BreakPoint.insertMany(breakPointDocs);
      }
    }

    res.status(201).json({ success: true, route: newRoute });
  } catch (error) {
    console.error("saveRoute error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * DELETE  /saved-routes/:id
 * Delete a saved route by its ID.
 */
export const deleteRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    const route = await Route.findOneAndDelete({ _id: id, userId });

    if (!route) {
      res.status(404).json({ success: false, message: "Route not found" });
      return;
    }

    await BreakPoint.deleteMany({ routeId: route._id });

    res.status(200).json({ success: true, message: "Route deleted" });
  } catch (error) {
    console.error("deleteRoute error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH  /saved-routes/:id/favorite
 * Toggle the isFavorite flag on a saved route.
 */
export const toggleFavorite = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;
    const id = req.params.id as string;

    const route = await Route.findOne({ _id: id, userId });

    if (!route) {
      res.status(404).json({ success: false, message: "Route not found" });
      return;
    }

    route.isFavorite = !route.isFavorite;
    await route.save();

    res.status(200).json({ success: true, route });
  } catch (error) {
    console.error("toggleFavorite error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
