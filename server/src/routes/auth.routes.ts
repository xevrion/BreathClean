import { Router } from "express";

import {
  getUser,
  googleCallback,
  googleLink,
  googleLogout,
} from "../controllers/oauth.controllers.js";
import { tokenVerify } from "../middleware/tokenVerify.js";

const routes = Router();

routes.get("/google/link", googleLink);
routes.get("/google/callback", googleCallback);
routes.get("/google/logout", googleLogout);
routes.get("/user", tokenVerify, getUser);
routes.get("/health", (_req, res) => res.json({ message: "ok" }));

export default routes;
