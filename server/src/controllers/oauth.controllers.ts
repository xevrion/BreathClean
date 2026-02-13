import { Request, Response } from "express";
import { simpleGoogleCallback, simpleGoogleLink } from "simply-auth";

import { userAdapter } from "../utils/userAdapter.js";

const clientId = process.env.GOOGLE_CLIENT_ID!;
const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const accessSecret = process.env.ACCESS_TOKEN_SECRET!;
const refreshSecret = process.env.REFRESH_TOKEN_SECRET!;

export const googleLink = async (_req: Request, res: Response) => {
  try {
    const response = simpleGoogleLink(clientId, redirectUri);
    return res.json({ url: response });
  } catch (error) {
    console.error("Error in googleLink:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;
    console.log(code);
    const response = await simpleGoogleCallback(
      code as string,
      clientId,
      redirectUri,
      clientSecret,
      {
        accessSecret,
        refreshSecret,
        accessExpiry: "15d",
        refreshExpiry: "30d",
      },
      userAdapter
    );

    if (!response.user) {
      return res.status(401).json({ error: "Google authentication failed" });
    }
    res.cookie("refreshToken", response.tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30 * 1000,
    });
    return res.redirect("http://localhost:3000/home");
  } catch (error) {
    console.log("Error in googleCallback:", error);
    return res.status(500).json({ errorMsg: "Internal server error", error });
  }
};

export const googleLogout = async (_req: Request, res: Response) => {
  try {
    res.clearCookie("refreshToken");
    return res.redirect("http://localhost:3000");
  } catch (error) {
    console.log("Error in googleLogout:", error);
    return res.status(500).json({ errorMsg: "Internal server error", error });
  }
};
