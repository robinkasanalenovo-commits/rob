import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// optional global (safe)
declare global {
  interface Window {
    Activity?: any;
  }
}

// service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// render app
createRoot(document.getElementById("root")!).render(
  <App />
);
