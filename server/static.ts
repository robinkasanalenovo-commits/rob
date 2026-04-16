import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
    console.error("Static build not found.");
    console.error("Expected dist folder:", distPath);
    console.error("Expected index file:", indexPath);
    throw new Error("Client build files not found. Run build before starting production server.");
  }

  app.use(
    express.static(distPath, {
      index: false,
      maxAge: "1h",
      extensions: ["html"],
    }),
  );

  app.get("*", (_req, res) => {
    res.sendFile(indexPath);
  });
}
