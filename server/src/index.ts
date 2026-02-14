import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import savedRoutesRoutes from "./routes/savedRoutes.routes.js";
import connectDB from "./utils/connectDB.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/saved-routes", savedRoutesRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Server is running" });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

export default app;
