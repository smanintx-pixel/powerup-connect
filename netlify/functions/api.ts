import serverless from "serverless-http";
import { createApp } from "../../server/app";

// The whole API runs as one Netlify Function. netlify.toml sends /api/* here.
const run = serverless(createApp());
const FN_PREFIX = "/.netlify/functions/api";

export const handler = async (event: any, context: any) => {
  // Depending on how the request arrives, the path is either /api/... or
  // /.netlify/functions/api/... . The routes expect /api/... .
  if (typeof event.path === "string" && event.path.startsWith(FN_PREFIX)) {
    event.path = "/api" + event.path.slice(FN_PREFIX.length);
  }
  // Let the function finish as soon as the response is ready, without waiting
  // for the database connection to close.
  context.callbackWaitsForEmptyEventLoop = false;
  return run(event, context);
};
