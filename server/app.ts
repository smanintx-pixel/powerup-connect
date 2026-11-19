import express from "express";
import type { Express, Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

// Builds the API (no static files, no listening). Used by the local server in
// server/index.ts and by the Netlify Function in netlify/functions/api.ts.
export function createApp(): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "200kb" }));
  app.use(express.urlencoded({ extended: false }));

  // Request log: method, path, status and time only. Response bodies are never
  // logged because they can contain sign-in tokens and attendee details.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) {
        log(`${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`);
      }
    });
    next();
  });

  registerRoutes(app);

  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ message: "Not found." });
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message: status >= 500 ? "Something went wrong." : err.message });
  });

  return app;
}
