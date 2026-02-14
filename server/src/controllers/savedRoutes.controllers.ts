import { Request, Response } from "express";

import Route from "../Schema/route.schema.js";

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

    const { name, from, to, routes, isFavorite } = req.body;

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
