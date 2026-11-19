import "dotenv/config";
import { createServer } from "node:http";
import { createApp, log } from "./app";
import { serveStatic } from "./static";
import { seedDemoData } from "./seed";

// Local / always-on server. On Netlify the API runs from netlify/functions/api.ts
// instead and this file is not used.
(async () => {
  const app = createApp();
  const httpServer = createServer(app);

  // Demo attendees are only added when asked for: SEED_DEMO=1 npm run dev
  if (process.env.SEED_DEMO === "1") {
    await seedDemoData();
  }

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
