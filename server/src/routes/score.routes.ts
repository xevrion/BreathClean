import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { getScoreController } from "../controllers/score.controller.js";
import { tokenVerify } from "../middleware/tokenVerify.js";

const router = Router();

const scoreLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: "Too many score computation requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/compute", tokenVerify, scoreLimiter, getScoreController);

export default router;
