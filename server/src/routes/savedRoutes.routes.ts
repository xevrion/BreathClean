import { Router } from "express";

import {
  deleteRoute,
  fetchSavedRoutes,
  saveRoute,
  toggleFavorite,
} from "../controllers/savedRoutes.controllers.js";
import { tokenVerify } from "../middleware/tokenVerify.js";

const router = Router();

// All routes require authentication
router.use(tokenVerify);

router.get("/", fetchSavedRoutes);
router.post("/", saveRoute);
router.delete("/:id", deleteRoute);
router.patch("/:id/favorite", toggleFavorite);

export default router;
