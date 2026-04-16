import express, { type Request, type Response, type NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";

const app = express();
const httpServer = createServer(app);

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req: Request, _res, buf) => {
      req.rawBody = Buffer.from(buf);
    },
  }),
);

app.use(
  express.urlencoded({
    extended: false,
    limit: "10mb",
  }),
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json.bind(res);

  res.json = ((bodyJson: unknown, ...args: unknown[]) => {
    capturedJsonResponse = bodyJson;
    return originalResJson(bodyJson as any, ...(args as any[]));
  }) as typeof res.json;

  res.on("finish", () => {
    const duration = Date.now() - start;

    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (capturedJsonResponse !== undefined) {
        try {
          const jsonText = JSON.stringify(capturedJsonResponse);
          logLine += ` :: ${jsonText.length > 300 ? jsonText.slice(0, 300) + "..." : jsonText}`;
        } catch {
          logLine += " :: [unserializable response]";
        }
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err?.status || err?.statusCode || 500;
      const message = err?.message || "Internal Server Error";

      console.error("Request error:", err);

      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    });

    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
    }

    const port = Number(process.env.PORT) || 5000;

    httpServer.listen(port, "0.0.0.0", () => {
      log(`serving on port ${port}`);
    });

    httpServer.on("error", (err) => {
      console.error("HTTP server error:", err);
    });
  } catch (err) {
    console.error("Startup failed:", err);
    process.exit(1);
  }
}

startServer();
